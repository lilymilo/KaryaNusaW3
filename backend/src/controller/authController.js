import { supabase, supabaseAdmin, getAuthClient } from '../config/supabaseClient.js';
import { ethers } from 'ethers';
import crypto from 'crypto';

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

/** Nilai yang mungkin tersimpan di profiles.wallet_address (case / format beda). */
const walletAddressLookupVariants = (walletAddress, chain) => {
  const raw = (walletAddress || '').trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const set = new Set([lower]);
  try {
    set.add(ethers.getAddress(raw));
  } catch {
    /* bukan format EVM checksummed */
  }
  return [...set];
};

/** Pakai .limit(1) + array (bukan maybeSingle) agar 0 baris tidak kena error PostgREST tertentu. */
const fetchProfileByWallet = async (admin, walletAddress, chain) => {
  const variants = walletAddressLookupVariants(walletAddress, chain);
  let q = admin.from('profiles').select('*');
  if (variants.length === 1) {
    q = q.eq('wallet_address', variants[0]);
  } else {
    q = q.or(variants.map((v) => `wallet_address.eq.${v}`).join(','));
  }
  const { data: rows, error } = await q.limit(1);
  return { existingProfile: rows?.[0] ?? null, profileLookupError: error };
};

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Shared helper: builds the userDisplay object from a DB profile + auth user.
 * Eliminates 3x identical duplication across login, getAccount, updateProfile.
 */
const buildUserDisplay = (profile, authUser) => ({
  id: authUser.id,
  email: authUser.email,
  full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
  username: profile?.username || null,
  phone_number: profile?.phone_number || null,
  shop_name: profile?.shop_name || 'Personal Shop',
  shop_description: profile?.shop_description || null,
  shop_address: profile?.shop_address || null,
  shop_contact: profile?.shop_contact || null,
  shop_logo_url: profile?.shop_logo_url || null,
  shop_banner_url: profile?.shop_banner_url || null,
  role: profile?.role || 'seller',
  avatar: profile?.avatar || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
  wallet_address: profile?.wallet_address || null,
  balance: profile?.balance || 0,
});


