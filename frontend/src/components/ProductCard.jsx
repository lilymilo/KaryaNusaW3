import { memo, useState, useEffect } from 'react';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import toast from 'react-hot-toast';
import api from '../api/axios';

const isVideoUrl = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|avi|ogv)(\?|$)/i.test(url);
};

function ProductCard({ product, onClick, onDelete, onEdit, initialWishlisted = false, onWishlistToggle }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setIsWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const isNFT = product.token_id !== null && product.token_id !== undefined;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error('Login terlebih dahulu');
    if (user.id === product.seller_id) {
      return toast.error('Anda tidak dapat membeli produk Anda sendiri');
    }
    try {
      await addToCart(product.id);
      toast.success('Ditambahkan ke keranjang!');
    } catch {
      toast.error('Gagal menambahkan ke keranjang');
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error('Login terlebih dahulu');
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      const { data } = await api.post('/wishlist/toggle', { productId: product.id });
      setIsWishlisted(data.active);
      if (typeof onWishlistToggle === 'function') {
        onWishlistToggle(product.id, data.active);
      }
      toast.success(data.message);
    } catch {
      toast.error('Gagal memperbarui wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div onClick={onClick} className="bg-white dark:bg-gray-800 relative rounded-2xl overflow-hidden cursor-pointer group border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative overflow-hidden h-28 sm:h-36">
        {isVideoUrl(product.image) ? (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-bold rounded">VIDEO</span>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <img src={product.image} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="14.6" x2="9.4" y2="6.5"></line><line x1="22" y1="2" x2="2" y2="22"></line></svg>'; }} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNFT && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 shadow-sm shadow-purple-500/20 text-white px-2 py-1 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
              NFT
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {user && (
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`p-2 backdrop-blur-md rounded-full transition-all border ${
                isWishlisted 
                ? 'bg-red-50 dark:bg-red-900/30 text-red-500 border-red-200 dark:border-red-800 shadow-sm' 
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 hover:text-red-500 border-gray-200 dark:border-gray-700 hover:bg-white'
              }`}
            >
              <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          )}
          
          {user?.id === product.seller_id && (
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(product);
                  else window.location.href = `/edit-product/${product.id}`;
                }}
                className="p-1.5 sm:p-2 bg-green-500/80 hover:bg-green-600 backdrop-blur-sm rounded-full text-white transition-colors"
                title="Edit Produk"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="p-1.5 sm:p-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm rounded-full text-white transition-colors"
                title="Hapus Produk Ini"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-2.5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-0.5 line-clamp-1 text-xs sm:text-sm">{product.name}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-[9px] sm:text-[10px] mb-1.5 line-clamp-1">{product.description}</p>

        <div className="hidden sm:flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={12}
                className={i <= Math.round(product.avg_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
            ))}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {(product.avg_rating || 0) > 0 ? (product.avg_rating || 0).toFixed(1) : 'Belum ada'} · {product.sold} terjual
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-[15px] font-black text-green-600 dark:text-emerald-400 truncate">{formatPrice(product.price)}</p>
            <p className="text-[9px] text-gray-400 flex items-end gap-1 mt-0.5 truncate uppercase tracking-tighter font-bold">
              {product.profiles?.shop_name || product.profiles?.full_name || product.seller_name || product.sellerName}
              {product.profiles?.username && <span className="opacity-60 lowercase font-medium">@{product.profiles.username}</span>}
            </p>
          </div>
          {user?.id !== product.seller_id && (
            <button onClick={handleAddToCart}
              className="p-1 sm:p-1.5 btn-primary rounded-lg text-white shadow-sm shrink-0">
              <ShoppingCart size={13} className="sm:w-[15px] sm:h-[15px]" />
            </button>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </div>
          <p className="text-gray-900 dark:text-white font-bold text-center mb-1 text-lg">Hapus Produk?</p>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">Tindakan ini tidak dapat dibatalkan.</p>
          
          <div className="flex gap-3 w-full">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} 
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
              Batal
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowDeleteConfirm(false); 
                if (typeof onDelete === 'function') onDelete(product.id); 
              }} 
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
            >
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ProductCard);
