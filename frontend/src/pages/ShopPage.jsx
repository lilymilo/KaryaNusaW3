import { useState, useEffect } from 'react';
import { Store, Package, Star, MessageCircle, Share2, ArrowLeft, ShoppingBag, Copy, Check } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';
import toast from 'react-hot-toast';

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function ShopPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/shop/${encodeURIComponent(username)}`);
        setShop(data.shop);
        setProducts(data.products);
      } catch (err) {
        console.error('Error fetching shop data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData(username);
  }, [username]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center transition-colors">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex flex-col items-center justify-center transition-colors">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Toko tidak ditemukan</h2>
        <Link to="/home" className="btn-primary px-6 py-2 rounded-xl text-white">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300 pb-20">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Hero Banner Section */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <img 
          src={shop.shop_banner_url || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1600'} 
          className="w-full h-full object-cover" 
          alt="Shop Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-transparent to-transparent" />
        
        <Link to="/home" className="absolute top-24 left-6 z-10 p-2 glass rounded-full text-[var(--text-primary)] hover:bg-white/20 transition-all flex items-center gap-2 px-4 text-sm font-bold">
           <ArrowLeft size={18} /> Kembali
        </Link>
      </div>

      {/* Shop Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative -mt-20 z-10">
        <div className="glass rounded-[2.5rem] p-6 md:p-10 border border-[var(--border-color)] shadow-2xl flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          
          {/* Shop Logo */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-purple-500/30 shadow-2xl bg-[var(--card-bg)]">
              <img src={shop.shop_logo_url || shop.avatar || 'https://via.placeholder.com/150'} alt={shop.shop_name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Shop Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                <h1 className="text-4xl font-black text-[var(--text-primary)] leading-tight">{shop.shop_name || shop.full_name}</h1>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-bold rounded-lg border border-purple-500/20">Verified Seller</span>
              </div>
              <p className="text-[var(--text-secondary)] font-medium max-w-2xl">
                {shop.shop_description || "Selamat datang di toko resmi kami. Kami menyediakan produk digital berkualitas tinggi."}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[var(--text-primary)]">{products.length}</span>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Produk</span>
              </div>
              <div className="w-px h-10 bg-[var(--border-color)]" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  4.9 <Star size={20} className="fill-yellow-500 text-yellow-500" />
                </span>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Rating Toko</span>
              </div>
              <div className="w-px h-10 bg-[var(--border-color)]" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-[var(--text-primary)]">1k+</span>
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Terjual</span>
              </div>
            </div>
          </div>

          {/* Shop Actions */}
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={handleChat}
              className="btn-primary px-8 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
               <MessageCircle size={18} /> Chat Penjual
            </button>
            <button 
              onClick={handleShare}
              className="glass px-8 py-3.5 rounded-2xl text-[var(--text-primary)] font-bold flex items-center justify-center gap-2 border border-[var(--border-color)] hover:bg-white/10 transition-all"
            >
               {isCopied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
               {isCopied ? 'Tersalin' : 'Bagikan'}
            </button>
          </div>
        </div>

        {/* Catalog Section */}
        <div className="mt-16 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-[var(--text-primary)]">Katalog Produk</h2>
              <p className="text-[var(--text-secondary)] font-medium">Jelajahi semua karya digital dari {shop.shop_name || "toko ini"}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-secondary)]">
               <ShoppingBag size={16} className="text-purple-500" /> {products.length} Produk
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl border border-dashed border-[var(--border-color)]">
               <Package size={48} className="mx-auto text-[var(--text-secondary)] opacity-30 mb-4" />
               <p className="text-[var(--text-secondary)] font-bold text-xl">Belum ada produk yang ditampilkan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