export const walletLogin = async (req, res) => {
  try {
    const { walletAddress, signature, message, chain, role } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Wallet address, signature, dan message diperlukan.' });
    }

    let isValid = false;

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      isValid = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (verifyErr) {
      console.error('EVM signature verification error:', verifyErr);
      isValid = false;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Tanda tangan wallet tidak valid. Silakan coba lagi.' });
    }

    const adminClient = supabaseAdmin || supabase;
    
    if (!supabaseAdmin) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY missing — fallback to anon client. Profile lookup might fail if RLS is strict.');
    }

    const { existingProfile, profileLookupError } = await fetchProfileByWallet(
      adminClient,
      walletAddress,
      chain
    );

    if (profileLookupError) {
      console.error('Profile lookup error (wallet-login):', profileLookupError);
      
      let errorDetail = 'Gagal mencari data akun.';
      if (profileLookupError.message?.includes('does not exist')) {
        errorDetail = 'Tabel atau kolom "wallet_address" tidak ditemukan di Supabase.';
      } else if (profileLookupError.code === 'PGRST116') {
        // query maybeSingle but result not found - handled by existingProfile check
      } else if (profileLookupError.message?.includes('fetch') || profileLookupError.code === 'ERR_NETWORK') {
        errorDetail = 'Tidak dapat terhubung ke Supabase. Periksa SUPABASE_URL di backend/.env.';
      }

      const hint = [profileLookupError.message, profileLookupError.code, profileLookupError.details]
        .filter(Boolean)
        .join(' — ');

      return res.status(500).json({
        error: errorDetail,
        hint: hint || 'Jalankan SQL di Supabase: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE; — dan pastikan SUPABASE_URL + SERVICE_ROLE_KEY valid.',
      });
    }
    

    const normalizedWalletKey = walletAddress.toLowerCase();

    let userData, sessionToken, refreshToken;

    if (existingProfile) {
      const walletEmail = `${walletAddress.toLowerCase()}@wallet.karyanusa.com`;
      const walletPassword = walletAddress.toLowerCase() + '_karyanusa_wallet_v1';

      // SELF-HEALING: Ensure the existng user is synced with the latest standardized credentials
      if (supabaseAdmin) {
        try {
          // 1. If the stored email is old (.local), update it to .com in both Auth and Profiles
          const currentEmail = existingProfile.email || '';
          if (currentEmail.endsWith('.local')) {
            console.log(`[WalletLogin] Self-healing: Migrating ${existingProfile.id} from .local to .com`);
            await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, { 
              email: walletEmail, 
              email_confirm: true 
            });
            
            await adminClient.from('profiles').update({ email: walletEmail }).eq('id', existingProfile.id);
            existingProfile.email = walletEmail;
          }

          // 2. Always sync password to ensure the hardcoded wallet password format works
          await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, { 
            password: walletPassword 
          });
        } catch (syncErr) {
          console.warn(`[WalletLogin] Self-healing sync failed for ${existingProfile.id}:`, syncErr.message);
        }
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: existingProfile.email || walletEmail,
        password: walletPassword
      });

      if (signInError) {
        console.error("Wallet sign-in error:", signInError);
        return res.status(400).json({ error: 'Gagal masuk dengan wallet. Silakan coba lagi.' });
      }
      
      let userRole = 'seller';

      sessionToken = signInData.session.access_token;
      refreshToken = signInData.session.refresh_token;
      userData = {
        id: existingProfile.id,
        email: walletEmail,
        full_name: existingProfile.full_name || `Wallet User`,
        username: existingProfile.username || null,
        phone_number: existingProfile.phone_number || null,
        shop_name: existingProfile.shop_name || 'Personal Shop',
        shop_description: existingProfile.shop_description || null,
        shop_address: existingProfile.shop_address || null,
        shop_contact: existingProfile.shop_contact || null,
        shop_logo_url: existingProfile.shop_logo_url || null,
        shop_banner_url: existingProfile.shop_banner_url || null,
        role: userRole,
        avatar: existingProfile.avatar || null,
        wallet_address: existingProfile.wallet_address,
        balance: existingProfile.balance || 0,
      };
    } else {
      const walletEmail = `${walletAddress.toLowerCase()}@wallet.karyanusa.com`;
      const walletPassword = walletAddress.toLowerCase() + '_karyanusa_wallet_v1';
      const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      const userRole = 'seller';

      let authData, authError;

      if (supabaseAdmin) {
        const res = await supabaseAdmin.auth.admin.createUser({
          email: walletEmail,
          password: walletPassword,
          email_confirm: true,
          user_metadata: {
            full_name: `Wallet ${shortAddr}`,
            wallet_address: normalizedWalletKey,
            role: userRole
          }
        });
        authData = { user: res.data.user };
        authError = res.error;
      } else {
        const res = await supabase.auth.signUp({
          email: walletEmail,
          password: walletPassword,
          options: {
            data: {
              full_name: `Wallet ${shortAddr}`,
              wallet_address: normalizedWalletKey,
              role: userRole
            }
          }
        });
        authData = res.data;
        authError = res.error;
      }

      if (authError) {
        console.error("Wallet signup error:", authError);
        return res.status(400).json({ error: authError.message });
      }

      // Check if user object exists after signup (usually true if email confirmation is disabled)
      const userId = authData?.user?.id;
      if (!userId) {
        return res.status(400).json({ error: 'Berhasil daftar, tetapi mohon konfirmasi email terlebih dahulu.' });
      }

      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert([{
          id: userId,
          email: walletEmail,
          full_name: `Wallet ${shortAddr}`,
          wallet_address: normalizedWalletKey,
          role: userRole,
        }]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return res.status(400).json({ error: profileError.message });
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: walletEmail,
        password: walletPassword
      });

      if (signInError) {
        console.error("Post-signup sign-in error:", signInError);
        return res.status(400).json({ error: 'Akun dibuat tetapi gagal login otomatis. Silakan coba lagi.' });
      }

      sessionToken = signInData.session.access_token;
      refreshToken = signInData.session.refresh_token;
      userData = {
        id: userId,
        email: walletEmail,
        full_name: `Wallet ${shortAddr}`,
        username: null,
        phone_number: null,
        shop_name: 'Personal Shop',
        shop_description: null,
        shop_address: null,
        shop_contact: null,
        shop_logo_url: null,
        shop_banner_url: null,
        role: userRole,
        avatar: null,
        wallet_address: normalizedWalletKey,
      };
    }

    res.json({
      message: existingProfile ? 'Login wallet berhasil!' : 'Akun wallet berhasil dibuat!',
      token: sessionToken,
      refresh_token: refreshToken,
      user: userData,
      isNewUser: !existingProfile,
    });
  } catch (error) {
    console.error("Wallet login error:", error);
    res.status(500).json({ error: 'Terjadi kesalahan pada autentikasi wallet.' });
  }
};

