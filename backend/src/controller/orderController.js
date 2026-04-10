import { supabase, getAuthClient } from '../config/supabaseClient.js';

// 1. Get user orders
export const getOrders = async (req, res) => {
  try {
    const authSupabase = getAuthClient(req);
    const { data, error } = await authSupabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

// 2. Create order (Checkout)
export const createOrder = async (req, res) => {
  try {
    const { items, total_amount, delivery_email, phone, payment_method, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Keranjang belanja kosong" });
    }

    const validatedPhone = validateWA(phone);
    if (!validatedPhone) {
      return res.status(400).json({ error: "Nomor WhatsApp tidak valid. Gunakan format 08xx atau +628xx" });
    }

    const authSupabase = getAuthClient(req);

    // 1. Create Order record
    const { data: order, error: orderError } = await authSupabase
      .from('orders')
      .insert([{
        user_id: req.user.id,
        total_amount: Number(total_amount),
        status: 'pending',
        delivery_email,
        phone: validatedPhone,
        payment_method,
        notes
      }])
      .select()
      .single();

    if (orderError) throw new Error(`Gagal membuat pesanan: ${orderError.message}`);

    // 2. Create Order Items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId || item.id, // Support both formats
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));

    const { error: itemsError } = await authSupabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Cleanup: Delete order if items failed (Partial atomic)
      await authSupabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Gagal membuat detail pesanan: ${itemsError.message}`);
    }

    // 3. Update stock and sold count
    for (const item of items) {
      const productId = item.productId || item.id;
      const { error: rpcError } = await authSupabase.rpc('increment_sold', { 
        row_id: productId, 
        qty: Number(item.quantity) 
      });
      if (rpcError) console.error(`Gagal update stok untuk ${productId}:`, rpcError.message);
    }

    // 4. Clear cart for this user (SKIP if it's a direct 'Buy Now' purchase)
    if (!req.body.is_direct) {
      await authSupabase
        .from('cart')
        .delete()
        .eq('user_id', req.user.id);
    }

    res.status(201).json({ 
      message: "Pesanan berhasil dibuat!", 
      orderId: order.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Update order status (For Admin/Seller)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const authSupabase = getAuthClient(req);

    const { data, error } = await authSupabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ message: "Status pesanan diupdate", data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
