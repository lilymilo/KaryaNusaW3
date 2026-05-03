import { useState, useEffect } from 'react';
import { Store, Package, Star, MessageCircle, Share2, ArrowLeft, ShoppingBag, Copy, Check, Repeat, BarChart2, Trash2, Heart, MessageSquare, User } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import toast from 'react-hot-toast';
import FollowListModal from '../components/FollowListModal';

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff/60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff/3600)}j lalu`;
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

export default function ShopPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('produk');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [reviews, setReviews] = useState({ data: [], stats: { total: 0, average: 0 } });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userThreads, setUserThreads] = useState([]);
  const [modalType, setModalType] = useState(null); // 'followers' or 'following'
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/shop/${encodeURIComponent(username)}`);
        setShop(data.shop);
        setProducts(data.products);

        if (data.shop) {
           // Fetch all secondary data in parallel for much faster page load
           const promises = [
             api.get(`/social/stats/${data.shop.id}`).catch(e => { console.error('Stats error:', e); return null; }),
             api.get(`/social/review/${data.shop.id}`).catch(e => { console.error('Review error:', e); return null; }),
             api.get(`/threads/user/${data.shop.id}`).catch(e => { console.error('Threads error:', e); return null; }),
           ];

           if (user && user.id !== data.shop.id) {
             promises.push(api.get(`/social/follow/${data.shop.id}/status`).catch(e => { console.error('Follow status error:', e); return null; }));
           } else {
             promises.push(Promise.resolve(null));
           }

           if (user) {
             promises.push(api.get('/wishlist').catch(e => { console.error('Wishlist error:', e); return null; }));
           } else {
             promises.push(Promise.resolve(null));
           }

           const [statsRes, reviewRes, threadsRes, followRes, wishRes] = await Promise.all(promises);

           if (statsRes?.data) setFollowStats(statsRes.data);
           if (reviewRes?.data) setReviews({ data: reviewRes.data.reviews || [], stats: reviewRes.data.stats || { total: 0, average: 0 } });
           if (threadsRes?.data) setUserThreads(threadsRes.data.data || threadsRes.data || []);
           if (followRes?.data) setIsFollowing(followRes.data.isFollowing);
           if (wishRes?.data) setWishlistIds(wishRes.data.map(item => item.product_id));
        }
      } catch (err) {
        console.error('Error fetching shop data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [username, user?.id]); // eslint-disable-line

  const toggleFollow = async () => {
    if (!user) return toast.error('Silakan login terlebih dahulu');
    try {
      const { data } = await api.post(`/social/follow/${shop.id}`);
      setIsFollowing(data.isFollowing);
      setFollowStats(prev => ({ ...prev, followers: prev.followers + (data.isFollowing ? 1 : -1) }));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah status follow');
    }
  };

  const handleWishlistToggle = (productId, isActive) => {
    setWishlistIds(prev => {
      if (isActive) {
        if (prev.includes(productId)) return prev;
        return [...prev, productId];
      } else {
        return prev.filter(id => id !== productId);
      }
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Silakan login terlebih dahulu');
    if (!reviewForm.rating) return toast.error('Pilih rating 1-5');

    setSubmittingReview(true);
    try {
      await api.post(`/social/review/${shop.id}`, reviewForm);
      toast.success('Ulasan berhasil ditambahkan!');
      setReviewForm({ rating: 5, comment: '' });
      const reviewRes = await api.get(`/social/review/${shop.id}`);
      setReviews({ data: reviewRes.data.reviews, stats: reviewRes.data.stats });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menambahkan ulasan');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `KaryaNusa - ${shop?.shop_name || username}`,
      text: shop?.shop_description || `Lihat toko ${shop?.shop_name || username} di KaryaNusa!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        toast.success('Link toko berhasil disalin!');
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleChat = () => {
    navigate(`/chat/${username}`);
  };

  const handleLike = async (threadId) => {
    if (!user) return toast.error('Harap login');
    try {
      const { data } = await api.post(`/threads/${threadId}/like`);
      setUserThreads(userThreads.map(t => {
        if (t.id === threadId) {
          return { ...t, isLiked: data.isLiked, likes_count: t.likes_count + (data.isLiked ? 1 : -1) };
        }
        return t;
      }));
    } catch (err) {}
  };

  const handleRepost = async (e, threadId) => {
    e.stopPropagation();
    if (!user) return toast.error('Harap login');
    try {
      const { data: repostData } = await api.post(`/threads/${threadId}/repost`);
      toast.success('Utas berhasil direpost!');
      if (shop && user.id === shop.id && repostData) {
        setUserThreads(prev => [repostData, ...prev]);
      } else {
        const { data } = await api.get(`/threads/user/${shop.id}`);
        setUserThreads(data.data || []);
      }
    } catch (err) {
      toast.error('Gagal merepost utas');
    }
  };

  const handleDelete = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus utas ini?')) return;
    try {
      await api.delete(`/threads/${threadId}`);
      toast.success('Utas berhasil dihapus');
      setUserThreads(userThreads.filter(t => t.id !== threadId));
    } catch (err) {
      toast.error('Gagal menghapus utas');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="w-10 h-10 border-4 border-green-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center transition-colors">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Toko tidak ditemukan</h2>
        <Link to="/home" className="btn-primary px-6 py-2 rounded-xl text-white font-bold shadow-sm">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20 pt-14">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="relative h-32 sm:h-44 w-full overflow-hidden bg-gray-200 dark:bg-gray-800 transition-colors">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
          title="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        {shop.shop_banner_url && (
          <img 
            src={shop.shop_banner_url} 
            className="w-full h-full object-cover" 
            alt="Shop Banner"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-gray-950 via-transparent to-transparent transition-colors pointer-events-none" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-10 z-10">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-3 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              {shop.shop_logo_url || shop.avatar ? (
                <img src={shop.shop_logo_url || shop.avatar} alt={shop.shop_name} className="w-full h-full object-cover" />
              ) : (
                <Store size={32} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight truncate">{shop.shop_name || shop.full_name}</h1>
                <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-emerald-400 text-[10px] font-bold rounded border border-green-200 dark:border-emerald-900/50">Verified</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-bold mb-2">@{shop.username}</p>
              {shop.shop_description && (
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium line-clamp-2">{shop.shop_description}</p>
              )}

              {/* Stats inline */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3">
                <button onClick={() => setModalType('followers')} className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
                  <span className="text-sm font-black text-gray-900 dark:text-white">{followStats.followers}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pengikut</span>
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 self-center" />
                <button onClick={() => setModalType('following')} className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
                  <span className="text-sm font-black text-gray-900 dark:text-white">{followStats.following || 0}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Mengikuti</span>
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 self-center" />
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-black text-gray-900 dark:text-white">{reviews.stats.average}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 self-center" />
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-gray-900 dark:text-white">{products.length}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Karya</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
              {user?.id !== shop?.id && (
                <button 
                  onClick={toggleFollow}
                  className={`flex-1 sm:flex-none px-5 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.97] ${isFollowing ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 border border-gray-300 dark:border-gray-700 group' : 'btn-primary text-white'}`}
                >
                   {isFollowing ? (
                     <>
                       <span className="group-hover:hidden">Mengikuti</span>
                       <span className="hidden group-hover:inline">Batal</span>
                     </>
                   ) : (
                     'Ikuti'
                   )}
                </button>
              )}
              <div className="flex gap-2">
                {user?.id !== shop?.id && (
                  <button 
                    onClick={handleChat}
                    className="flex-1 sm:flex-none bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 border border-blue-100 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all shadow-sm"
                  >
                    <MessageCircle size={16} /> Chat
                  </button>
                )}
                <button 
                  onClick={handleShare}
                  className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                >
                   {isCopied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto scrollbar-hide sticky top-14 z-20 bg-gray-50 dark:bg-gray-950 transition-colors pt-1">
          <button 
            onClick={() => setActiveTab('produk')}
            className={`pb-2 px-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'produk' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Katalog
          </button>
          <button 
            onClick={() => setActiveTab('utas')}
            className={`pb-2 px-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'utas' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Utas
          </button>
          <button 
            onClick={() => setActiveTab('ulasan')}
            className={`pb-2 px-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'ulasan' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Ulasan
            <span className="bg-gray-100 dark:bg-gray-800 text-[10px] px-1.5 py-0.5 rounded-full">{reviews.stats.total}</span>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {activeTab === 'produk' && (
            <>
              {products.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 shadow-sm rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                   <Package size={36} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                   <p className="text-gray-500 dark:text-gray-400 font-bold text-base">Belum ada karya digital</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {products.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      initialWishlisted={wishlistIds.includes(p.id)} 
                      onWishlistToggle={handleWishlistToggle}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'utas' && (
            <div className="animate-in fade-in max-w-2xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {userThreads.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm font-medium">Belum ada utas.</div>
                ) : (
                  userThreads.map(thread => (
                    <div key={thread.id} onClick={() => navigate(`/thread/${thread.id}`)} className="p-2.5 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      {thread.quoted_thread_id && !thread.content && (
                        <div className="flex items-center gap-1.5 mb-1.5 ml-8 text-gray-500 font-bold text-[11px]">
                          <Repeat size={12} />
                          <span>{thread.author.full_name} memposting ulang</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="shrink-0">
                          {thread.author.avatar || thread.author.shop_logo_url ? (
                            <img src={thread.author.avatar || thread.author.shop_logo_url} className="w-8 h-8 rounded-full object-cover bg-gray-100 dark:bg-gray-800" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                              <User size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{thread.author.shop_name || thread.author.full_name}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs truncate">@{thread.author.username}</span>
                            <span className="text-gray-400 text-xs">·</span>
                            <span className="text-gray-400 text-xs whitespace-nowrap">{formatTime(thread.created_at)}</span>
                            {user && user.id === thread.author.id && (
                              <button onClick={(e) => handleDelete(e, thread.id)} className="ml-auto text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full" title="Hapus">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          
                          {thread.parent_id && thread.parent_thread?.author?.username && (
                             <p className="text-[11px] text-gray-500 mb-1">
                               Membalas <span className="text-green-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.parent_id}`); }}>@{thread.parent_thread.author.username}</span>
                             </p>
                          )}
                          
                          {thread.content && (
                            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm leading-snug mb-2">{thread.content}</p>
                          )}

                          {thread.image_url && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img src={thread.image_url} alt="" className="w-full h-auto max-h-64 object-cover" />
                            </div>
                          )}

                          {thread.quoted_thread && (
                            <div className="mb-2 rounded-xl border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.quoted_thread.id}`); }}>
                              <div className="flex items-center gap-1 mb-1">
                                 {thread.quoted_thread.author?.avatar ? (
                                   <img src={thread.quoted_thread.author.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                                 ) : (
                                   <div className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"><User size={8} className="text-gray-400"/></div>
                                 )}
                                 <span className="font-bold text-xs text-gray-900 dark:text-white truncate">{thread.quoted_thread.author?.shop_name || thread.quoted_thread.author?.full_name || 'User'}</span>
                                 <span className="text-gray-500 text-[11px]">·</span>
                                 <span className="text-gray-500 text-[11px] whitespace-nowrap">{formatTime(thread.quoted_thread.created_at)}</span>
                              </div>
                              <p className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2">{thread.quoted_thread.content}</p>
                              {thread.quoted_thread.image_url && (
                                <img src={thread.quoted_thread.image_url} className="mt-1.5 rounded-lg border border-gray-200 dark:border-gray-700 max-h-32 w-full object-cover" />
                              )}
                            </div>
                          )}

                          {thread.product && (
                            <div onClick={(e) => { e.stopPropagation(); navigate(`/home`); }} className="mb-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex gap-2.5 items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                              <img src={thread.product.image || thread.product.image_url} className="w-10 h-10 rounded-lg object-cover" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">{thread.product.name}</h4>
                                <p className="text-green-600 dark:text-emerald-400 font-bold text-xs">{formatPrice(thread.product.price)}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500 mt-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.id}`); }} className="flex items-center gap-1 hover:text-blue-500 transition-colors text-xs">
                              <MessageSquare size={14} />
                              {thread.replies_count > 0 && <span className="font-semibold">{thread.replies_count}</span>}
                            </button>
                            <div className="relative group/repost">
                              <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 hover:text-green-500 transition-colors text-xs">
                                <Repeat size={14} />
                                {thread.reposts_count > 0 && <span className="font-semibold">{thread.reposts_count}</span>}
                              </button>
                              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-32 opacity-0 invisible group-hover/repost:opacity-100 group-hover/repost:visible transition-all z-20 overflow-hidden">
                                <button onClick={(e) => handleRepost(e, thread.id)} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Repost</button>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/quote/${thread.id}?type=thread`); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Kutip</button>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleLike(thread.id); }} className={`flex items-center gap-1 transition-colors text-xs ${thread.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
                              <Heart size={14} className={thread.isLiked ? "fill-pink-500" : ""} />
                              {thread.likes_count > 0 && <span className="font-semibold">{thread.likes_count}</span>}
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-500 transition-colors text-xs">
                              <BarChart2 size={14} />
                              {thread.views_count > 0 && <span className="font-semibold">{thread.views_count}</span>}
                            </button>
                            <button className="hover:text-green-500 transition-colors" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.host + '/thread/' + thread.id); toast.success('Link disalin') }}>
                               <Share2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'ulasan' && (
            <div className="animate-in fade-in flex flex-col md:flex-row gap-8">
              
              {user && user.id !== shop.id && (
                <div className="w-full md:w-1/3 bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-200 dark:border-gray-700 shadow-sm h-fit">
                  <h3 className="font-bold text-lg mb-4 dark:text-white">Berikan Penilaian</h3>
                  <form onSubmit={submitReview} className="space-y-4">
                    <div className="flex gap-2 justify-center py-2">
                       {[1, 2, 3, 4, 5].map(star => (
                         <Star 
                           key={star} 
                           size={32} 
                           onClick={() => setReviewForm(prev => ({...prev, rating: star}))}
                           className={`cursor-pointer transition-colors ${reviewForm.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`} 
                         />
                       ))}
                    </div>
                    <textarea 
                      placeholder="Bagaimana pengalaman Anda dengan kreator ini?"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white resize-none h-24"
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(prev => ({...prev, comment: e.target.value}))}
                    ></textarea>
                    <button type="submit" disabled={submittingReview} className="w-full btn-primary py-3 rounded-xl text-white font-bold disabled:opacity-70">
                      {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                    </button>
                  </form>
                </div>
              )}

              <div className="flex-1 space-y-4">
                 {reviews.data.length === 0 ? (
                   <div className="text-center py-10 opacity-50">
                     <Star size={40} className="mx-auto mb-3 text-gray-400" />
                     <p className="font-medium text-gray-500 dark:text-gray-400">Belum ada ulasan untuk kreator ini.</p>
                   </div>
                 ) : (
                   reviews.data.map(review => (
                     <div key={review.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex gap-4">
                        {review.reviewer?.avatar ? (
                          <img src={review.reviewer.avatar} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <User size={24} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 dark:text-white">{review.reviewer?.full_name || 'Pembeli'}</span>
                            <span className="text-[10px] text-gray-400 px-2 flex items-center">
                               {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1 mb-2">
                             {[1, 2, 3, 4, 5].map(star => (
                               <Star key={star} size={14} className={review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200 dark:fill-gray-800 dark:text-gray-800'} />
                             ))}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium leading-relaxed">{review.comment || 'Memberikan rating tanpa ulasan tertulis.'}</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>
            </div>
          )}
        </div>
      </div>

      <FollowListModal 
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        userId={shop.id}
        type={modalType}
        title={modalType === 'followers' ? 'Pengikut' : 'Mengikuti'}
      />
    </div>
  );
}