export const linkWallet = async (req, res) => {
  try {
    const { walletAddress, signature, message, chain } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Wallet address, signature, dan message diperlukan untuk menghubungkan wallet.' });
    }

    let isValid = false;

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      isValid = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (verifyErr) {
      console.error('EVM link verification error:', verifyErr);
      isValid = false;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Tanda tangan wallet tidak valid.' });
    }

    const normalizedWalletKey =
      chain && String(chain).startsWith('solana')
        ? walletAddress.trim()
        : walletAddress.toLowerCase();

    const authSupabase = getAuthClient(req);
    
    // Fallback to anon client for querying if admin not available
    const adminClient = supabaseAdmin || authSupabase;

    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('wallet_address', normalizedWalletKey)
      .maybeSingle();

    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ error: 'Wallet ini sudah terhubung dengan akun lain.' });
    }

    const { data: updatedProfile, error } = await authSupabase
      .from('profiles')
      .update({ wallet_address: normalizedWalletKey })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "Wallet berhasil dihubungkan ke akun Anda!",
      user: {
        ...req.user,
        wallet_address: normalizedWalletKey
      }
    });
  } catch (error) {
    console.error("Link wallet error:", error);
    res.status(500).json({ error: error.message || 'Gagal menghubungkan wallet.' });
  }
};

