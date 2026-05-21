import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Tanpa domain sendiri, gunakan default Resend testing sender
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'KaryaNusa <onboarding@resend.dev>';

/**
 * Format angka ke Rupiah
 */
const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

/**
 * Format tanggal ke WIB
 */
const formatDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'short' });
};

/**
 * Generate HTML invoice email
 */
const buildInvoiceHTML = ({ orderId, midtransOrderId, items, totalAmount, paymentMethod, paidAt }) => {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a1a;">
          ${item.name || 'Produk Digital'}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a1a;text-align:right;font-weight:600;">
          ${formatRupiah(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter','Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">KaryaNusa</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Invoice Pembayaran</p>
    </div>

    <!-- Content -->
    <div style="padding:32px 24px;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#15803d;font-weight:700;">✅ Pembayaran Berhasil!</p>
        <p style="margin:4px 0 0;font-size:13px;color:#166534;">Terima kasih atas pembelian Anda.</p>
      </div>

      <!-- Order Info -->
      <table style="width:100%;margin-bottom:24px;font-size:13px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#888;width:140px;">No. Invoice</td>
          <td style="padding:6px 0;color:#1a1a1a;font-weight:600;">${midtransOrderId || orderId}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;">Metode Bayar</td>
          <td style="padding:6px 0;color:#1a1a1a;font-weight:600;">${paymentMethod || 'QRIS'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#888;">Tanggal Bayar</td>
          <td style="padding:6px 0;color:#1a1a1a;font-weight:600;">${formatDate(paidAt)}</td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:12px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Produk</th>
            <th style="padding:12px 16px;text-align:center;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Qty</th>
            <th style="padding:12px 16px;text-align:right;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e5e7eb;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Total -->
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
        <table style="width:100%;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:14px;color:#888;font-weight:600;">TOTAL</td>
            <td style="font-size:20px;color:#16a34a;font-weight:800;text-align:right;">${formatRupiah(totalAmount)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 24px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#aaa;">
        Produk digital akan tersedia di halaman <strong>Pesanan Saya</strong>.
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#ccc;">
        &copy; ${new Date().getFullYear()} KaryaNusa — Marketplace Aset Digital
      </p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Kirim invoice email ke pembeli.
 * @param {Object} params
 * @param {string} params.to - Email tujuan
 * @param {string} params.orderId - UUID order dari DB
 * @param {string} params.midtransOrderId - ID transaksi Midtrans
 * @param {Array}  params.items - [{ name, price, quantity }]
 * @param {number} params.totalAmount - Total dalam IDR
 * @param {string} params.paymentMethod - 'qris', 'gopay', etc.
 * @param {string} params.paidAt - ISO date string
 */
export const sendInvoiceEmail = async ({ to, orderId, midtransOrderId, items, totalAmount, paymentMethod, paidAt }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY tidak dikonfigurasi, skip kirim email.');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `✅ Invoice Pembayaran - ${midtransOrderId || orderId}`,
      html: buildInvoiceHTML({ orderId, midtransOrderId, items, totalAmount, paymentMethod, paidAt }),
    });

    if (error) {
      console.error('[Email] Gagal kirim invoice:', error);
      return null;
    }

    console.log(`[Email] ✅ Invoice terkirim ke ${to} — ID: ${data?.id}`);
    return data;
  } catch (err) {
    console.error('[Email] Error:', err.message);
    return null;
  }
};

/**
 * Cek apakah email service aktif
 */
export const isEmailEnabled = () => !!process.env.RESEND_API_KEY;
