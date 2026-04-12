import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/format';

export default function CartDrawer({ open, onClose }) {
  const { cart, updateCart, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 bg-white dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag size={20} className="text-green-600 dark:text-emerald-400" /> Keranjang
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Keranjang masih kosong</p>
              <p className="text-gray-400 text-sm mt-1">Tambahkan produk untuk mulai belanja</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <img src={item.products?.image} alt={item.products?.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.products?.name}</p>
                  <p className="text-green-600 dark:text-emerald-400 text-sm font-black">{formatPrice(item.products?.price || 0)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateCart(item.id, item.quantity - 1)}
                      className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-emerald-400 transition-colors">
                      <Minus size={12} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateCart(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-emerald-400 transition-colors">
                      <Plus size={12} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <button onClick={() => removeFromCart(item.id)}
                      className="ml-auto p-1.5 text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex justify-between items-center mb-4 text-sm sm:text-base">
              <span className="text-gray-500 dark:text-gray-400 font-bold">Total</span>
              <span className="text-xl font-black text-green-600 dark:text-emerald-400">{formatPrice(cartTotal)}</span>
            </div>
            <button onClick={handleCheckout}
              className="w-full btn-primary shadow-sm py-3 rounded-xl text-white font-bold transition-transform active:scale-[0.98]">
              Lanjut ke Pembayaran
            </button>
          </div>
        )}
      </div>
    </>
  );
}
