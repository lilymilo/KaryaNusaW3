import { useState } from 'react';
import { X, Star, ShoppingCart, Package, User, Heart, Plus, Minus, MessageCircle, Share2, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function ProductModal({ product, onClose, initialWishlisted = false }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const navigate = useNavigate();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('detail');
  
  // Image Viewer State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Review form state
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Local ratings state (so we can update after submit)
  const [localRatings, setLocalRatings] = useState(null);

  if (!product) return null;

  // Map product_ratings from DB format to UI format
  const rawRatings = localRatings || product.product_ratings || [];
  const ratings = rawRatings.map(r => ({
    user: r.user_name || r.user || 'Anonim',
    score: r.score,
    comment: r.comment || ''
  }));
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
    : (product.avg_rating || 0);
  const sold = product.sold || 0;
  const stock = product.stock || 0;
  const description = product.description || '';

  const productImages = product?.images?.length ? product.images : [product?.image];
  const currentImage = productImages[currentImageIndex] || product?.image;
  const handleAddToCart = async () => {
    if (!user) return toast.error('Login terlebih dahulu');
    try {
      await addToCart(product.id, qty);
      toast.success(`${qty} produk ditambahkan ke keranjang!`);
      onClose();
    } catch {
      toast.error('Gagal menambahkan ke keranjang');
    }
  };

  const handleBuyNow = () => {
    if (!user) return toast.error('Login terlebih dahulu');
    
    const directItem = {
      product_id: product.id,
      quantity: qty,
      products: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImages[0] || product.image
      }
    };

    navigate('/checkout', { state: { directItem } });
    onClose();
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error('Login terlebih dahulu');
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      const { data } = await api.post('/wishlist/toggle', { productId: product.id });
      setIsWishlisted(data.active);
      toast.success(data.message);
    } catch {
      toast.error('Gagal memperbarui wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Login terlebih dahulu');
    if (reviewScore === 0) return toast.error('Pilih rating bintang terlebih dahulu');
    if (!reviewComment.trim()) return toast.error('Tulis komentar terlebih dahulu');

    setReviewLoading(true);
    try {
      await api.post(`/products/${product.id}/rating`, {
        score: reviewScore,
        comment: reviewComment.trim()
      });
      toast.success('Ulasan berhasil ditambahkan!');
      
      // Add the new review locally so it appears immediately
      const newRating = {
        user_name: user.full_name || 'Buyer',
        score: reviewScore,
        comment: reviewComment.trim()
      };
      setLocalRatings([...rawRatings, newRating]);
      
      // Reset form
      setReviewScore(0);
      setReviewComment('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim ulasan');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overflow-hidden" onClick={onClose}>
      <div 
        className="bg-[var(--bg-color)] rounded-[2.5rem] max-w-6xl w-full max-h-[92vh] overflow-y-auto border border-[var(--border-color)] shadow-2xl relative" 
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2.5 bg-[var(--card-bg)] hover:bg-red-500/20 hover:text-red-500 rounded-full text-[var(--text-secondary)] transition-all border border-[var(--border-color)]">
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-10">
          
          {/* Kolom Kiri: Galeri Foto (4/12) */}
          <div className="lg:col-span-4 space-y-4">
            <div 
              className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden glass border border-[var(--border-color)] shadow-sm relative group cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              <img src={currentImage} alt={product.name}
                className="w-full h-full object-contain bg-black/5 dark:bg-white/5 transition-transform duration-700 group-hover:scale-105"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'; }} />
                
              {/* Slider Controls */}
              {productImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? productImages.length - 1 : prev - 1)); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full sm:opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === productImages.length - 1 ? 0 : prev + 1)); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full sm:opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                  
                  {/* Indicators */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {productImages.map((_, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                {productImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-purple-500' : 'border-transparent opacity-60 hover:opacity-100 bg-black/5'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kolom Tengah: Info Utama (5/12) */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight mb-2">{product.name}</h2>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg">
                  <Star size={14} className="fill-yellow-500" />
                  <span className="font-bold">{avgRating.toFixed(1)}</span>
                  <span className="opacity-60 font-normal text-xs sm:text-sm">({ratings.length} Rating)</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                <span className="text-[var(--text-secondary)] font-medium text-xs sm:text-sm">Terjual <span className="text-[var(--text-primary)]">{sold}</span></span>
              </div>
            </div>

            <div className="py-3 sm:py-4 border-y border-[var(--border-color)]">
                <p className="text-3xl sm:text-4xl font-black gradient-text tracking-tight">{formatPrice(product.price)}</p>
            </div>

            {/* Content Tabs */}
            <div className="space-y-4">
               <div className="flex gap-4 sm:gap-6 border-b border-[var(--border-color)]">
                  <button 
                    onClick={() => setActiveTab('detail')}
                    className={`pb-2 sm:pb-3 text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'detail' ? 'text-purple-500' : 'text-[var(--text-secondary)]'}`}
                  >
                    Detail Produk
                    {activeTab === 'detail' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('ulasan')}
                    className={`pb-2 sm:pb-3 text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'ulasan' ? 'text-purple-500' : 'text-[var(--text-secondary)]'}`}
                  >
                    Ulasan ({ratings.length})
                    {activeTab === 'ulasan' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full" />}
                  </button>
               </div>

               {activeTab === 'detail' ? (
                 <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-y-2 text-xs sm:text-sm">
                      <span className="text-[var(--text-secondary)]">Kategori</span>
                      <span className="text-[var(--text-primary)] font-medium text-right lg:text-left">{product.category || 'Digital'}</span>
                      <span className="text-[var(--text-secondary)]">Toko</span>
                      <Link 
                        to={`/shop/${encodeURIComponent(product.profiles?.username || product.profiles?.shop_name || product.profiles?.full_name || product.seller_name)}`}
                        className="text-purple-500 font-bold text-right lg:text-left hover:underline transition-all"
                        onClick={onClose}
                      >
                        {product.profiles?.shop_name || product.profiles?.full_name || product.sellerName || product.seller_name}
                      </Link>
                    </div>
                    <div className="pt-2">
                       <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px]">
                          {description}
                       </p>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4 animate-in fade-in duration-300">
                   {/* Review Form - Only for Buyers */}
                   {user?.role === 'buyer' && (
                     <form onSubmit={handleSubmitReview} className="p-3 sm:p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] space-y-3">
                       <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">Tulis Ulasan</p>
                       
                       {/* Star Selector */}
                       <div className="flex items-center gap-1">
                         {[1, 2, 3, 4, 5].map(s => (
                           <button
                             key={s}
                             type="button"
                             onClick={() => setReviewScore(s)}
                             onMouseEnter={() => setReviewHover(s)}
                             onMouseLeave={() => setReviewHover(0)}
                             className="p-0.5 transition-transform hover:scale-125"
                           >
                             <Star
                               size={20}
                               className={`transition-colors ${
                                 s <= (reviewHover || reviewScore)
                                   ? 'text-yellow-400 fill-yellow-400'
                                   : 'text-gray-500'
                               }`}
                             />
                           </button>
                         ))}
                         {reviewScore > 0 && (
                           <span className="text-[10px] sm:text-xs text-[var(--text-secondary)] ml-2 font-medium">
                             {reviewScore === 1 ? 'Buruk' : reviewScore === 2 ? 'Kurang' : reviewScore === 3 ? 'Cukup' : reviewScore === 4 ? 'Bagus' : 'Sangat Bagus'}
                           </span>
                         )}
                       </div>

                       {/* Comment Input */}
                       <textarea
                         value={reviewComment}
                         onChange={(e) => setReviewComment(e.target.value)}
                         placeholder="Bagikan pengalamanmu..."
                         rows={2}
                         className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-purple-500 transition-all resize-none"
                       />

                       {/* Submit Button */}
                       <button
                         type="submit"
                         disabled={reviewLoading || reviewScore === 0}
                         className="btn-primary w-full sm:w-auto px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {reviewLoading ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                         ) : (
                           <Send size={14} />
                         )}
                         {reviewLoading ? 'Mengirim...' : 'Kirim Ulasan'}
                       </button>
                     </form>
                   )}

                   {/* Existing Reviews List */}
                   {ratings.length === 0 ? (
                     <div className="py-6 sm:py-8 text-center bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)]">
                        <MessageCircle size={28} className="mx-auto text-[var(--border-color)] mb-2" />
                        <p className="text-[var(--text-secondary)] text-xs sm:text-sm">Belum ada ulasan.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {ratings.map((r, i) => (
                          <div key={i} className="p-3 sm:p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)]">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 btn-primary rounded-full flex items-center justify-center text-[10px] sm:text-xs text-white uppercase">
                                {r.user[0]}
                              </div>
                              <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">{r.user}</span>
                              <div className="flex gap-0.5 ml-auto">
                                {[1,2,3,4,5].map(s => <Star key={s} size={8} className={s <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />)}
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{r.comment}</p>
                          </div>
                        ))}
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>

          {/* Kolom Kanan: Checkout Card (3/12) */}
          <div className="lg:col-span-3">
             <div className="glass rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 border border-[var(--border-color)] shadow-xl lg:sticky lg:top-0">
               <h3 className="hidden lg:block font-black text-[var(--text-primary)] mb-6 text-lg">Atur jumlah dan catatan</h3>
               <h3 className="lg:hidden font-bold text-[var(--text-primary)] mb-4 text-sm">Beli Produk Ini</h3>
               
               <div className="space-y-5 sm:space-y-6">
                 {/* Qty Selector */}
                 <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-0.5 sm:p-1">
                      <button 
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition-colors text-purple-500 disabled:opacity-30"
                        disabled={qty <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <input 
                        type="number" 
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Math.min(stock, parseInt(e.target.value) || 1)))}
                        className="w-10 sm:w-12 text-center bg-transparent border-none focus:ring-0 font-bold text-[var(--text-primary)] text-sm sm:text-base"
                      />
                      <button 
                        onClick={() => setQty(Math.min(stock, qty + 1))}
                        className="p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition-colors text-purple-500 disabled:opacity-30"
                        disabled={qty >= stock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium shrink-0">Stok: <span className="text-[var(--text-primary)] font-bold">{stock}</span></p>
                 </div>

                 {/* Price Calculation */}
                 <div className="flex items-center justify-between py-3 sm:py-4 border-t border-[var(--border-color)]">
                    <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">Subtotal</span>
                    <span className="text-lg sm:text-xl font-black text-[var(--text-primary)]">{formatPrice(product.price * qty)}</span>
                 </div>

                 {/* Action Buttons */}
                 <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    <button 
                      onClick={handleAddToCart}
                      className="w-full btn-primary py-3 rounded-xl sm:rounded-2xl text-white font-black shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Plus size={16} className="hidden sm:block" /> Keranjang
                    </button>
                    <button 
                      onClick={handleBuyNow}
                      className="w-full py-3 rounded-xl sm:rounded-2xl border-2 border-purple-500/50 text-purple-500 font-bold hover:bg-purple-500 hover:text-white transition-all text-xs sm:text-sm">
                      Beli Langsung
                    </button>
                 </div>

                 {/* Auxiliary Actions - Wishlist Only for Buyers */}
                 {user?.role === 'buyer' && (
                   <div className="flex items-center justify-center pt-4 border-t border-[var(--border-color)]">
                    <button 
                      onClick={handleWishlist}
                      className={`flex items-center gap-2 text-xs font-bold transition-colors ${isWishlisted ? 'text-red-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                       <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} /> 
                       {isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
                    </button>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Zoom */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
        >
          <button 
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          >
            <X size={28} />
          </button>
          
          <img src={currentImage} alt={product.name} 
            className="max-w-[95vw] max-h-[95vh] object-contain cursor-zoom-out"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }} 
          />
          
          {/* Lightbox Controls */}
          {productImages.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? productImages.length - 1 : prev - 1)); }}
                className="absolute left-6 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === productImages.length - 1 ? 0 : prev + 1)); }}
                className="absolute right-6 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

