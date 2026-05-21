import { supabaseAdmin, getAuthClient } from '../config/supabaseClient.js';
import { createSnapTransaction, generateMidtransOrderId, verifyNotification } from '../services/midtransService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

/**
 * POST /api/payment/create-qris
 * Buat transaksi Midtrans Snap untuk pembayaran QRIS.
 * Body: { orderId, amount, email, phone, items: [{ id, name, price, quantity }] }
 */
export const createQrisPayment = async (req, res) => {
  try {
    const { orderId, amount, email, phone, items } = req.body;

    if (!orderId || !amount || !items?.length) {
      return res.status(400).json({ error: 'orderId, amount, dan items wajib diisi.' });
    }

    const adminClient = supabaseAdmin || getAuthClient(req);

    // Pastikan order ada dan milik user ini
    const { data: order, error: orderErr } = await adminClient
      .from('orders')
      .select('id, user_id, total_amount, status')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Tidak berhak mengakses pesanan ini.' });
    }

    // Cek apakah sudah ada transaksi aktif untuk order ini
    const { data: existingTx } = await adminClient
      .from('transactions')
      .select('id, transaction_status, snap_token, snap_redirect_url')
      .eq('order_id', orderId)
      .in('transaction_status', ['pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Jika sudah ada transaksi pending, kembalikan token yang sama
    if (existingTx?.snap_token) {
      return res.json({
        snapToken: existingTx.snap_token,
        redirectUrl: existingTx.snap_redirect_url,
        midtransOrderId: null, // Client tidak perlu ini
      });
    }

    // Generate unique Midtrans order ID
    const midtransOrderId = generateMidtransOrderId();

    // Buat Snap transaction
    const snapResult = await createSnapTransaction({
      midtransOrderId,
      grossAmount: amount,
      customer: {
        email: email || '',
        phone: phone || '',
        name: req.user.user_metadata?.full_name || req.user.user_metadata?.username || 'Pembeli',
      },
      items,
    });

    // Simpan ke tabel transactions
    const { error: txError } = await adminClient.from('transactions').insert([{
      order_id: orderId,
      user_id: req.user.id,
      midtrans_order_id: midtransOrderId,
      snap_token: snapResult.token,
      snap_redirect_url: snapResult.redirect_url,
      gross_amount: Math.round(amount),
      transaction_status: 'pending',
    }]);

    if (txError) {
      console.error('[createQrisPayment] DB insert error:', txError.message);
      // Tidak fatal — transaksi Midtrans sudah dibuat, biarkan user bayar
    }

    res.json({
      snapToken: snapResult.token,
      redirectUrl: snapResult.redirect_url,
    });
  } catch (error) {
    console.error('[createQrisPayment] Error:', error.message);
    res.status(500).json({ error: 'Gagal membuat transaksi pembayaran.' });
  }
};

/**
 * POST /api/payment/webhook
 * Webhook handler untuk notifikasi dari Midtrans.
 * TIDAK memerlukan auth — Midtrans yang memanggil endpoint ini.
 */
export const handleMidtransWebhook = async (req, res) => {
  try {
    console.log('[Webhook] Menerima notifikasi Midtrans:', JSON.stringify(req.body).substring(0, 300));

    // Verifikasi notifikasi dengan Midtrans SDK (validasi signature)
    const notification = await verifyNotification(req.body);
    const { orderId: midtransOrderId, transactionStatus, fraudStatus, paymentType, transactionId, grossAmount, settlementTime } = notification;

    const adminClient = supabaseAdmin;
    if (!adminClient) {
      console.error('[Webhook] SUPABASE_SERVICE_ROLE_KEY tidak dikonfigurasi!');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    // Cari transaksi di DB berdasarkan midtrans_order_id
    const { data: tx, error: txErr } = await adminClient
      .from('transactions')
      .select('*, orders(id, user_id, total_amount, delivery_email, status, order_items(*, products(id, name, price, seller_id)))')
      .eq('midtrans_order_id', midtransOrderId)
      .single();

    if (txErr || !tx) {
      console.error(`[Webhook] Transaksi ${midtransOrderId} tidak ditemukan di DB`);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Tentukan aksi berdasarkan status
    let newTxStatus = transactionStatus;
    let updateOrderStatus = null;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      // Pembayaran berhasil
      if (fraudStatus === 'accept' || !fraudStatus) {
        newTxStatus = 'settlement';
        updateOrderStatus = 'processing';
      } else {
        newTxStatus = 'deny';
        updateOrderStatus = 'cancelled';
      }
    } else if (transactionStatus === 'pending') {
      newTxStatus = 'pending';
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      newTxStatus = transactionStatus;
      updateOrderStatus = 'cancelled';
    }

    // Update tabel transactions
    await adminClient
      .from('transactions')
      .update({
        transaction_status: newTxStatus,
        payment_type: paymentType,
        midtrans_transaction_id: transactionId,
        fraud_status: fraudStatus || null,
        settlement_time: settlementTime || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tx.id);

    // Update status order
    if (updateOrderStatus && tx.orders) {
      await adminClient
        .from('orders')
        .update({ status: updateOrderStatus })
        .eq('id', tx.orders.id);
    }

    // Jika settlement: credit seller balance + kirim invoice email
    if (newTxStatus === 'settlement' && tx.orders?.order_items) {
      // Credit seller balance
      for (const item of tx.orders.order_items) {
        if (item.products?.seller_id) {
          const { error: balError } = await adminClient.rpc('increment_balance', {
            p_user_id: item.products.seller_id,
            p_amount: Number(item.price) * Number(item.quantity),
          });
          if (balError) {
            console.error(`[Webhook] Gagal credit saldo seller ${item.products.seller_id}:`, balError.message);
          } else {
            console.log(`[Webhook] ✅ Saldo seller ${item.products.seller_id} +${item.price * item.quantity}`);
          }
        }
      }

      // Kirim invoice email (async, non-blocking)
      if (tx.orders.delivery_email && !tx.invoice_sent) {
        const invoiceItems = tx.orders.order_items.map(item => ({
          name: item.products?.name || 'Produk Digital',
          price: item.price,
          quantity: item.quantity,
        }));

        sendInvoiceEmail({
          to: tx.orders.delivery_email,
          orderId: tx.orders.id,
          midtransOrderId,
          items: invoiceItems,
          totalAmount: grossAmount || tx.gross_amount,
          paymentMethod: paymentType || 'QRIS',
          paidAt: settlementTime || new Date().toISOString(),
        }).then(() => {
          // Mark invoice sebagai terkirim
          adminClient
            .from('transactions')
            .update({ invoice_sent: true, invoice_sent_at: new Date().toISOString() })
            .eq('id', tx.id)
            .then(() => {});
        }).catch(err => {
          console.error('[Webhook] Gagal kirim invoice:', err.message);
        });
      }
    }

    // Midtrans expects 200 OK
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Webhook] Error:', error.message);
    // Tetap return 200 agar Midtrans tidak retry terus-menerus
    res.status(200).json({ status: 'error', message: error.message });
  }
};

/**
 * GET /api/payment/status/:orderId
 * Cek status pembayaran untuk sebuah order.
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminClient = supabaseAdmin || getAuthClient(req);

    const { data, error } = await adminClient
      .from('transactions')
      .select('id, midtrans_order_id, transaction_status, payment_type, gross_amount, settlement_time, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
