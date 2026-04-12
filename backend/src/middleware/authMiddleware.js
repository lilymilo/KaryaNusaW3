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

export const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      req.user = user;
    }
  } catch (err) {
  }
  next();
};
