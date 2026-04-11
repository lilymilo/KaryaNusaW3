import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'E-book', 'Course', 'Software', 'Template', 'Design', 'Audio', 'Other'];

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('');
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'all') params.category = category;
      if (sort) params.sort = sort;
      const { data } = await api.get('/products', { params });
      setProducts(data);

      if (user && user.role === 'buyer') {
        const { data: wishData } = await api.get('/wishlist');
        setWishlistIds(wishData.map(item => item.product_id));
      }
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [category, sort]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {selected && (
        <ProductModal 
          product={selected} 
          onClose={() => setSelected(null)} 
          initialWishlisted={wishlistIds.includes(selected.id)}
        />
      )}

      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Header */}
        <div className="py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Marketplace <span className="text-green-600 dark:text-emerald-400">KaryaNusa</span></h1>
          <p className="text-gray-600 dark:text-gray-400">Temukan produk terbaik dari seluruh penjuru Nusantara</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Cari produk..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-sm"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); fetchProducts(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={16} />
              </button>
            )}
          </form>

          <div className="grid grid-cols-2 sm:flex gap-3">
            {/* Category Dropdown (Mobile Only) */}
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              className="sm:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-600 dark:text-gray-300 focus:outline-none focus:border-green-500 cursor-pointer transition-colors shadow-sm text-sm"
            >
              <option value="all">Semua Kategori</option>
              {CATEGORIES.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-600 dark:text-gray-300 focus:outline-none focus:border-green-500 cursor-pointer transition-colors shadow-sm text-sm">
              <option value="">Urutkan</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="rating">Rating Terbaik</option>
              <option value="popular">Terpopuler</option>
            </select>
          </div>
        </div>

        {/* Category Filter - Desktop Only */}
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
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

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <Search size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Produk tidak ditemukan</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{products.length} produk ditemukan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onClick={() => setSelected(p)} 
                  onDelete={handleDelete}
                  initialWishlisted={wishlistIds.includes(p.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
