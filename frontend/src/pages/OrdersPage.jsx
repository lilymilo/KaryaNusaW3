import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Star, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);
const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function RatingModal({ item, orderId, onClose, onSuccess }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post(`/products/${item.product_id}/rating`, { score, comment });
      toast.success('Rating berhasil dikirim!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 max-w-md w-full border border-[var(--border-color)]">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Beri Rating</h3>
        <p className="text-[var(--text-secondary)] text-sm mb-4">{item.name}</p>

        <div className="flex gap-2 mb-4 justify-center">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setScore(s)}>
              <Star size={32} className={s <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
            </button>
          ))}
        </div>

        <textarea rows={3} placeholder="Tulis ulasan Anda (opsional)..."
          value={comment} onChange={e => setComment(e.target.value)}
          className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] opacity-70 focus:opacity-100 focus:outline-none focus:border-purple-500 resize-none mb-4 transition-all" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 glass rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Batal
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 btn-primary rounded-xl text-white font-medium disabled:opacity-60">
            {loading ? 'Mengirim...' : 'Kirim Rating'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingItem, setRatingItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {ratingItem && (
        <RatingModal item={ratingItem} onClose={() => setRatingItem(null)} onSuccess={fetchOrders} />
      )}

      <div className="pt-20 max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="py-8 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Kembali</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pesanan Saya</h1>
            <p className="text-[var(--text-secondary)] text-sm">{orders.length} pesanan</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/3 mb-4" />
                <div className="h-16 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Belum ada pesanan</p>
            <button onClick={() => navigate('/home')} className="mt-4 btn-primary px-6 py-2 rounded-xl text-white text-sm">
              Mulai Belanja
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] opacity-50">ID Pesanan</p>
                    <p className="text-sm font-mono text-[var(--text-secondary)]">{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs mt-1">
                      <CheckCircle size={12} /> Selesai
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {order.order_items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)]">
                      <img src={item.products?.image} alt={item.products?.name}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">{item.products?.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">x{item.quantity} · {formatPrice(item.price)}</p>
                      </div>
                      <button onClick={() => setRatingItem({ ...item, name: item.products?.name })}
                        className="flex items-center gap-1 px-3 py-1.5 glass rounded-lg text-xs text-yellow-400 hover:bg-yellow-400/10 transition-colors flex-shrink-0">
                        <Star size={12} /> Beri Rating
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--border-color)] pt-4 flex items-center justify-between">
                  <div className="text-sm text-[var(--text-secondary)]">
                    <p>{order.payment_method?.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-xs opacity-60 mt-0.5 truncate max-w-48">{order.delivery_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold gradient-text">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
