import { getAuthClient } from '../config/supabaseClient.js';

// 1. Ambil semua item di wishlist user
export const getWishlist = async (req, res) => {
  try {
    const authSupabase = getAuthClient(req);
    const { data, error } = await authSupabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Tambah atau Hapus dari wishlist (Toggle)
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const authSupabase = getAuthClient(req);

    // Cek apakah sudah ada
    const { data: existing, error: checkError } = await authSupabase
      .from('wishlist')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Jika ada, hapus
      const { error: deleteError } = await authSupabase
        .from('wishlist')
        .delete()
        .eq('id', existing.id);
      
      if (deleteError) throw deleteError;
      return res.json({ message: "Dihapus dari wishlist", active: false });
    } else {
      // Jika tidak ada, tambah
      const { error: insertError } = await authSupabase
        .from('wishlist')
        .insert([{ user_id: req.user.id, product_id: productId }]);
      
      if (insertError) throw insertError;
      return res.json({ message: "Ditambahkan ke wishlist", active: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
