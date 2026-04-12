import { getAuthClient } from '../config/supabaseClient.js';

export const getWishlist = async (req, res) => {
  try {
    const authSupabase = getAuthClient(req);
    const { data, error } = await authSupabase
      .from('wishlist')
      .select(`
        *,
        products (
          *,
          profiles (
            id,
            username,
            shop_name,
            full_name,
            avatar
          )
        )
      `)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const authSupabase = getAuthClient(req);

    const { data: existing, error: checkError } = await authSupabase
      .from('wishlist')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const { error: deleteError } = await authSupabase
        .from('wishlist')
        .delete()
        .eq('id', existing.id);
      
      if (deleteError) throw deleteError;
      return res.json({ message: "Dihapus dari wishlist", active: false });
    } else {
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
