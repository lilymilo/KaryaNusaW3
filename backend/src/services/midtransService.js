import midtransClient from 'midtrans-client';

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Snap client — untuk membuat transaksi
const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

// Core API client — untuk verifikasi notifikasi
const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

/**
 * Generate unique Midtrans order ID
 * Format: KN-{timestamp}-{random4}
 */
export const generateMidtransOrderId = () => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `KN-${ts}-${rand}`;
};

/**
 * Buat Snap transaction untuk QRIS payment.
 * @param {Object} params
 * @param {string} params.midtransOrderId - ID unik untuk Midtrans
 * @param {number} params.grossAmount - Total dalam IDR (integer)
 * @param {Object} params.customer - { email, phone, name }
 * @param {Array}  params.items - [{ id, name, price, quantity }]
 * @returns {{ token: string, redirect_url: string }}
 */
export const createSnapTransaction = async ({ midtransOrderId, grossAmount, customer, items }) => {
  const parameter = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: Math.round(grossAmount), // Midtrans butuh integer
    },
    customer_details: {
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      first_name: customer.name || 'Pembeli',
    },
    item_details: items.map(item => ({
      id: item.id,
      name: (item.name || 'Produk Digital').substring(0, 50), // Max 50 chars
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    // Aktifkan hanya payment method QRIS-related
    enabled_payments: ['gopay', 'shopeepay', 'other_qris'],
    callbacks: {
      finish: `${process.env.FRONTEND_URL || 'https://warnusthree.my.id'}/orders`,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
  };
};

/**
 * Verifikasi notifikasi webhook dari Midtrans.
 * @param {Object} notificationBody - Raw JSON body dari Midtrans
 * @returns {Object} Parsed notification object dengan status terverifikasi
 */
export const verifyNotification = async (notificationBody) => {
  const notification = await coreApi.transaction.notification(notificationBody);
  return {
    orderId: notification.order_id,
    transactionStatus: notification.transaction_status,
    fraudStatus: notification.fraud_status,
    paymentType: notification.payment_type,
    transactionId: notification.transaction_id,
    grossAmount: parseFloat(notification.gross_amount),
    settlementTime: notification.settlement_time || null,
  };
};

/**
 * Cek apakah Midtrans sudah dikonfigurasi
 */
export const isMidtransEnabled = () => {
  return !!(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
};
