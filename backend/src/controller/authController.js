import { supabase, getAuthClient } from '../config/supabaseClient.js';

export const register = async (req, res) => {
  const { email, password, full_name, shop_name, role, username, phone_number, shop_address, shop_contact } = req.body;

  // 1. Sistem auth supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${req.headers.origin || 'http://localhost:5173'}/home`
    }
  });


  if (authError) {
    console.error("Auth Register Error:", authError.message);
    return res.status(400).json({ error: authError.message });
  }

  // 2. Jika berhaasil, ambil ID-nya dan masukkan ke tabel profiles
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([
        { 
          id: authData.user.id, // ID dari Auth
          email: email, // Store email for easier querying
          full_name: full_name || null, 
          shop_name: shop_name || null, 
          role: role || 'buyer', // Default ke buyer
          username: username || null,
          phone_number: phone_number || null,
          shop_address: shop_address || null,
          shop_contact: shop_contact || null
        }
      ]);

    if (profileError) {
      console.error("Profile Creation Error:", profileError.message);
      return res.status(400).json({ error: profileError.message });
    }

    // Ambil data profil lengkap untuk dikembalikan ke frontend
    const { data: fullProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    const needsConfirmation = !authData.session;

    res.status(201).json({ 
      message: needsConfirmation 
        ? "Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun." 
        : "Registrasi Berhasil!", 
      user: {
        ...authData.user,
        ...fullProfile
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
  const { email, password, role } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return res.status(400).json({ error: error.message });

  // Ambil profil lengkap dari database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    return res.status(400).json({ error: profileError.message });
  }

  // Jika user memilih role tertentu saat login, kita bisa memvalidasi di sini
  // Namun untuk saat ini kita biarkan masuk dan gunakan role dari database
  const dbProfile = profile;

  const userDisplay = {
    id: data.user.id,
    email: data.user.email,
    full_name: dbProfile?.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User',
    username: dbProfile?.username || null,
    phone_number: dbProfile?.phone_number || null,
    shop_name: dbProfile?.shop_name || 'Personal Shop',
    shop_description: dbProfile?.shop_description || null,
    shop_address: dbProfile?.shop_address || null,
    shop_contact: dbProfile?.shop_contact || null,
    shop_logo_url: dbProfile?.shop_logo_url || null,
    shop_banner_url: dbProfile?.shop_banner_url || null,
    role: dbProfile?.role || 'buyer',
    avatar: dbProfile?.avatar || data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null
  };

  res.json({
    message: "Login Berhasil. Selamat datang :)",
    token: data.session.access_token,
    user: userDisplay,
    role: userDisplay.role
  });
};


export const getAccount = async (req, res) => {
  try {
    // req.user didapatkan dari middleware 'protect' yang sudah kita buat
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    // Jika profil tidak ditemukan (baru pertama kali login via Google)
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || req.user.user_metadata?.name || 'User',
            role: 'buyer' // Default role, akan diupdate oleh frontend jika perlu
          }
        ])
        .select()
        .single();
      
      if (insertError) throw insertError;
      profile = newProfile;
    } else if (profileError) {
      throw profileError;
    }

    console.log("Supabase User Metadata:", req.user.user_metadata);

    // Database Profile Data
    const dbProfile = profile;

    const userDisplay = {
      id: req.user.id,
      email: req.user.email,
      full_name: dbProfile?.full_name || req.user.user_metadata?.full_name || req.user.user_metadata?.name || 'User',
      username: dbProfile?.username || null,
      phone_number: dbProfile?.phone_number || null,
      shop_name: dbProfile?.shop_name || 'Personal Shop',
      shop_description: dbProfile?.shop_description || null,
      shop_address: dbProfile?.shop_address || null,
      shop_contact: dbProfile?.shop_contact || null,
      shop_logo_url: dbProfile?.shop_logo_url || null,
      shop_banner_url: dbProfile?.shop_banner_url || null,
      role: dbProfile?.role || 'buyer',
      avatar: dbProfile?.avatar || req.user.user_metadata?.avatar_url || req.user.user_metadata?.picture || null
    };

    console.log("User Display Object:", userDisplay);

    res.json({
      message: "Data profil berhasil diambil",
      user: userDisplay
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Perbarui Profil (Akun & Toko)
export const updateProfile = async (req, res) => {
  try {
    const { 
      full_name, username, phone_number, role,
      shop_name, shop_description, shop_address, shop_contact 
    } = req.body;

    const authSupabase = getAuthClient(req);
    let updateData = {};

    // Map fields
    if (full_name) updateData.full_name = full_name;
    if (username) updateData.username = username;
    if (phone_number) updateData.phone_number = phone_number;
    if (role) updateData.role = role;
    if (shop_name) updateData.shop_name = shop_name;
    if (shop_description) updateData.shop_description = shop_description;
    if (shop_address) updateData.shop_address = shop_address;
    if (shop_contact) updateData.shop_contact = shop_contact;

    // Handle Image Uploads (Avatar, Logo, Banner)
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

    // Return consistent structure
    const userDisplay = {
      id: req.user.id,
      email: req.user.email,
      full_name: updatedProfile.full_name || req.user.user_metadata?.full_name || req.user.user_metadata?.name || 'User',
      username: updatedProfile.username || null,
      phone_number: updatedProfile.phone_number || null,
      shop_name: updatedProfile.shop_name || 'Personal Shop',
      shop_description: updatedProfile.shop_description || null,
      shop_address: updatedProfile.shop_address || null,
      shop_contact: updatedProfile.shop_contact || null,
      shop_logo_url: updatedProfile.shop_logo_url || null,
      shop_banner_url: updatedProfile.shop_banner_url || null,
      role: updatedProfile.role || 'buyer',
      avatar: updatedProfile.avatar || req.user.user_metadata?.avatar_url || req.user.user_metadata?.picture || null
    };

    res.json({ message: "Profil berhasil diperbarui", user: userDisplay });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Logout (Keluar dari sesi)
export const logout = async (req, res) => {
  const { error } = await supabase.auth.signOut();
  
  if (error) return res.status(400).json({ error: error.message });
  
  res.json({ message: "Berhasil Logout. Selamat tinggal :(" });
};