export const register = async (req, res) => {
  const { email, password, full_name, shop_name, role, username, phone_number, shop_address, shop_contact } = req.body;

  const validatedPhone = validateWA(phone_number);
  if (phone_number && !validatedPhone) {
    return res.status(400).json({ error: "Nomor WhatsApp tidak valid. Gunakan format 08xx atau +628xx" });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        username,
        shop_name,
        phone_number: validatedPhone,
        role: 'seller'
      },
      emailRedirectTo: `${req.headers.origin || 'http://localhost:5173'}/home`
    }
  });


  if (authError) {
    console.error("Auth Register Error:", authError.message);
    return res.status(400).json({ error: authError.message });
  }

  if (authData.user) {
    let profileError = null;
    let fullProfile = null;
    
    // Mekanisme Retry untuk mengatasi Race Condition di Supabase (FK profiles_id_fkey)
    for (let i = 0; i < 3; i++) {
      const adminClient = supabaseAdmin || supabase;
      const { data: upsertData, error: upsertError } = await adminClient
        .from('profiles')
        .upsert([
          { 
            id: authData.user.id,
            email: email,
            full_name: full_name || null, 
            shop_name: shop_name || null, 
            role: 'seller',
            username: username || null,
            phone_number: validatedPhone,
            shop_address: shop_address || null,
            shop_contact: shop_contact || null
          }
        ])
        .select()
        .single();

      if (!upsertError) {
        profileError = null;
        fullProfile = upsertData;
        break; 
      }

      profileError = upsertError;
      // Jika errornya adalah Foreign Key violation (23503), tunggu sebentar lalu coba lagi
      if (upsertError.code === '23503') {
        console.warn(`[Register] Profile creation failed (FK violation), retrying in 500ms... (Attempt ${i+1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        break; // Jika error lain, langsung stop
      }
    }

    if (profileError) {
      console.error("Profile Creation Final Error:", profileError.message);
      return res.status(400).json({ error: profileError.message });
    }

    const adminClient = supabaseAdmin || supabase;
    const { data: verifiedProfile, error: fetchProfileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (fetchProfileError) {
      console.error("Fetch Profile Error after register:", fetchProfileError.message);
    }

    const needsConfirmation = !authData.session;

    res.status(201).json({ 
      message: needsConfirmation 
        ? "Registrasi sedang diproses! Silakan verifikasi email Anda (periksa juga folder Spam) untuk mengaktifkan akun." 
        : "Registrasi Berhasil! Akun Anda siap digunakan.", 
      user: {
        ...authData.user,
        ...(verifiedProfile || fullProfile)
      },
      token: authData.session?.access_token || null,
      needsConfirmation
    });
  } else {
    const needsConfirmation = !authData.session;
    res.status(201).json({ 
      message: "Registrasi Berhasil!", 
      user: authData.user,
      token: authData.session?.access_token || null,
      needsConfirmation
    });
  }
};

export const login = async (req, res) => {
  const { email: identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username dan password wajib diisi.' });
  }

  let loginAuthData = null;

  const adminClient = supabaseAdmin || supabase;
  const { data: matchedProfile } = await adminClient.from('profiles')
    .select('*')
    .or(`email.ilike.${identifier},username.ilike.${identifier},wallet_address.ilike.${identifier}`)
    .maybeSingle();

  if (matchedProfile) {
    // 1. If user has wallet + custom_password, try that first
    if (matchedProfile.wallet_address && matchedProfile.custom_password) {
      const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
      if (matchedProfile.custom_password === hashedInput) {
        const walletEmail = `${matchedProfile.wallet_address.toLowerCase()}@wallet.karyanusa.com`;
        const hiddenPass = matchedProfile.wallet_address.toLowerCase() + '_karyanusa_wallet_v1';
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email: walletEmail, password: hiddenPass });
        if (!error && authData.session) loginAuthData = authData;
      }
    }

    // 2. If wallet path didn't work, try email-based Supabase auth
    if (!loginAuthData && matchedProfile.email) {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email: matchedProfile.email, password });
      if (!error && authData.session) loginAuthData = authData;
    }
  }

  // 3. Fallback: try identifier directly as email (for users not yet in profiles table)
  if (!loginAuthData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
    if (error) return res.status(400).json({ error: 'Kredensial tidak valid atau akun tidak ditemukan.' });
    loginAuthData = authData;
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', loginAuthData.user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error("Login Profile Fetch Error:", profileError.message);
    return res.status(400).json({ error: "Gagal mengambil data profil. Silakan coba lagi." });
  }

  const dbProfile = profile || matchedProfile;
  const userDisplay = buildUserDisplay(dbProfile, loginAuthData.user);

  res.json({
    message: "Login Berhasil. Selamat datang :)",
    token: loginAuthData.session.access_token,
    refresh_token: loginAuthData.session.refresh_token,
    user: userDisplay,
    role: userDisplay.role
  });
};


export const getAccount = async (req, res) => {
  try {
    const authClient = supabaseAdmin || getAuthClient(req);
    let { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const metaAvatar = req.user.user_metadata?.avatar_url || req.user.user_metadata?.picture || null;

    if (profileError && profileError.code === 'PGRST116') {
      const authClient = supabaseAdmin || getAuthClient(req);
      const { data: newProfile, error: insertError } = await authClient
        .from('profiles')
        .insert([
          {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || req.user.user_metadata?.name || 'User',
            avatar: metaAvatar,
            role: 'seller'
          }
        ])
        .select()
        .single();
      
      if (insertError) throw insertError;
      profile = newProfile;
    } else if (profileError) {
      throw profileError;
    } else {
      if (!profile.avatar && metaAvatar) {
        const authClient = supabaseAdmin || getAuthClient(req);
        const { data: updatedProfile } = await authClient
          .from('profiles')
          .update({ avatar: metaAvatar })
          .eq('id', req.user.id)
          .select()
          .single();
        if (updatedProfile) profile = updatedProfile;
      }
    }

    const userDisplay = buildUserDisplay(profile, req.user);

    res.json({
      message: "Data profil berhasil diambil",
      user: userDisplay
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { 
      full_name, username, phone_number, role,
      shop_name, shop_description, shop_address, shop_contact 
    } = req.body;

    const authSupabase = getAuthClient(req);
    let updateData = {};

    if (full_name) updateData.full_name = full_name;
    if (username) updateData.username = username;
    
    if (phone_number) {
      const validatedPhone = validateWA(phone_number);
      if (!validatedPhone) {
        return res.status(400).json({ error: "Nomor WhatsApp tidak valid. Gunakan format 08xx atau +628xx" });
      }
      updateData.phone_number = validatedPhone;
    }

    if (role) updateData.role = role;
    if (shop_name) updateData.shop_name = shop_name;
    if (shop_description) updateData.shop_description = shop_description;
    if (shop_address) updateData.shop_address = shop_address;
    if (shop_contact) updateData.shop_contact = shop_contact;

    const handleUpload = async (file, bucket) => {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${req.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await authSupabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = authSupabase.storage.from(bucket).getPublicUrl(fileName);
      return publicUrl;
    };

    if (req.files) {
      if (req.files.avatar) updateData.avatar = await handleUpload(req.files.avatar[0], 'avatars');
      if (req.files.shop_logo) updateData.shop_logo_url = await handleUpload(req.files.shop_logo[0], 'shops');
      if (req.files.shop_banner) updateData.shop_banner_url = await handleUpload(req.files.shop_banner[0], 'shops');
    }

    const { data: updatedProfile, error: updateError } = await authSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const userDisplay = buildUserDisplay(updatedProfile, req.user);

    res.json({ message: "Profil berhasil diperbarui", user: userDisplay });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  const { error } = await supabase.auth.signOut();
  
  if (error) return res.status(400).json({ error: error.message });
  
  res.json({ message: "Berhasil Logout. Selamat tinggal :(" });
};

export const setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'Password baru diperlukan.' });

    // Use admin client for consistent permissions
    const admin = supabaseAdmin || supabase;
    
    const { data: profile } = await admin.from('profiles')
      .select('wallet_address')
      .eq('id', req.user.id)
      .single();

    if (profile && profile.wallet_address) {
      // For wallet users, we allow setting a custom password for manual login
      const hashed = crypto.createHash('sha256').update(newPassword).digest('hex');
      const { error } = await admin.from('profiles')
        .update({ custom_password: hashed })
        .eq('id', req.user.id);
      
      if (error) throw error;
      
      // Also update the hidden auth password so regular sign-in works
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.updateUserById(req.user.id, { 
          password: newPassword 
        });
      }
    } else {
      // For standard email users
      if (supabaseAdmin) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { 
          password: newPassword 
        });
        if (error) throw error;
      } else {
        // Fallback (might still hit session missing if service key is absent)
        const authSupabase = getAuthClient(req);
        const { error } = await authSupabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
    }

    res.json({ message: "Password berhasil disimpan. Kini Anda bisa menggunakannya untuk login manual." });
  } catch (error) {
    console.error("Set Password Error:", error);
    res.status(500).json({ error: error.message || "Gagal menyimpan password" });
  }
};