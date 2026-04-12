import { getAuthClient } from '../config/supabaseClient.js';

const getFullCart = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('cart')
    .select('*, products(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
};

export const getCart = async (req, res) => {
  try {
    const supabase = getAuthClient(req);
    const data = await getFullCart(supabase, req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const supabase = getAuthClient(req);

    const { data: existing, error: checkError } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existing.quantity + Number(quantity) })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cart')
        .insert([{
          user_id: req.user.id,
          product_id,
          quantity: Number(quantity)
        }]);
      if (error) throw error;
    }

    const fullCart = await getFullCart(supabase, req.user.id);
    res.status(existing ? 200 : 201).json(fullCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const supabase = getAuthClient(req);

    const { error } = await supabase
      .from('cart')
      .update({ quantity: Number(quantity) })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    const fullCart = await getFullCart(supabase, req.user.id);
    res.json(fullCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getAuthClient(req);

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    const fullCart = await getFullCart(supabase, req.user.id);
    res.json(fullCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const clearCart = async (req, res) => {
  try {
    const supabase = getAuthClient(req);
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Keranjang berhasil dikosongkan' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
