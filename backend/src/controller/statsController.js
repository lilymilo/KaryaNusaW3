import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

const db = supabaseAdmin || supabase;

export const getSellerStats = async (req, res) => {
  try {
    const { data: products, error: productsError } = await db
      .from('products')
      .select('name, price, sold, stock')
      .eq('seller_id', req.user.id);

    if (productsError) throw productsError;

    const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);
    const totalRevenue = products.reduce((sum, p) => sum + ((p.sold || 0) * p.price), 0);
    const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);

    const { count: activeOrders, error: ordersError } = await db
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'delivered')
      .neq('status', 'cancelled');

    if (ordersError) throw ordersError;

    res.json({
      totalSold,
      totalRevenue,
      bestSellers,
      activeOrders: activeOrders || 0,
      totalProducts: products.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
