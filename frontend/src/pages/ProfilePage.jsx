import { useState, useEffect } from 'react';
import { 
  User, Store, Settings, Heart, Package, 
  TrendingUp, Home, Camera, Check, Save, 
  Trash2, Edit, Plus, ExternalLink, ShoppingBag, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function ProfilePage() {
  const { user, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState('akun');
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();

  // Forms State
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    phone_number: user?.phone_number || '',
    shop_name: user?.shop_name || '',
    shop_description: user?.shop_description || '',
    shop_address: user?.shop_address || '',
    shop_contact: user?.shop_contact || ''
  });

  // Assets State (Files)
  const [files, setFiles] = useState({
    avatar: null,
    shop_logo: null,
    shop_banner: null
  });

  // Previews
  const [previews, setPreviews] = useState({
    avatar: user?.avatar,
    shop_logo: user?.shop_logo_url,
    shop_banner: user?.shop_banner_url
  });

  // Data fetching (Wishlist, Products, Stats)
  const [wishlist, setWishlist] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeTab === 'wishlist') fetchWishlist();
    if (activeTab === 'produk') fetchMyProducts();
    if (activeTab === 'statistik') fetchStats();
  }, [activeTab]);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data);
    } catch (err) { console.error(err); }
  };

  const fetchMyProducts = async () => {
    try {
      const { data } = await api.get('/products');
      // Filter products by seller_id (this client-side filter is a backup, backend should ideally have a /my route)
      setMyProducts(data.filter(p => p.seller_id === user.id));
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/stats/seller');
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success('Produk berhasil dihapus');
      setMyProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err) {
      toast.error('Gagal menghapus produk');
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
      setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validate Phone
    const validatedPhone = validateWA(formData.phone_number);
    if (formData.phone_number && !validatedPhone) {
      return toast.error('Nomor WhatsApp tidak valid (Gunakan format 08xx atau +628xx)');
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'phone_number') {
          data.append(key, validatedPhone);
        } else {
          data.append(key, formData[key]);
        }
      });
      if (files.avatar) data.append('avatar', files.avatar);
      if (files.shop_logo) data.append('shop_logo', files.shop_logo);
      if (files.shop_banner) data.append('shop_banner', files.shop_banner);

      const response = await api.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      updateUserData(response.data.user);
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300 pb-20">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Header Profile */}
      <div className="pt-20 bg-gradient-to-b from-purple-500/10 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all mb-4"
           >
             <ArrowLeft size={18} /> Kembali
           </button>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-6 pb-12">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-xl">
              <img src={previews.avatar || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <label className="absolute bottom-1 right-1 p-2 bg-purple-600 rounded-full text-white cursor-pointer hover:bg-purple-700 transition-colors shadow-lg">
              <Camera size={18} />
              <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
            </label>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-1">{user?.full_name}</h1>
            <p className="text-[var(--text-secondary)] opacity-70 mb-3">@{user?.username || 'user'} · {user?.role === 'seller' ? 'Penjual' : 'Pembeli'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 glass rounded-full text-xs text-purple-400 border border-purple-500/20">{user?.email}</span>
              {user?.phone_number && <span className="px-3 py-1 glass rounded-full text-xs text-green-400 border border-green-500/20">{user.phone_number}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="glass rounded-2xl p-2 sticky top-24 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
              <button 
                onClick={() => setActiveTab('akun')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'akun' ? 'btn-primary text-white' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>
                <User size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Akun</span>
              </button>
              
              {user?.role === 'seller' && (
                <button 
                  onClick={() => setActiveTab('toko')}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'toko' ? 'btn-primary text-white' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>
                  <Home size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Toko</span>
                </button>
              )}

              {user?.role === 'buyer' && (
                <button 
                  onClick={() => setActiveTab('wishlist')}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'wishlist' ? 'btn-primary text-white' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>
                  <Heart size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Wishlist</span>
                </button>
              )}

              {user?.role === 'seller' && (
                <>
                  <button 
                    onClick={() => setActiveTab('produk')}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'produk' ? 'btn-primary text-white' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>
                    <Package size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Produk</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('statistik')}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'statistik' ? 'btn-primary text-white' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}>
                    <TrendingUp size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Statistik</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Content Areas */}
          <div className="flex-1 min-w-0">
            {/* 1. AKUN SECTION */}
            {activeTab === 'akun' && (
              <div className="glass rounded-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                  <User className="text-purple-500" /> Data Pribadi
                </h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Nama Lengkap</label>
                      <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Username</label>
                      <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
                      <input type="email" value={user?.email} disabled
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-secondary)] opacity-50 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Nomor HP</label>
                      <input type="text" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})}
                        className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                    {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
                  </button>
                </form>
              </div>
            )}

            {/* 2. TOKO SECTION (Seller only) */}
            {activeTab === 'toko' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass rounded-3xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                    <Home className="text-purple-500" /> Pengaturan Toko
                  </h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                      {/* Banner Upload */}
                      <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-[var(--border-color)] bg-white/5 group">
                        <img src={previews.shop_banner || 'https://via.placeholder.com/1200x400'} className="w-full h-full object-cover" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium">
                          <Camera className="mr-2" /> Ganti Banner Toko
                          <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'shop_banner')} accept="image/*" />
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Logo Upload */}
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-purple-500/30 flex-shrink-0 group">
                          <img src={previews.shop_logo || 'https://via.placeholder.com/200'} className="w-full h-full object-cover" />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={24} className="text-white" />
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'shop_logo')} accept="image/*" />
                          </label>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Nama Toko</label>
                            <input type="text" value={formData.shop_name} onChange={e => setFormData({...formData, shop_name: e.target.value})}
                              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Deskripsi Toko</label>
                            <textarea rows={3} value={formData.shop_description} onChange={e => setFormData({...formData, shop_description: e.target.value})}
                              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all resize-none" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Link Website / Portofolio</label>
                          <input type="text" placeholder="https://..." value={formData.shop_address} onChange={e => setFormData({...formData, shop_address: e.target.value})}
                            className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Kontak (WA/Email Toko)</label>
                          <input type="text" value={formData.shop_contact} onChange={e => setFormData({...formData, shop_contact: e.target.value})}
                            className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all" />
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary px-8 py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.02]">
                       Simpan Pengaturan Toko
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 3. WISHLIST SECTION (Buyer only) */}
            {activeTab === 'wishlist' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Heart className="text-red-500" fill="currentColor" /> Wishlist Saya
                  </h2>
                </div>
                {wishlist.length === 0 ? (
                  <div className="glass rounded-3xl p-12 text-center">
                    <Heart size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)] mb-4">Belum ada wishlist. Ayo cari produk favoritmu!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {wishlist.map(item => (
                      <ProductCard key={item.id} product={item.products} initialWishlisted={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. PRODUK SECTION (Seller only) */}
            {activeTab === 'produk' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Package className="text-blue-500" /> Koleksi Produk Anda
                  </h2>
                  <button className="btn-primary px-4 py-2 rounded-xl text-white text-sm flex items-center gap-2">
                    <Plus size={16} /> Tambah Baru
                  </button>
                </div>
                {myProducts.length === 0 ? (
                  <div className="glass rounded-3xl p-12 text-center">
                    <Package size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)]">Anda belum memiliki produk.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selected && (
                      <ProductModal 
                        product={selected} 
                        onClose={() => setSelected(null)} 
                      />
                    )}
                    {myProducts.map(p => (
                      <div key={p.id} 
                        onClick={() => setSelected(p)}
                        className="glass rounded-2xl p-4 flex items-center gap-4 border border-[var(--border-color)] cursor-pointer hover:bg-white/5 transition-colors group">
                        <img src={p.image} className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[var(--text-primary)] truncate">{p.name}</h4>
                          <p className="text-sm text-purple-500 font-medium">{formatPrice(p.price)}</p>
                          <p className="text-xs text-[var(--text-secondary)]">Stok: {p.stock} · Terjual: {p.sold}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-product/${p.id}`); }} className="p-2 glass text-[var(--text-secondary)] hover:text-purple-500 rounded-lg transition-colors">
                            <Edit size={18} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }} className="p-2 glass text-red-500/70 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. STATISTIK SECTION (Seller only) */}
            {activeTab === 'statistik' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                  <TrendingUp className="text-green-500" /> Analisis Performa
                </h2>
                
                {stats ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="glass rounded-2xl p-5 border-l-4 border-purple-500">
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Total Pendapatan</p>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{formatPrice(stats.totalRevenue)}</p>
                      </div>
                      <div className="glass rounded-2xl p-5 border-l-4 border-blue-500">
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Produk Terjual</p>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{stats.totalSold} Item</p>
                      </div>
                      <div className="glass rounded-2xl p-5 border-l-4 border-orange-500">
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Pesanan Aktif</p>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{stats.activeOrders}</p>
                      </div>
                      <div className="glass rounded-2xl p-5 border-l-4 border-green-500">
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Total Produk</p>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{stats.totalProducts}</p>
                      </div>
                    </div>

                    <div className="glass rounded-3xl p-6 sm:p-8 mt-6">
                      <h3 className="font-bold text-[var(--text-primary)] mb-6">Produk Terlaris Anda</h3>
                      <div className="space-y-4">
                        {stats.bestSellers.map((item, i) => (
                          <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-white/5 rounded text-xs font-bold text-[var(--text-secondary)]">{i+1}</span>
                              <p className="text-sm text-[var(--text-primary)] group-hover:text-purple-500 transition-colors">{item.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[var(--text-primary)]">{item.sold} kali</p>
                              <p className="text-[10px] text-[var(--text-secondary)] opacity-50">Stok sisa: {item.stock}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="glass rounded-3xl p-12 text-center animate-pulse">
                    Memuat statistik...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setProductToDelete(null)}>
          <div className="glass rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Hapus Produk?</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                Apakah Anda yakin ingin menghapus <strong>{productToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-[var(--text-primary)] glass hover:bg-white/10 border border-[var(--border-color)] transition-colors">
                  Batal
                </button>
                <button 
                  onClick={handleDeleteProduct}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-[0_4px_14px_rgba(239,68,68,0.4)]">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
