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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-32">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Header Profile */}
      <div className="pt-20 bg-gradient-to-b from-green-50 to-gray-50 dark:from-green-900/10 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl text-gray-500 hover:text-gray-900 transition-all mb-4 font-medium"
           >
             <ArrowLeft size={18} /> Kembali
           </button>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-6 pb-12">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-white dark:bg-gray-800">
              <img src={previews.avatar || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <label className="absolute bottom-1 right-1 p-2 bg-green-600 rounded-full text-white cursor-pointer hover:bg-green-700 transition-colors shadow-lg border-2 border-white dark:border-gray-800">
              <Camera size={18} />
              <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
            </label>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{user?.full_name}</h1>
            <p className="text-gray-500 mb-3 font-medium">@{user?.username || 'user'} · {user?.role === 'seller' ? 'Penjual' : 'Pembeli'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-green-600 dark:text-emerald-400">{user?.email}</span>
              {user?.phone_number && <span className="px-3 py-1 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-green-600 dark:text-emerald-400">{user.phone_number}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 sticky top-24 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible scrollbar-hide border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
              <button 
                onClick={() => setActiveTab('akun')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'akun' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <User size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Akun</span>
              </button>
              
              {user?.role === 'seller' && (
                <button 
                  onClick={() => setActiveTab('toko')}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'toko' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <Home size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Toko</span>
                </button>
              )}

              {user?.role === 'buyer' && (
                <button 
                  onClick={() => setActiveTab('wishlist')}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'wishlist' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <Heart size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Wishlist</span>
                </button>
              )}

              {user?.role === 'seller' && (
                <>
                  <button 
                    onClick={() => setActiveTab('produk')}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'produk' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <Package size={20} /> <span className="text-sm lg:text-base whitespace-nowrap">Produk</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('statistik')}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'statistik' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
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
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="text-green-600" /> Data Pribadi
                </h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Nama Lengkap</label>
                      <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                        className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Username</label>
                      <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Email</label>
                      <input type="email" value={user?.email} disabled
                        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Nomor HP</label>
                      <input type="text" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})}
                        className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-8 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm">
                    {loading ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
                  </button>
                </form>
              </div>
            )}

            {/* 2. TOKO SECTION (Seller only) */}
            {activeTab === 'toko' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-gray-900 shadow-sm rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 transition-colors">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Home className="text-green-600" /> Pengaturan Toko
                  </h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                      {/* Banner Upload */}
                      <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 group transition-colors">
                        <img src={previews.shop_banner || 'https://via.placeholder.com/1200x400'} className="w-full h-full object-cover" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium">
                          <Camera className="mr-2" /> Ganti Banner Toko
                          <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'shop_banner')} accept="image/*" />
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Logo Upload */}
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-md flex-shrink-0 group">
                          <img src={previews.shop_logo || 'https://via.placeholder.com/200'} className="w-full h-full object-cover bg-white dark:bg-gray-800" />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={24} className="text-white" />
                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'shop_logo')} accept="image/*" />
                          </label>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Nama Toko</label>
                            <input type="text" value={formData.shop_name} onChange={e => setFormData({...formData, shop_name: e.target.value})}
                              className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Deskripsi Toko</label>
                            <textarea rows={3} value={formData.shop_description} onChange={e => setFormData({...formData, shop_description: e.target.value})}
                              className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none font-medium" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Link Website / Portofolio</label>
                          <input type="text" placeholder="https://..." value={formData.shop_address} onChange={e => setFormData({...formData, shop_address: e.target.value})}
                            className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Kontak (WA/Email Toko)</label>
                          <input type="text" value={formData.shop_contact} onChange={e => setFormData({...formData, shop_contact: e.target.value})}
                            className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary px-8 py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.02] shadow-sm">
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Heart className="text-red-500" fill="currentColor" /> Wishlist Saya
                  </h2>
                </div>
                {wishlist.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center transition-colors">
                    <Heart size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">Belum ada wishlist. Ayo cari produk favoritmu!</p>
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="text-blue-500" /> Koleksi Produk Anda
                  </h2>
                  <button onClick={() => navigate('/create-product')} className="btn-primary px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-sm">
                    <Plus size={16} /> Tambah Baru
                  </button>
                </div>
                {myProducts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-12 text-center transition-colors">
                    <Package size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Anda belum memiliki produk.</p>
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
                        className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-300 dark:hover:border-emerald-500 transition-colors group">
                        <img src={p.image} className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate">{p.name}</h4>
                          <p className="text-green-600 dark:text-emerald-400 font-bold">{formatPrice(p.price)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Stok: {p.stock} · Terjual: {p.sold}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-product/${p.id}`); }} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-emerald-400 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
                            <Edit size={18} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }} className="p-2 bg-gray-50 dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="text-green-600" /> Analisis Performa
                </h2>
                
                {stats ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-5 border border-gray-200 dark:border-gray-700 border-l-4 border-l-green-600 dark:border-l-emerald-500 transition-colors">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Total Pendapatan</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue)}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-5 border border-gray-200 dark:border-gray-700 border-l-4 border-l-blue-500 transition-colors">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Produk Terjual</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{stats.totalSold} Item</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-5 border border-gray-200 dark:border-gray-700 border-l-4 border-l-orange-500 transition-colors">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Pesanan Aktif</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{stats.activeOrders}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-5 border border-gray-200 dark:border-gray-700 border-l-4 border-l-cyan-500 transition-colors">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Total Produk</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{stats.totalProducts}</p>
                      </div>
                    </div>

                     <div className="bg-white dark:bg-gray-900 shadow-sm rounded-3xl p-6 sm:p-8 mt-6 border border-gray-200 dark:border-gray-700 transition-colors">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-6">Produk Terlaris Anda</h3>
                      <div className="space-y-4">
                        {stats.bestSellers.map((item, i) => (
                          <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500 dark:text-gray-400">{i+1}</span>
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{item.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-gray-900 dark:text-white">{item.sold} kali</p>
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Stok sisa: {item.stock}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white dark:bg-gray-900 shadow-sm rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-700 text-gray-500 font-bold animate-pulse transition-colors">
                    Memuat statistik...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 transition-all" onClick={() => setProductToDelete(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4 transition-colors">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Produk?</h3>
              <p className="text-gray-500 text-sm mb-6 font-medium">
                Apakah Anda yakin ingin menghapus <strong>{productToDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors">
                  Batal
                </button>
                <button 
                  onClick={handleDeleteProduct}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">
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
