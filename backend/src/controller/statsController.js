import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

const db = supabaseAdmin || supabase;

export const getSellerStats = async (req, res) => {
  try {
    const { data: products, error: productsError } = await db
      .from('products')
      .select('id, name, price, sold, stock')
      .eq('seller_id', req.user.id);

    if (productsError) throw productsError;

    const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);
    const totalRevenue = products.reduce((sum, p) => sum + ((p.sold || 0) * p.price), 0);
    const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);

    const productIds = products.map(p => p.id);
    let activeOrders = 0;

    if (productIds.length > 0) {
      const { data: activeItems, error: itemsError } = await db
        .from('order_items')
        .select('order_id, orders!inner(status)')
        .in('product_id', productIds)
        .neq('orders.status', 'delivered')
        .neq('orders.status', 'cancelled');

      if (!itemsError && activeItems) {
        const uniqueOrders = new Set(activeItems.map(item => item.order_id));
        activeOrders = uniqueOrders.size;
      }
    }

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
