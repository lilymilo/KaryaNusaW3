import { supabase } from '../config/supabaseClient.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Akses ditolak! Kamu harus login dulu untuk melakukan aksi ini.' 
    });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error("Auth Token Error:", error.message);
      return res.status(401).json({ error: 'Sesi Anda telah berakhir atau token tidak valid. Silakan login kembali.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan atau tidak valid.' });
    }

    req.user = user;
    next();
    
  } catch (err) {
    console.error("Auth Middleware Crash:", err.message);
    res.status(500).json({ error: 'Terjadi kesalahan pada sistem verifikasi keamanan.' });
  }
};

export const sellerOnly = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (profileError || profile.role !== 'seller') {
      return res.status(403).json({ 
        error: 'Akses dilarang! Hanya akun dengan role Seller yang bisa melakukan aksi ini.' 
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Gagal memverifikasi role user.' });
  }
};