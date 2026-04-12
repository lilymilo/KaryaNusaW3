import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Star, ArrowLeft, CheckCircle, Clock, MapPin, RefreshCw } from 'lucide-react';
import { formatPrice, formatDate } from '../utils/format';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Beri Rating</h3>
        <p className="text-gray-500 text-sm mb-4">{item.name}</p>

        <div className="flex gap-2 mb-4 justify-center">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setScore(s)}>
              <Star size={32} className={s <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
            </button>
          ))}
        </div>

        <textarea rows={3} placeholder="Tulis ulasan Anda (opsional)..."
          value={comment} onChange={e => setComment(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none mb-4 transition-all" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            Batal
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 btn-primary rounded-xl text-white font-bold disabled:opacity-60 shadow-sm active:scale-[0.98] transition-transform">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {ratingItem && (
        <RatingModal item={ratingItem} onClose={() => setRatingItem(null)} onSuccess={fetchOrders} />
      )}

      <div className="pt-20 max-w-4xl mx-auto px-4 sm:px-6 pb-32">
        <div className="py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pesanan Saya</h1>
          <p className="text-gray-500 text-sm font-medium">{orders.length} pesanan</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-3xl">
            <Package size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Belum ada pesanan</p>
            <button onClick={() => navigate('/home')} className="mt-4 btn-primary px-6 py-2 rounded-xl text-white text-sm font-bold shadow-sm">
              Mulai Belanja
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ID Pesanan</p>
                    <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(order.created_at)}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {order.is_testnet && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 font-bold border border-yellow-200 dark:border-yellow-800/50 rounded-full text-[10px]">Testnet</span>
                      )}
                      {order.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-emerald-400 font-bold border border-green-200 dark:border-emerald-900/50 rounded-full text-xs transition-colors">
                          <CheckCircle size={12} /> Selesai
                        </span>
                      ) : order.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-emerald-400 font-bold border border-green-200 dark:border-emerald-900/50 rounded-full text-xs transition-colors">
                          <CheckCircle size={12} /> Lunas
                        </span>
                      ) : order.status === 'delivered' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-emerald-400 font-bold border border-green-200 dark:border-emerald-900/50 rounded-full text-xs transition-colors">
                          <CheckCircle size={12} /> Selesai
                        </span>
                      ) : order.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800/50 rounded-full text-xs transition-colors">
                          <Clock size={12} /> Menunggu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold border border-gray-200 dark:border-gray-700 rounded-full text-xs transition-colors">
                          {order.status || 'Unknown'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {order.order_items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
                      <img src={item.products?.image} alt={item.products?.name}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.products?.name}</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">x{item.quantity} · <span className="text-gray-900 dark:text-white">{formatPrice(item.price)}</span></p>
                      </div>
                      <button onClick={() => setRatingItem({ ...item, name: item.products?.name })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-xs font-bold text-yellow-600 hover:bg-yellow-50 hover:border-yellow-200 transition-colors flex-shrink-0">
                        <Star size={12} className="fill-yellow-500 text-yellow-500" /> Beri Rating
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <p>{order.payment_method?.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-xs opacity-80 mt-0.5 truncate max-w-48">{order.delivery_email}</p>
                      {order.buyer_location && (
                        <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                          <MapPin size={10} className="flex-shrink-0" /> {order.buyer_location}
                        </p>
                      )}
                    </div>
                    
                    {(order.tx_hash || order.nft_transfer_tx_hash) && (
                      <div className="mt-3 space-y-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
                        {order.tx_hash && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            Pembayaran: <a href={order.payment_method === 'crypto_sol' ? `https://explorer.solana.com/tx/${order.tx_hash}?cluster=devnet` : `https://sepolia.etherscan.io/tx/${order.tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-orange-500 hover:underline">{order.tx_hash.slice(0,8)}...{order.tx_hash.slice(-6)}</a>
                          </p>
                        )}
                        {order.nft_transfer_tx_hash && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            NFT Transfer: <a href={`https://sepolia.etherscan.io/tx/${order.nft_transfer_tx_hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-purple-500 hover:underline">{order.nft_transfer_tx_hash.slice(0,8)}...{order.nft_transfer_tx_hash.slice(-6)}</a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-lg font-black text-green-600 dark:text-emerald-400">{formatPrice(order.total_amount)}</p>
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
