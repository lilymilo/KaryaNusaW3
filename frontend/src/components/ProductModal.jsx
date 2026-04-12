import { useState } from 'react';
import { X, Star, Heart, Plus, Minus, MessageCircle, Send, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import toast from 'react-hot-toast';
import api from '../api/axios';

const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return /\.(mp4|webm|mov|avi|ogv)(\?|$)/.test(lower);
};

export default function ProductModal({ product, onClose, initialWishlisted = false }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const navigate = useNavigate();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [buyerLocation, setBuyerLocation] = useState('');
  const [activeTab, setActiveTab] = useState('detail');
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [reviewScore, setReviewScore] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [localRatings, setLocalRatings] = useState(null);

  if (!product) return null;

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
    if (user.id === product.seller_id) return toast.error('Anda tidak dapat membeli produk sendiri');
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
    if (user.id === product.seller_id) return toast.error('Anda tidak dapat membeli produk sendiri');
    const trimmed = buyerLocation.trim();
    if (!trimmed) return toast.error('Isi lokasi pembeli untuk Beli Langsung');

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

    navigate('/checkout', { state: { directItem, buyerLocation: trimmed } });
    onClose();
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) return toast.error('Login terlebih dahulu');
    if (user.id === product.seller_id) return toast.error('Ini adalah produk Anda sendiri');
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
    if (user.id === product.seller_id) return toast.error('Anda tidak bisa mengulas produk sendiri');
    if (reviewScore === 0) return toast.error('Pilih rating bintang terlebih dahulu');
    if (!reviewComment.trim()) return toast.error('Tulis komentar terlebih dahulu');

    setReviewLoading(true);
    try {
      await api.post(`/products/${product.id}/rating`, {
        score: reviewScore,
        comment: reviewComment.trim()
      });
      toast.success('Ulasan berhasil ditambahkan!');
      
      const newRating = {
        user_name: user.full_name || 'Buyer',
        score: reviewScore,
        comment: reviewComment.trim()
      };
      setLocalRatings([...rawRatings, newRating]);
      
      setReviewScore(0);
      setReviewComment('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim ulasan');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm sm:backdrop-blur-md overflow-hidden transition-all" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] max-w-6xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-2xl relative transition-colors" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-500 rounded-full text-gray-500 dark:text-gray-400 transition-all border border-gray-200 dark:border-gray-700 shadow-sm">
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-10">
          
          <div className="lg:col-span-4 space-y-4">
            <div 
              className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm relative group cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              {isVideoUrl(currentImage) ? (
                <video
                  src={currentImage}
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-gray-50 dark:bg-gray-800"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img src={currentImage} alt={product.name}
                  className="w-full h-full object-contain bg-gray-50 dark:bg-gray-800 transition-transform duration-700 group-hover:scale-105"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400'; }} />
              )}
                
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
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {productImages.map((_, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                {productImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? 'border-green-500' : 'border-transparent opacity-60 hover:opacity-100 bg-gray-100 dark:bg-gray-800'}`}
                  >
                    {isVideoUrl(img) ? (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    ) : (
                      <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-2">{product.name}</h2>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                  <Star size={14} className="fill-yellow-500" />
                  <span className="font-bold">{avgRating.toFixed(1)}</span>
                  <span className="opacity-70 font-normal text-xs sm:text-sm">({ratings.length} Rating)</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">Terjual <span className="text-gray-900 dark:text-white font-bold">{sold}</span></span>
              </div>
            </div>

            <div className="py-3 sm:py-4 border-y border-gray-200 dark:border-gray-700">
                <p className="text-3xl sm:text-4xl font-black text-green-600 dark:text-emerald-400 tracking-tight">{formatPrice(product.price)}</p>
            </div>

            <div className="space-y-4">
               <div className="flex gap-4 sm:gap-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
                  <button 
                    onClick={() => setActiveTab('detail')}
                    className={`pb-2 sm:pb-3 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'detail' ? 'text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    Detail Produk
                    {activeTab === 'detail' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 dark:bg-emerald-400 rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('ulasan')}
                    className={`pb-2 sm:pb-3 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'ulasan' ? 'text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    Ulasan ({ratings.length})
                    {activeTab === 'ulasan' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 dark:bg-emerald-400 rounded-full" />}
                  </button>
                  {product.token_id !== null && product.token_id !== undefined && (
                    <button 
                      onClick={() => setActiveTab('nft')}
                      className={`pb-2 sm:pb-3 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'nft' ? 'text-purple-500 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
                      Info NFT
                      {activeTab === 'nft' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 dark:bg-purple-400 rounded-full" />}
                    </button>
                  )}
               </div>

               {activeTab === 'detail' ? (
                 <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-y-2 text-xs sm:text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Kategori</span>
                      <span className="text-gray-900 dark:text-white font-medium text-right lg:text-left">{product.category || 'Digital'}</span>
                      <span className="text-gray-500 dark:text-gray-400">Toko</span>
                      <Link 
                        to={`/shop/${product.profiles?.username || product.profiles?.id || product.seller_id}`}
                        className="text-green-600 dark:text-emerald-400 font-bold text-right lg:text-left hover:underline transition-all"
                        onClick={onClose}
                      >
                        {product.profiles?.shop_name || product.profiles?.full_name || product.sellerName || product.seller_name}
                      </Link>
                    </div>
                    <div className="pt-2">
                       <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px]">
                          {description}
                       </p>
                    </div>
                 </div>
               ) : activeTab === 'nft' ? (
                 <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
                        </div>
                        <div>
                          <p className="font-bold text-purple-900 dark:text-purple-300">Aset Digital Tersertifikasi</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">Dicetak di Jaringan Ethereum Sepolia</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-5">
                         <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                           <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Token ID</span>
                           <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">#{product.token_id}</span>
                         </div>
                         <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                           <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Smart Contract</span>
                           <a href={`https://sepolia.etherscan.io/address/${product.nft_contract_address}`} target="_blank" rel="noopener noreferrer" 
                              className="font-mono text-xs text-purple-600 dark:text-purple-400 hover:underline">
                             {product.nft_contract_address?.slice(0,6)}...{product.nft_contract_address?.slice(-4)}
                           </a>
                         </div>
                         <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                           <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Mint Hash</span>
                           <a href={`https://sepolia.etherscan.io/tx/${product.nft_tx_hash}`} target="_blank" rel="noopener noreferrer" 
                              className="font-mono text-xs text-purple-600 dark:text-purple-400 hover:underline">
                             {product.nft_tx_hash?.slice(0,6)}...{product.nft_tx_hash?.slice(-4)}
                           </a>
                         </div>
                         <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                           <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Metadata (IPFS/JSON)</span>
                           <a href={product.metadata_uri} target="_blank" rel="noopener noreferrer" 
                              className="font-mono text-xs text-purple-600 dark:text-purple-400 hover:underline">
                             Lihat Data
                           </a>
                         </div>
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-4 animate-in fade-in duration-300">
                   {user && user.id !== product.seller_id && (
                     <form onSubmit={handleSubmitReview} className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 transition-colors">
                       <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Tulis Ulasan</p>
                       
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
                                   : 'text-gray-300'
                               }`}
                             />
                           </button>
                         ))}
                         {reviewScore > 0 && (
                           <span className="text-[10px] sm:text-xs text-gray-500 ml-2 font-medium">
                             {reviewScore === 1 ? 'Buruk' : reviewScore === 2 ? 'Kurang' : reviewScore === 3 ? 'Cukup' : reviewScore === 4 ? 'Bagus' : 'Sangat Bagus'}
                           </span>
                         )}
                       </div>

                       <textarea
                         value={reviewComment}
                         onChange={(e) => setReviewComment(e.target.value)}
                         placeholder="Bagikan pengalamanmu..."
                         rows={2}
                         className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm transition-all resize-none"
                       />

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

                   {ratings.length === 0 ? (
                     <div className="py-6 sm:py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <MessageCircle size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Belum ada ulasan.</p>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {ratings.map((r, i) => (
                          <div key={i} className="p-3 sm:p-4 bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-full flex items-center justify-center text-[10px] sm:text-xs uppercase border border-gray-200 dark:border-gray-700">
                                {r.user[0]}
                              </div>
                              <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{r.user}</span>
                              <div className="flex gap-0.5 ml-auto">
                                {[1,2,3,4,5].map(s => <Star key={s} size={8} className={s <= r.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />)}
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
                          </div>
                        ))}
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>

          <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-md lg:sticky lg:top-0 transition-colors">
                <h3 className="hidden lg:block font-black text-gray-900 dark:text-white mb-6 text-lg">Atur jumlah dan catatan</h3>
                <h3 className="lg:hidden font-bold text-gray-900 dark:text-white mb-4 text-sm">Beli Produk Ini</h3>
               
               <div className="space-y-5 sm:space-y-6">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                     <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 sm:p-1">
                       <button 
                         onClick={() => setQty(Math.max(1, qty - 1))}
                         className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors text-green-600 dark:text-emerald-400 disabled:opacity-30 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                         disabled={qty <= 1}
                       >
                         <Minus size={14} />
                       </button>
                       <input 
                         type="number" 
                         value={qty}
                         onChange={(e) => setQty(Math.max(1, Math.min(stock, parseInt(e.target.value) || 1)))}
                         className="w-10 sm:w-12 text-center bg-transparent border-none focus:ring-0 font-bold text-gray-900 dark:text-white text-sm sm:text-base"
                       />
                       <button 
                         onClick={() => setQty(Math.min(stock, qty + 1))}
                         className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors text-green-600 dark:text-emerald-400 disabled:opacity-30 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                         disabled={qty >= stock}
                       >
                         <Plus size={14} />
                       </button>
                     </div>
                     <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Stok: <span className="text-gray-900 dark:text-white font-bold">{stock}</span></p>
                  </div>

                 <div className="flex items-center justify-between py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
                    <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{formatPrice(product.price * qty)}</span>
                 </div>

                 <div className="space-y-2">
                   <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400">
                     <MapPin size={14} className="text-gray-400" />
                     Lokasi pembeli <span className="font-normal text-red-500">*</span>
                   </label>
                   <input
                     type="text"
                     value={buyerLocation}
                     onChange={(e) => setBuyerLocation(e.target.value)}
                     placeholder="Kota / provinsi / negara"
                     autoComplete="address-level1"
                     className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                   />
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    <button 
                      onClick={handleAddToCart}
                      className="w-full btn-primary py-3 rounded-xl sm:rounded-2xl text-white font-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm"
                    >
                      <Plus size={16} className="hidden sm:block" /> Keranjang
                    </button>
                    <button 
                      onClick={handleBuyNow}
                      className="w-full py-3 rounded-xl sm:rounded-2xl border-2 border-green-600 dark:border-emerald-500 text-green-600 dark:text-emerald-400 font-bold hover:bg-green-600 dark:hover:bg-emerald-500 hover:text-white transition-all text-xs sm:text-sm shadow-sm">
                      Beli Langsung
                    </button>
                 </div>

                 {user && user.id !== product.seller_id && (
                   <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={handleWishlist}
                      className={`flex items-center gap-2 text-xs font-bold transition-colors ${isWishlisted ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
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
          
          {isVideoUrl(currentImage) ? (
            <video
              src={currentImage}
              controls
              playsInline
              className="max-w-[95vw] max-h-[95vh] cursor-zoom-out"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            />
          ) : (
            <img src={currentImage} alt={product.name} 
              className="max-w-[95vw] max-h-[95vh] object-contain cursor-zoom-out"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }} 
            />
          )}
          
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

