import { useState, useEffect, useMemo, lazy, Suspense, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

const ProductModal = lazy(() => import('../components/ProductModal'));

const CATEGORIES = ['all', 'E-book', 'Course', 'Software', 'Template', 'Design', 'Audio', 'Other'];

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('');
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  // Memoize filtered product lists to avoid re-filtering on every render
  const myProducts = useMemo(() => user ? products.filter(p => p.seller_id === user.id) : [], [products, user]);
  const otherProducts = useMemo(() => products.filter(p => !user || p.seller_id !== user.id), [products, user]);

  // Observer for Infinite Scroll
  const observer = useRef();
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const fetchProducts = async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        page: isInitial ? 1 : page,
        limit: 12,
        category: category !== 'all' ? category : undefined,
        sort: sort || undefined,
        search: search || undefined
      };
      
      const requests = [api.get('/products', { params })];
      
      // Only search shops on the first page of a search
      if (isInitial && search) {
        requests.push(api.get('/shop/search/users', { params: { q: search } }));
      }

      const responses = await Promise.all(requests);
      const productRes = responses[0].data;
      
      if (isInitial) {
        setProducts(productRes.data || []);
        if (search && responses[1]) {
          setShops(responses[1].data || []);
        } else {
          setShops([]);
        }
      } else {
        setProducts(prev => [...prev, ...(productRes.data || [])]);
      }

      setHasMore(productRes.pagination.page < productRes.pagination.pages);
    } catch (err) { 
      console.error("Fetch products error:", err);
      if (isInitial) {
        setProducts([]);
        setShops([]);
      }
    } finally { 
      setLoading(false); 
      setLoadingMore(false);
    }
  };

  // Trigger initial fetch on filter change
  useEffect(() => {
    fetchProducts(true);
  }, [category, sort, user?.id]); // eslint-disable-line

  // Trigger load more on page change
  useEffect(() => {
    if (page > 1) {
      fetchProducts(false);
    }
  }, [page]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Produk berhasil dihapus!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus produk');
    }
  };

  const handleWishlistToggle = (productId, isActive) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, is_wishlisted: isActive } : p
    ));
    if (selected?.id === productId) {
        setSelected(prev => ({ ...prev, is_wishlisted: isActive }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {selected && (
        <Suspense fallback={null}>
          <ProductModal
            product={selected}
            onClose={() => setSelected(null)}
            initialWishlisted={selected.is_wishlisted}
            onWishlistToggle={handleWishlistToggle}
          />
        </Suspense>
      )}

      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-8">
        <div className="py-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">Marketplace <span className="text-green-600 dark:text-emerald-400">KaryaNusa</span></h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Temukan produk digital terbaik dari Nusantara</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Cari produk dan user..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-sm"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); fetchProducts(true); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={16} />
              </button>
            )}
          </form>

          <div className="grid grid-cols-2 sm:flex gap-3">
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="sm:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-600 dark:text-gray-300 focus:outline-none focus:border-green-500 cursor-pointer transition-colors shadow-sm text-sm"
            >
              <option value="all">Semua Kategori</option>
              {CATEGORIES.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-600 dark:text-gray-300 focus:outline-none focus:border-green-500 cursor-pointer transition-colors shadow-sm text-sm">
              <option value="">Urutkan</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="rating">Rating Terbaik</option>
              <option value="popular">Terpopuler</option>
            </select>
          </div>
        </div>

        <div className="hidden sm:flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                category === cat
                  ? 'btn-primary shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm'
              }`}>
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        {!loading && search && shops.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white border-l-4 border-green-500 pl-3">Toko / Kreator Terkait</h2>
               <span className="text-sm text-gray-500 dark:text-gray-400">{shops.length} hasil</span>
             </div>
             <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
               {shops.map(shop => (
                 <a href={`/shop/${shop.username || shop.id}`} key={shop.id} className="min-w-[160px] w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow flex-shrink-0 group">
                    {(shop.shop_logo_url || shop.avatar) ? (
                      <img src={shop.shop_logo_url || shop.avatar} className="w-12 h-12 rounded-full object-cover mb-2 bg-gray-100 dark:bg-gray-700 border-2 border-transparent group-hover:border-green-500 transition-colors" />
                    ) : (
                      <div className="w-12 h-12 rounded-full mb-2 bg-green-600 dark:bg-green-500 border-2 border-transparent group-hover:border-green-500 transition-colors flex items-center justify-center text-white font-black text-lg">
                        {(shop.shop_name || shop.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm w-full truncate">{shop.shop_name || shop.full_name}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 w-full truncate mb-2">@{shop.username || 'user'}</p>
                    <button className="w-full py-1 border border-green-500 text-green-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                      Kunjungi Toko
                    </button>
                 </a>
               ))}
             </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden animate-pulse border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                   <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                   <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && shops.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <Search size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Produk atau User tidak ditemukan</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* My Products Section */}
            {user && myProducts.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white border-l-4 border-green-600 pl-3">Produk Anda</h2>
                  <div className="flex items-center gap-3">
                    <a href="/profile?tab=statistik" className="text-sm font-bold text-blue-600 hover:underline">Statistik</a>
                    <a href="/profile" className="text-sm font-bold text-green-600 hover:underline">Kelola Semua</a>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                  {myProducts.map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onClick={() => setSelected(p)} 
                      onDelete={handleDelete}
                      initialWishlisted={p.is_wishlisted}
                      onWishlistToggle={handleWishlistToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Products Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white border-l-4 border-gray-300 dark:border-gray-700 pl-3">
                  {user && myProducts.length > 0 ? 'Jelajahi Produk Nusantara' : 'Semua Produk'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {products.length} produk
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {otherProducts.map((p, index) => (
                  <div key={p.id} ref={index === otherProducts.length - 1 ? lastElementRef : null}>
                    <ProductCard 
                      product={p} 
                      onClick={() => setSelected(p)} 
                      onDelete={handleDelete}
                      initialWishlisted={p.is_wishlisted}
                      onWishlistToggle={handleWishlistToggle}
                    />
                  </div>
                ))}
              </div>

              {loadingMore && (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              )}

              {!hasMore && products.length > 0 && (
                <div className="text-center py-10 text-gray-400 text-sm font-medium">
                  — Anda telah mencapai akhir katalog —
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
