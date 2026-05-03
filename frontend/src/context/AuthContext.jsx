import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { supabase } from '../api/supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const OAUTH_WAIT_MS = 10000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const oauthTimerRef = useRef(null);

  const clearOauthTimer = useCallback(() => {
    if (oauthTimerRef.current) {
      clearTimeout(oauthTimerRef.current);
      oauthTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safeSetLoading = (v) => {
      if (!cancelled) setLoading(v);
    };

    const stripAuthHash = () => {
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    const applySessionUser = async (session) => {
      if (!session) return;
      localStorage.setItem('token', session.access_token);
      await fetchUserByToken(session.access_token);
    };

    const fetchUserByToken = async (token) => {
      if (!token) return;
      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        let currentUser = data.user;

        if (!cancelled) {
          setUser(currentUser);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } catch (err) {
        console.error('Failed to sync profile:', err);
        if (err.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!cancelled) setUser(null);
        } else if (!err.response) {
          toast.error('Server backend tidak terdeteksi.');
        }
      }
    };

    (async () => {
      safeSetLoading(true);
      try {
        const hashHasToken = window.location.hash.includes('access_token=');
        const localToken = localStorage.getItem('token');
        const cachedUser = localStorage.getItem('user');

        // Fast path: show cached user immediately (no network wait)
        if (localToken && cachedUser && !hashHasToken) {
          try {
            const parsed = JSON.parse(cachedUser);
            if (!cancelled) {
              setUser(parsed);
              safeSetLoading(false);
            }
          } catch { /* corrupt cache, continue normal flow */ }

          // Verify token in background (non-blocking)
          fetchUserByToken(localToken).catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!cancelled) setUser(null);
          });
          return;
        }

        // Supabase session check (for Google OAuth returning users)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          await applySessionUser(session);
          safeSetLoading(false);
          return;
        }

        if (localToken) {
          await fetchUserByToken(localToken);
          safeSetLoading(false);
          return;
        }

        if (hashHasToken) {
          oauthTimerRef.current = setTimeout(() => {
            oauthTimerRef.current = null;
            safeSetLoading(false);
            stripAuthHash();
            toast.error('Login Google timeout atau gagal. Silakan coba lagi.');
          }, OAUTH_WAIT_MS);
          return;
        }

        safeSetLoading(false);
      } catch (err) {
        console.error('Initial auth check failed:', err);
        safeSetLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      if (event === 'TOKEN_REFRESHED' && session) {
        clearOauthTimer();
        localStorage.setItem('token', session.access_token);
        safeSetLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        clearOauthTimer();
        await applySessionUser(session);
        stripAuthHash();
        safeSetLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        clearOauthTimer();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        safeSetLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearOauthTimer();
      subscription.unsubscribe();
    };
  }, [clearOauthTimer]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    // Sync Supabase session so onAuthStateChange & token refresh work
    try {
      if (data.refresh_token) {
        await supabase.auth.setSession({
          access_token: data.token,
          refresh_token: data.refresh_token,
        });
      }
    } catch (e) {
      console.warn('Supabase session sync skipped:', e.message);
    }

    return data;
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google Login Error:', err);
      throw err;
    }
  };

  const loginWithWallet = async (walletAddress, signature, message, chain) => {
    try {
      const { data } = await api.post('/auth/wallet-login', {
        walletAddress,
        signature,
        message,
        chain,
      });

      if (data.token) {
        try {
          await supabase.auth.setSession({
            access_token: data.token,
            refresh_token: data.refresh_token || data.token,
          });
        } catch (sessionErr) {
          console.warn('setSession fallback:', sessionErr.message);
          localStorage.setItem('token', data.token);
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Login wallet gagal';
      console.error('Wallet Login Error:', err);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const linkWallet = async (walletAddress, signature, message, chain) => {
    try {
      const { data } = await api.post('/auth/link-wallet', {
        walletAddress,
        signature,
        message,
        chain,
      });

      if (data.user) {
        updateUserData(data.user);
      }
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Gagal menghubungkan wallet';
      console.error('Link Wallet Error:', err);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    if (data.token && !data.needsConfirmation) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUserData = (newData) => {
    setUser(newData);
    localStorage.setItem('user', JSON.stringify(newData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        loginWithWallet,
        linkWallet,
        register,
        logout,
        updateUserData,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
