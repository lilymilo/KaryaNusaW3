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
           const [statsRes, reviewRes, threadsRes] = await Promise.all([
             api.get(`/social/stats/${data.shop.id}`),
             api.get(`/social/review/${data.shop.id}`),
             api.get(`/threads/user/${data.shop.id}`)
           ]);
           setFollowStats(statsRes.data);
           setReviews({ data: reviewRes.data.reviews, stats: reviewRes.data.stats });
           setUserThreads(threadsRes.data);

           if (user && user.id !== data.shop.id) {
             const statusRes = await api.get(`/social/follow/${data.shop.id}/status`);
             setIsFollowing(statusRes.data.isFollowing);
           }
        }

        if (user) {
          const { data: wishData } = await api.get('/wishlist');
          setWishlistIds(wishData.map(item => item.product_id));
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
        setUserThreads(data);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20 pt-16">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-200 dark:bg-gray-800 transition-colors">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 p-2 sm:p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors"
          title="Kembali"
        >
          <ArrowLeft size={24} />
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-20 z-10">
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 md:p-10 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 transition-colors">
          
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-colors">
              {shop.shop_logo_url || shop.avatar ? (
                <img src={shop.shop_logo_url || shop.avatar} alt={shop.shop_name} className="w-full h-full object-cover" />
              ) : (
                <Store size={48} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                <div className="flex flex-col items-center md:items-start">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight">{shop.shop_name || shop.full_name}</h1>
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-bold mt-1">@{shop.username}</span>
                </div>
                <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-green-200 dark:border-emerald-900/50">Verified Seller</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base font-medium max-w-2xl">
                {shop.shop_description || "Selamat datang di toko resmi kami. Kami menyediakan produk digital berkualitas tinggi."}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
              <button 
                onClick={() => setModalType('followers')}
                className="flex flex-col hover:bg-gray-100 dark:hover:bg-gray-800 p-2 -m-2 rounded-xl transition-colors text-center md:text-left"
              >
                <span className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{followStats.followers}</span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pengikut</span>
              </button>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <button 
                onClick={() => setModalType('following')}
                className="flex flex-col hover:bg-gray-100 dark:hover:bg-gray-800 p-2 -m-2 rounded-xl transition-colors text-center md:text-left"
              >
                <span className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{followStats.following || 0}</span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mengikuti</span>
              </button>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  {reviews.stats.average} <Star size={20} className="fill-yellow-500 text-yellow-500" />
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating Toko</span>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{products.length}</span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Karya</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {user?.id !== shop?.id && (
              <button 
                onClick={toggleFollow}
                className={`px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] ${isFollowing ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 border border-gray-300 dark:border-gray-700' : 'btn-primary text-white'}`}
              >
                 {isFollowing ? 'Mengikuti' : 'Ikuti Profil'}
              </button>
            )}
            <div className="flex gap-2">
              {user?.id !== shop?.id && (
                <button 
                  onClick={handleChat}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all shadow-sm"
                >
                  <MessageCircle size={18} /> Chat
                </button>
              )}
              <button 
                onClick={handleShare}
                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                 {isCopied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8 overflow-x-auto scrollbar-hide sticky top-16 z-20 bg-gray-50 dark:bg-gray-950 transition-colors pt-2">
          <button 
            onClick={() => setActiveTab('produk')}
            className={`pb-2 px-4 font-bold text-[15px] sm:text-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === 'produk' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Katalog Produk
          </button>
          <button 
            onClick={() => setActiveTab('utas')}
            className={`pb-2 px-4 font-bold text-[15px] sm:text-lg border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'utas' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Utas
          </button>
          <button 
            onClick={() => setActiveTab('ulasan')}
            className={`pb-2 px-4 font-bold text-[15px] sm:text-lg border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'ulasan' ? 'text-green-600 border-green-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
          >
            Ulasan
            <span className="bg-gray-100 dark:bg-gray-800 text-xs px-2 py-0.5 rounded-full">{reviews.stats.total}</span>
          </button>
        </div>

        <div className="mt-8 space-y-8">
          {activeTab === 'produk' && (
            <>
              {products.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 shadow-sm rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                   <Package size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                   <p className="text-gray-500 dark:text-gray-400 font-bold text-xl">Belum ada karya digital</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {products.map(p => (
                    <ProductCard key={p.id} product={p} initialWishlisted={wishlistIds.includes(p.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'utas' && (
            <div className="animate-in fade-in max-w-2xl mx-auto rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {userThreads.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 font-medium">Belum ada utas yang dibagikan oleh pembuat ini.</div>
                ) : (
                  userThreads.map(thread => (
                    <div key={thread.id} onClick={() => navigate(`/thread/${thread.id}`)} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer last:border-0 border-b border-gray-100 dark:border-gray-800">
                      {thread.quoted_thread_id && !thread.content && (
                        <div className="flex items-center gap-2 mb-2 ml-8 text-gray-500 font-bold text-xs">
                          <Repeat size={14} />
                          <span>{thread.author.full_name} memposting ulang</span>
                        </div>
                      )}
                      <div className="flex gap-2.5 sm:gap-3">
                        <div className="shrink-0 z-10">
                          {thread.author.avatar || thread.author.shop_logo_url ? (
                            <img src={thread.author.avatar || thread.author.shop_logo_url} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800" />
                          ) : (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                              <User size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 z-10 relative">
                            <div className="font-bold text-gray-900 dark:text-white hover:underline truncate">
                              {thread.author.shop_name || thread.author.full_name}
                            </div>
                            <span className="text-gray-500 dark:text-gray-400 text-sm truncate">@{thread.author.username}</span>
                            <span className="text-gray-500 text-sm">·</span>
                            <span className="text-gray-500 text-sm whitespace-nowrap hover:underline">{formatTime(thread.created_at)}</span>
                            {user && user.id === thread.author.id && (
                              <button onClick={(e) => handleDelete(e, thread.id)} className="ml-auto text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30" title="Hapus Utas">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                          
                          {thread.parent_id && thread.parent_thread?.author?.username && (
                             <p className="text-xs text-gray-500 mb-1.5">
                               Membalas <span className="text-green-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.parent_id}`); }}>@{thread.parent_thread.author.username}</span>
                             </p>
                          )}
                          
                          {thread.content && (
                            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed mb-2.5">
                              {thread.content}
                            </p>
                          )}

                          {thread.image_url && (
                            <div className="mb-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img src={thread.image_url} alt="Thread media" className="w-full h-auto max-h-96 object-cover" />
                            </div>
                          )}

                          {thread.quoted_thread && (
                            <div className="mb-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.quoted_thread.id}`); }}>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                 {thread.quoted_thread.author?.avatar ? (
                                   <img src={thread.quoted_thread.author.avatar} className="w-4 h-4 rounded-full object-cover" />
                                 ) : (
                                   <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"><User size={10} className="text-gray-400"/></div>
                                 )}
                                 <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-1">{thread.quoted_thread.author?.shop_name || thread.quoted_thread.author?.full_name || 'User'}</span>
                                 <span className="text-gray-500 text-xs sm:text-sm truncate">@{thread.quoted_thread.author?.username || 'user'}</span>
                                 <span className="text-gray-500 text-xs sm:text-sm">·</span>
                                 <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">{formatTime(thread.quoted_thread.created_at)}</span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200">{thread.quoted_thread.content}</p>
                              {thread.quoted_thread.image_url && (
                                <img src={thread.quoted_thread.image_url} className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 max-h-48 w-full object-cover" />
                              )}
                            </div>
                          )}

                          {thread.product && (
                            <div onClick={(e) => { e.stopPropagation(); navigate(`/home`); }} className="block mb-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex gap-4 items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group relative z-10">
                              <img src={thread.product.image_url} className="w-16 h-16 rounded-lg object-cover" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-green-600 transition-colors line-clamp-1">{thread.product.name}</h4>
                                <p className="text-green-600 dark:text-emerald-400 font-bold text-sm mt-1">Rp {thread.product.price.toLocaleString('id-ID')}</p>
                              </div>
                              <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-600"><Package size={16}/></div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mt-3 pr-2 sm:pr-8 relative z-10 max-w-md">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.id}`); }} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
                              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 -ml-2"><MessageSquare size={18} /></div>
                              <span className="text-xs font-semibold">{thread.replies_count > 0 ? thread.replies_count : ''}</span>
                            </button>
                            <div className="relative group/repost">
                              <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
                                <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30 -ml-2"><Repeat size={18} /></div>
                                <span className="text-xs font-semibold">{thread.reposts_count > 0 ? thread.reposts_count : ''}</span>
                              </button>
                              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-36 opacity-0 invisible group-hover/repost:opacity-100 group-hover/repost:visible transition-all z-20 overflow-hidden">
                                <button onClick={(e) => handleRepost(e, thread.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap">
                                  Repost Langsung
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/quote/${thread.id}?type=thread`); }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap">
                                  Kutip Utas
                                </button>
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleLike(thread.id); }} className={`flex items-center gap-1.5 transition-colors group ${thread.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
                              <div className="p-2 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-900/30 -ml-2">
                                <Heart size={18} className={thread.isLiked ? "fill-pink-500" : ""} />
                              </div>
                              <span className="text-xs font-semibold">{thread.likes_count > 0 ? thread.likes_count : ''}</span>
                            </button>
                            <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
                              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 -ml-2"><BarChart2 size={18} /></div>
                              <span className="text-xs font-semibold">{thread.views_count > 0 ? thread.views_count : ''}</span>
                            </button>
                            <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors group" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.host + '/thread/' + thread.id); toast.success('Link disalin') }}>
                               <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30 -ml-2"><Share2 size={18} /></div>
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
