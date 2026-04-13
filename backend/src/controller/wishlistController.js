import { supabaseAdmin, getAuthClient } from '../config/supabaseClient.js';

export const getWishlist = async (req, res) => {
  try {
    const client = supabaseAdmin || getAuthClient(req);
    const { data, error } = await client
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

    console.log(`[GetWishlist] User: ${req.user.id}, Count: ${data?.length}, Error:`, error);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const client = supabaseAdmin || getAuthClient(req);

    const { data: existing, error: checkError } = await client
      .from('wishlist')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const { error: deleteError } = await client
        .from('wishlist')
        .delete()
        .eq('id', existing.id);
      
      if (deleteError) throw deleteError;
      return res.json({ message: "Dihapus dari wishlist", active: false });
    } else {
      const { error: insertError } = await client
        .from('wishlist')
        .insert([{ user_id: req.user.id, product_id: productId }]);
      
      if (insertError) {
        if (insertError.code === '23505') {
          await client.from('wishlist').delete().eq('user_id', req.user.id).eq('product_id', productId);
          return res.json({ message: "Dihapus dari wishlist", active: false });
        }
        throw insertError;
      }
      return res.json({ message: "Ditambahkan ke wishlist", active: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
