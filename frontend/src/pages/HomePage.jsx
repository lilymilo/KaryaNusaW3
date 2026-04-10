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
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {selected && (
        <ProductModal 
          product={selected} 
          onClose={() => setSelected(null)} 
          initialWishlisted={wishlistIds.includes(selected.id)}
        />
      )}

      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header */}
        <div className="py-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">Marketplace <span className="gradient-text">KaryaNusa</span></h1>
          <p className="text-[var(--text-secondary)]">Temukan produk terbaik dari seluruh penjuru Nusantara</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" />
            <input
              type="text" placeholder="Cari produk..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] opacity-70 focus:opacity-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); fetchProducts(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={16} />
              </button>
            )}
          </form>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-secondary)] focus:outline-none focus:border-purple-500 cursor-pointer transition-colors">
            <option value="" className="bg-[var(--bg-color)]">Urutkan</option>
            <option value="price_asc" className="bg-[var(--bg-color)]">Harga Terendah</option>
            <option value="price_desc" className="bg-[var(--bg-color)]">Harga Tertinggi</option>
            <option value="rating" className="bg-[var(--bg-color)]">Rating Terbaik</option>
            <option value="popular" className="bg-[var(--bg-color)]">Terpopuler</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                category === cat
                  ? 'btn-primary text-white'
                  : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]'
              }`}>
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse border border-[var(--border-color)]">
                <div className="h-48 bg-[var(--card-bg)] opacity-50" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[var(--card-bg)] opacity-50 rounded" />
                  <div className="h-3 bg-[var(--card-bg)] opacity-50 rounded w-3/4" />
                  <div className="h-6 bg-[var(--card-bg)] opacity-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Search size={48} className="text-[var(--text-secondary)] opacity-20 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] text-lg">Produk tidak ditemukan</p>
            <p className="text-[var(--text-secondary)] opacity-50 text-sm mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <>
            <p className="text-[var(--text-secondary)] opacity-60 text-sm mb-4">{products.length} produk ditemukan</p>
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
