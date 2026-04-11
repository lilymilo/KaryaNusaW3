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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4 font-medium">Keranjang kosong</p>
          <button onClick={() => navigate('/home')} className="btn-primary px-6 py-2 rounded-xl text-white font-bold shadow-sm">
            Kembali Belanja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pt-8 pb-32 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors font-medium">
          <ArrowLeft size={20} /> Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping */}
            <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-green-600 dark:text-emerald-400" /> Informasi Pengiriman Digital
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Pengiriman (Untuk akses link/file)</label>
                  <input type="email" placeholder="contoh@email.com"
                    value={form.delivery_email} onChange={e => setForm({ ...form, delivery_email: e.target.value })}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone size={14} className="inline mr-1 text-gray-400" /> Nomor Telepon / WA
                  </label>
                  <input type="tel" placeholder="08xxxxxxxxxx"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catatan Pesanan (Opsional)</label>
                  <textarea rows={2} placeholder="Instruksi tambahan..."
                    value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none transition-all shadow-sm" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-green-600 dark:text-emerald-400" /> Metode Pembayaran
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <label key={id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    form.paymentMethod === id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                  }`}>
                    <input type="radio" name="payment" value={id}
                      checked={form.paymentMethod === id}
                      onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                      className="hidden" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      form.paymentMethod === id ? 'btn-primary shadow-sm' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon size={20} className={form.paymentMethod === id ? "text-white" : "text-current"} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                    {form.paymentMethod === id && (
                      <div className="ml-auto w-5 h-5 btn-primary shadow-sm rounded-full flex items-center justify-center">
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
            <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 sticky top-24 border border-gray-200 dark:border-gray-700 transition-colors">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2">
                {checkoutItems.map(item => (
                  <div key={item.id || item.product_id} className="flex gap-3">
                    <img src={item.products?.image} alt={item.products?.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{item.products?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">x{item.quantity}</p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white font-bold whitespace-nowrap">
                      {formatPrice((item.products?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Total Pembayaran</span>
                  <span className="text-xl font-black text-green-600 dark:text-emerald-400">{formatPrice(checkoutTotal)}</span>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full btn-primary py-3 rounded-xl text-white font-bold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-transform active:scale-[0.98]">
                {loading ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
