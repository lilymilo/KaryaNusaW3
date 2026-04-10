import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Phone, CreditCard, Wallet, Building2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Transfer Bank', icon: Building2, desc: 'BCA, Mandiri, BNI, BRI' },
  { id: 'credit_card', label: 'Kartu Kredit', icon: CreditCard, desc: 'Visa, Mastercard, JCB' },
  { id: 'e_wallet', label: 'E-Wallet', icon: Wallet, desc: 'GoPay, OVO, Dana' },
];

const validateWA = (num) => {
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

export default function CheckoutPage() {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const directItem = location.state?.directItem;

  const [form, setForm] = useState({ delivery_email: '', phone: '', paymentMethod: '', notes: '' });
  const [loading, setLoading] = useState(false);

  // Derive products and totals from either directItem or cart
  const checkoutItems = directItem ? [directItem] : cart;
  const checkoutTotal = directItem ? (directItem.products.price * directItem.quantity) : cartTotal;
  const isDirect = !!directItem;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.delivery_email || !form.phone || !form.paymentMethod)
      return toast.error('Email pengiriman, nomor telepon, dan metode pembayaran wajib diisi');
    
    const validatedPhone = validateWA(form.phone);
    if (!validatedPhone) {
      return toast.error('Nomor WhatsApp tidak valid (Gunakan format 08xx atau +628xx)');
    }

    setLoading(true);
    try {
      const payload = {
        items: checkoutItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.products?.price,
          name: item.products?.name
        })),
        total_amount: checkoutTotal,
        delivery_email: form.delivery_email,
        phone: validatedPhone,
        payment_method: form.paymentMethod,
        notes: form.notes,
        is_direct: isDirect
      };

      await api.post('/orders', payload);
      toast.success('Pesanan berhasil dibuat!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="text-[var(--text-secondary)] opacity-20 mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] mb-4">Keranjang kosong</p>
          <button onClick={() => navigate('/home')} className="btn-primary px-6 py-2 rounded-xl text-white">
            Kembali Belanja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300 pt-8 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors">
          <ArrowLeft size={20} /> Kembali
        </button>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping */}
            <div className="glass rounded-2xl p-6 border border-[var(--border-color)]">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-purple-400" /> Informasi Pengiriman Digital
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Email Pengiriman (Untuk akses link/file)</label>
                  <input type="email" placeholder="contoh@email.com"
                    value={form.delivery_email} onChange={e => setForm({ ...form, delivery_email: e.target.value })}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] opacity-70 focus:opacity-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    <Phone size={14} className="inline mr-1" /> Nomor Telepon / WA
                  </label>
                  <input type="tel" placeholder="08xxxxxxxxxx"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] opacity-70 focus:opacity-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Catatan Pesanan (Opsional)</label>
                  <textarea rows={2} placeholder="Instruksi tambahan..."
                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] opacity-70 focus:opacity-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-all" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="glass rounded-2xl p-6 border border-[var(--border-color)]">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-purple-400" /> Metode Pembayaran
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <label key={id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    form.paymentMethod === id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:border-purple-500/30'
                  }`}>
                    <input type="radio" name="payment" value={id}
                      checked={form.paymentMethod === id}
                      onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                      className="hidden" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      form.paymentMethod === id ? 'btn-primary' : 'bg-[var(--card-hover-bg)] text-[var(--text-secondary)]'
                    }`}>
                      <Icon size={20} className={form.paymentMethod === id ? "text-white" : "text-current"} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{label}</p>
                      <p className="text-xs text-[var(--text-secondary)] opacity-60">{desc}</p>
                    </div>
                    {form.paymentMethod === id && (
                      <div className="ml-auto w-5 h-5 btn-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 sticky top-24 border border-[var(--border-color)]">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {checkoutItems.map(item => (
                  <div key={item.id || item.product_id} className="flex gap-3">
                    <img src={item.products?.image} alt={item.products?.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] line-clamp-1">{item.products?.name}</p>
                      <p className="text-xs text-[var(--text-secondary)] opacity-60">x{item.quantity}</p>
                    </div>
                    <p className="text-sm text-purple-400 font-medium whitespace-nowrap">
                      {formatPrice((item.products?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border-color)] pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Total Pembayaran</span>
                  <span className="text-xl font-bold gradient-text">{formatPrice(checkoutTotal)}</span>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full btn-primary py-3 rounded-xl text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
