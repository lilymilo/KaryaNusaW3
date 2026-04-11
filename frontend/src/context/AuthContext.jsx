import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase Auth state with our Context
  useEffect(() => {
    const syncAuth = async () => {
      try {
        // Check if we are in an auth redirect flow (contains access_token in hash)
        const hasHash = window.location.hash.includes('access_token=');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          localStorage.setItem('token', session.access_token);
          try {
            const { data } = await api.get('/auth/me', {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch (err) {
            console.error("Failed to sync profile:", err);
            // Help teammates debug "bouncing" issues
            if (err.response?.status === 401) {
              toast.error("Gagal sinkronisasi profil. Pastikan kredensial Supabase di backend & frontend sama.");
            }
          }
        } else if (hasHash) {
          // We have a hash but no session yet, Supabase is likely processing it.
          console.log("Auth hash detected, waiting for session...");
          // After 5 seconds, if still no session, stop loading
          setTimeout(() => setLoading(false), 5000);
          return; // Don't call setLoading(false) yet
        }
      } catch (err) {
        console.error("Initial auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    syncAuth();


    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        localStorage.setItem('token', session.access_token);
        try {
          const { data } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          
          let currentUser = data.user;
          const pendingRole = localStorage.getItem('pending_role');

          if (pendingRole && currentUser.role !== pendingRole) {
            console.log("Updating pending role to:", pendingRole);
            const { data: updatedData } = await api.put('/auth/profile', 
              { role: pendingRole },
              { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            currentUser = updatedData.user;
            localStorage.removeItem('pending_role');
          }

          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (err) {
          console.error("Failed to sync profile:", err);
        }
        // Clean up OAuth hash fragment from URL
        if (window.location.hash.includes('access_token=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password, role = null) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    
    // Simpan token dan user lengkap (yang sudah berisi role dari profil)
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);
    return data;
  };


  const loginWithGoogle = async (role = null) => {
    try {
      if (role) {
        localStorage.setItem('pending_role', role);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/home'
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google Login Error:", err);
      throw err;
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
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, updateUserData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
