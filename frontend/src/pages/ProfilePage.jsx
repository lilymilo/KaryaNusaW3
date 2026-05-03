import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  User, Store, Settings, Heart, Package, 
  TrendingUp, Home, Camera, Check, Save, 
  Trash2, Edit, Plus, ExternalLink, ShoppingBag, ArrowLeft,
  Wallet, Landmark, History, Link, RefreshCw, AlertTriangle, Eye, EyeOff, Send, Users
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet, WALLET_TYPES } from '../context/WalletContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ThemeToggle from '../components/ThemeToggle';
import CartDrawer from '../components/CartDrawer';
import ProductCard from '../components/ProductCard';
import FollowListModal from '../components/FollowListModal';

const ProductModal = lazy(() => import('../components/ProductModal'));

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

import { formatPrice } from '../utils/format';

export default function ProfilePage() {
  const { user, updateUserData, linkWallet } = useAuth();
  const { connectWallet, walletAddress, signMessage, disconnectWallet } = useWallet();
  const validTabs = ['akun', 'toko', 'wishlist', 'produk', 'statistik', 'dompet'];
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return validTabs.includes(tab) ? tab : 'akun';
  });
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.requireSetup) {
      toast.error('Gagal mengakses fitur! Mohon lengkapi Username dan Nama Toko Anda terlebih dahulu.', { duration: 4500 });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    phone_number: user?.phone_number || '',
    shop_name: user?.shop_name || '',
    shop_description: user?.shop_description || '',
    shop_address: user?.shop_address || '',
    shop_contact: user?.shop_contact || ''
  });

  const [files, setFiles] = useState({
    avatar: null,
    shop_logo: null,
    shop_banner: null
  });

  const [previews, setPreviews] = useState({
    avatar: user?.avatar,
    shop_logo: user?.shop_logo_url,
    shop_banner: user?.shop_banner_url
  });

  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('Konfirmasi password tidak cocok');
    }
    
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
    if (!strongPasswordRegex.test(passwordForm.new_password)) {
      return toast.error('Password lemah! Harus minimal 8 karakter, serta wajib mengandung huruf besar, huruf kecil, angka, dan simbol khusus (@$!%*?&._-).', { duration: 5500 });
    }
    setPasswordLoading(true);
    try {
      const { data } = await api.put('/auth/set-password', { newPassword: passwordForm.new_password });
      toast.success(data.message || 'Password berhasil disimpan');
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const pwd = passwordForm.new_password;
  const validations = [
    { label: 'Min. 8 Karakter', valid: pwd.length >= 8 },
    { label: 'Huruf Besar & Kecil', valid: /(?=.*[a-z])(?=.*[A-Z])/.test(pwd) },
    { label: 'Ada Angka', valid: /\d/.test(pwd) },
    { label: 'Ada Simbol (@$!._-)', valid: /[@$!%*?&._-]/.test(pwd) }
  ];

  const [wishlist, setWishlist] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0 });
  const [modalType, setModalType] = useState(null);
  const [incomingOrders, setIncomingOrders] = useState([]);

  useEffect(() => {
    if (activeTab === 'wishlist') fetchWishlist();
    if (activeTab === 'produk') fetchMyProducts();
    if (activeTab === 'statistik') { fetchStats(); fetchIncomingOrders(); }
    if (activeTab === 'dompet') fetchPayouts();
  }, [activeTab, user?.id]);

  // Social stats only need to be fetched once on mount, not every tab change
  useEffect(() => {
    if (user?.id) fetchSocialStats();
  }, [user?.id]);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/wishlist');
      setWishlist(data);
    } catch (err) { console.error(err); }
  };

  const fetchMyProducts = async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/shop/${user.id}`);
      setMyProducts(data.products || []);
    } catch (err) { console.error(err); }
  };

  const handleWishlistToggle = (productId, isActive) => {
    fetchWishlist();
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/stats/seller');
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const fetchPayouts = async () => {
    try {
      const { data } = await api.get('/orders/payout/history');
      setPayouts(data);
    } catch (err) { console.error(err); }
  };

  const fetchIncomingOrders = async () => {
    try {
      const { data } = await api.get('/orders/incoming');
      setIncomingOrders(data || []);
    } catch (err) { console.error(err); }
  };


  const fetchSocialStats = async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/social/stats/${user.id}`);
      setSocialStats(data);
    } catch (err) { console.error(err); }
  };

  const handleLinkWallet = async (type) => {
    setLinkLoading(true);
    try {
      const { address, chain } = await connectWallet(type);
      const message = `KaryaNusa: Hubungkan wallet ke akun Anda (${user.id})`;
      const signature = await signMessage(message, type);
      
      const res = await linkWallet(address, signature, message, chain);
      toast.success(res.message || 'Wallet berhasil dihubungkan!');
    } catch (err) {
      toast.error(err.message || 'Gagal menghubungkan wallet');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!user.wallet_address) return toast.error('Hubungkan wallet terlebih dahulu');
    
    const amount = Number(e.target.amount.value);
    if (!amount || amount < 10000) return toast.error('Minimal penarikan Rp 10.000');
    if (amount > user.balance) return toast.error('Saldo tidak mencukupi');

    setPayoutLoading(true);
    try {
      const { data } = await api.post('/orders/payout', {
        amount,
        wallet_address: user.wallet_address,
        chain: 'evm'
      });
      toast.success(data.message || 'Permintaan penarikan berhasil dikirim!');
      updateUserData({ ...user, balance: user.balance - amount });
      fetchPayouts();
      e.target.reset();
    } catch (err) {
      console.error('Withdrawal error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Gagal memproses penarikan';
      toast.error(errorMessage);
    } finally {
      setPayoutLoading(false);
    }
  };
  const handleTransfer = async (e) => {
    e.preventDefault();
    const recipient = e.target.recipient.value.trim();
    const amount = Number(e.target.amount.value);
    
    if (!recipient) return toast.error('Username tujuan wajib diisi');
    if (amount < 1000) return toast.error('Minimal transfer Rp 1.000');
    if (amount > (user?.balance || 0)) return toast.error('Saldo tidak mencukupi');

    setTransferLoading(true);
    try {
      const { data } = await api.post('/orders/transfer', { recipientUsername: recipient, amount });
      toast.success(data.message);
      updateUserData({ ...user, balance: user.balance - amount });
      fetchPayouts(); // Refresh history
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim saldo');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success('Produk berhasil dihapus');
      setMyProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus produk');
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke old blob URL to prevent memory leak
      const oldUrl = previews[field];
      if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
      setFiles(prev => ({ ...prev, [field]: file }));
      setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pt-14 bg-gradient-to-b from-green-50 to-gray-50 dark:from-green-900/10 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-3 py-3">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {previews.avatar ? (
                <img src={previews.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1.5 bg-green-600 rounded-full text-white cursor-pointer hover:bg-green-700 transition-colors shadow-lg border-2 border-white dark:border-gray-800">
              <Camera size={14} />
              <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
            </label>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{user?.full_name}</h1>
            <p className="text-gray-500 text-xs font-medium mb-1.5">@{user?.username || 'user'}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 text-sm">
              <button onClick={() => setModalType('followers')} className="flex items-center gap-1 hover:text-green-600 transition-colors">
                <span className="font-bold text-gray-900 dark:text-white">{socialStats.followers}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Pengikut</span>
              </button>
              <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              <button onClick={() => setModalType('following')} className="flex items-center gap-1 hover:text-green-600 transition-colors">
                <span className="font-bold text-gray-900 dark:text-white">{socialStats.following}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Mengikuti</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-6">
        <div className="flex flex-col lg:flex-row gap-4 pt-3">
          <div className="w-full lg:w-48 flex-shrink-0 z-20 lg:sticky lg:top-[60px] lg:self-start">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-1.5 flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-x-visible scrollbar-hide border border-gray-200 dark:border-gray-700 shadow-sm transition-colors scroll-smooth snap-x snap-mandatory">
              <button 
                onClick={() => setActiveTab('akun')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'akun' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <User size={18} /> <span className="whitespace-nowrap">Akun</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('toko')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'toko' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Home size={18} /> <span className="whitespace-nowrap">Toko</span>
              </button>

              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'wishlist' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Heart size={18} /> <span className="whitespace-nowrap">Wishlist</span>
              </button>

              <button 
                onClick={() => setActiveTab('produk')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'produk' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Package size={18} /> <span className="whitespace-nowrap">Produk</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('statistik')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'statistik' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <TrendingUp size={18} /> <span className="whitespace-nowrap">Statistik</span>
              </button>

              <button 
                onClick={() => setActiveTab('dompet')}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dompet' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <Wallet size={18} /> <span className="whitespace-nowrap">Saldo & Dompet</span>
              </button>

              <div className="w-px lg:w-full h-8 lg:h-px bg-gray-200 dark:bg-gray-700 my-1 lg:my-2 mx-2 lg:mx-0 shrinks-0"></div>

              <button 
                onClick={() => navigate(`/shop/${user?.username || user?.id}`)}
                className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`}>
                <ExternalLink size={18} /> <span className="whitespace-nowrap">Lihat Profil</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            
            {(!user?.username || !user?.shop_name) && (
              <div className="mb-6 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-4 sm:p-5 flex items-start gap-4 animate-in fade-in zoom-in duration-500 shadow-sm">
                <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-xl text-orange-600 dark:text-orange-400 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-1 text-sm sm:text-base">Akun Anda Belum Sepenuhnya Lengkap!</h3>
                  <p className="text-orange-700 dark:text-orange-400/80 text-xs sm:text-sm font-medium leading-relaxed">
                    Demi keamanan dan kenyamanan transaksi, mohon lengkapi <span className="font-bold underline">Username</span> pada tab <span className="font-bold">Data Pribadi</span> dan <span className="font-bold underline">Nama Toko</span> pada tab <span className="font-bold">Pengaturan Toko</span> sekarang juga.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'akun' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Data Pribadi */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User size={18} className="text-green-600" /> Data Pribadi
                  </h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Nama Lengkap</label>
                        <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Username</label>
                        <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                          className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Email</label>
                        <input type="email" value={user?.email} disabled
                          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Nomor HP</label>
                        <input type="text" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})}
                          className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm">
                      {loading ? 'Menyimpan...' : <><Save size={16} /> Simpan Perubahan</>}
                    </button>
                  </form>
                </div>

                {/* Password — collapsible */}
                <details className="group bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                  <summary className="p-5 sm:p-6 font-bold text-gray-900 dark:text-white flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden outline-none select-none">
                    <span className="flex items-center gap-2 text-base">
                      <User size={18} className="text-green-600" /> Pengaturan Password
                    </span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">Atur password untuk login manual dengan Wallet / Username tanpa MetaMask. Min. 8 karakter, kombinasi huruf besar-kecil, angka & simbol.</p>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Password Baru</label>
                          <div className="relative">
                            <input type={showPass ? "text" : "password"} value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} placeholder="Kombinasi Karakter Kuat"
                              className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 pr-11 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Konfirmasi Password</label>
                          <div className="relative">
                            <input type={showConf ? "text" : "password"} value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} placeholder="Ketik ulang password"
                              className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 pr-11 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                            <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {passwordForm.new_password && (
                        <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                          {validations.map((v, i) => (
                            <div key={i} className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-colors ${v.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                              {v.valid ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 ml-1 mr-1" />}
                              {v.label}
                            </div>
                          ))}
                        </div>
                      )}

                      <button type="submit" disabled={passwordLoading} className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm">
                        {passwordLoading ? 'Menyimpan...' : <><Check size={16} /> Simpan Password</>}
                      </button>
                    </form>
                  </div>
                </details>

                {/* Preferensi Tampilan — inline compact */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Settings size={18} className="text-green-600 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Mode Tampilan</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Terang / Gelap</p>
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'toko' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 transition-colors">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Home size={18} className="text-green-600" /> Pengaturan Toko
                  </h2>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-3">
                      <div className="relative h-28 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 group transition-colors">
                        {previews.shop_banner ? (
                          <img src={previews.shop_banner} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-green-100 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 flex items-center justify-center">
                            <Camera size={32} className="text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium">
                          <Camera className="mr-2" /> Ganti Banner Toko
                          <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'shop_banner')} accept="image/*" />
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-3 border-white dark:border-gray-800 shadow-md flex-shrink-0 group">
                          {previews.avatar ? (
                            <img src={previews.avatar} className="w-full h-full object-cover bg-white dark:bg-gray-800" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <User size={32} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-black/10 transition-colors pointer-events-none">
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Nama Toko</label>
                            <input type="text" value={formData.shop_name} onChange={e => setFormData({...formData, shop_name: e.target.value})}
                              className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Deskripsi Toko</label>
                            <textarea rows={2} value={formData.shop_description} onChange={e => setFormData({...formData, shop_description: e.target.value})}
                              className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none font-medium" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Link Website / Portofolio</label>
                          <input type="text" placeholder="https://..." value={formData.shop_address} onChange={e => setFormData({...formData, shop_address: e.target.value})}
                            className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Kontak (WA/Email Toko)</label>
                          <input type="text" value={formData.shop_contact} onChange={e => setFormData({...formData, shop_contact: e.target.value})}
                            className="w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary px-6 py-2 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.02] shadow-sm">
                       Simpan Pengaturan Toko
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Heart size={18} className="text-red-500" fill="currentColor" /> Wishlist Saya
                  </h2>
                </div>
                {wishlist.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center transition-colors">
                    <Heart size={36} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-3">Belum ada wishlist.</p>
                  </div>
                ) : (
                <div className="space-y-2">
                  {wishlist.filter(item => (item.products || item.product)).map(item => {
                    const p = item.products || item.product;
                    return (
                      <div key={item.id} 
                        onClick={() => navigate(`/home`)}
                        className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-2.5 flex items-center gap-3 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-300 dark:hover:border-emerald-500 transition-all group">
                        <img src={p.image} className="w-12 h-12 rounded-lg object-cover border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-base">{p.name}</h4>
                          <p className="text-green-600 dark:text-emerald-400 font-bold text-sm">{formatPrice(p.price)}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">🛒 {p.profiles?.shop_name || p.profiles?.full_name || 'Penjual'}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={async (e) => { 
                               e.stopPropagation(); 
                               try {
                                 await api.post('/wishlist/toggle', { productId: p.id });
                                 fetchWishlist();
                                 toast.success('Dihapus dari wishlist');
                               } catch (err) {
                                 toast.error('Gagal menghapus');
                               }
                             }} 
                             className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                           >
                             <Heart size={20} fill="currentColor" />
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}

            {activeTab === 'produk' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package size={18} className="text-blue-500" /> Koleksi Produk
                  </h2>
                  <button onClick={() => navigate('/create-product')} className="btn-primary px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Plus size={16} /> Tambah Baru
                  </button>
                </div>
                {myProducts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center transition-colors">
                    <Package size={36} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Belum ada produk.</p>
                  </div>
                ) : (
                <div className="space-y-2">
                  {selected && (
                    <Suspense fallback={null}>
                      <ProductModal 
                        product={selected} 
                        onClose={() => setSelected(null)} 
                        initialWishlisted={wishlist.some(w => w.product_id === selected.id)}
                        onWishlistToggle={handleWishlistToggle}
                      />
                    </Suspense>
                  )}
                  {myProducts.map(p => (
                    <div key={p.id} 
                      onClick={() => setSelected(p)}
                      className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-2.5 flex items-center gap-3 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-300 dark:hover:border-emerald-500 transition-all group">
                      <img src={p.image} className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-1">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm sm:text-lg">{p.name}</h4>
                          <span className="hidden sm:inline px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-500 uppercase tracking-wider">{p.is_nft ? 'NFT' : 'Physical'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-green-600 dark:text-emerald-400 font-bold text-sm sm:text-base">{formatPrice(p.price)}</p>
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                            <span>📈 Terjual: <b>{p.sold || 0}</b></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setActiveTab('statistik'); }} className="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 rounded-xl transition-all shadow-sm" title="Lihat Statistik">
                          <TrendingUp size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-product/${p.id}`); }} className="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-emerald-400 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-200 dark:border-gray-700 rounded-xl transition-all shadow-sm">
                          <Edit size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }} className="p-2 sm:p-2.5 bg-gray-50 dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-gray-700 rounded-xl transition-all shadow-sm">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {activeTab === 'statistik' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-600" /> Analisis Performa
                </h2>
                
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-3 border border-gray-200 dark:border-gray-700 border-l-4 border-l-green-600 dark:border-l-emerald-500 transition-colors">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Total Pendapatan</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue)}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-3 border border-gray-200 dark:border-gray-700 border-l-4 border-l-blue-500 transition-colors">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Produk Terjual</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{stats.totalSold} Item</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-3 border border-gray-200 dark:border-gray-700 border-l-4 border-l-orange-500 transition-colors">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Pesanan Aktif</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{stats.activeOrders}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-xl p-3 border border-gray-200 dark:border-gray-700 border-l-4 border-l-cyan-500 transition-colors">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-0.5">Total Produk</p>
                        <p className="text-base font-black text-gray-900 dark:text-white">{stats.totalProducts}</p>
                      </div>
                    </div>

                     <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4 sm:p-5 mt-4 border border-gray-200 dark:border-gray-700 transition-colors">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Produk Terlaris</h3>
                      <div className="space-y-2">
                        {stats.bestSellers.map((item, i) => (
                          <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500 dark:text-gray-400">{i+1}</span>
                              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{item.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-gray-900 dark:text-white">{item.sold} kali</p>
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Total terjual: {item.sold || 0}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 text-gray-500 text-sm font-bold animate-pulse transition-colors">
                    Memuat statistik...
                  </div>
                )}

                {/* Daftar Pembeli */}
                <details className="group bg-white dark:bg-gray-900 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors">
                  <summary className="p-4 sm:p-5 font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden outline-none">
                    <span className="flex items-center gap-2"><Users size={18} className="text-green-600 dark:text-emerald-400" /> Riwayat Pembeli</span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 dark:border-gray-800 pt-3">
                  {incomingOrders.length === 0 ? (
                    <div className="text-center py-10">
                      <Users size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Belum ada penjualan.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {incomingOrders.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                          {/* Avatar pembeli */}
                          {item.buyer?.avatar ? (
                            <img src={item.buyer.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                              <User size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {item.buyer?.full_name || 'Pembeli'} <span className="font-normal text-gray-500 dark:text-gray-400">@{item.buyer?.username || '-'}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {item.product?.name || 'Produk'} · <span className="font-semibold">×{item.quantity}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-green-600 dark:text-emerald-400">{formatPrice(item.price * item.quantity)}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(item.order?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.order?.status === 'processing' || item.order?.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-emerald-400' :
                              item.order?.status === 'pending' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                              'bg-gray-100 text-gray-500'
                            }`}>{item.order?.status || '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </details>
              </div>
            )}

            {activeTab === 'dompet' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-green-100 text-xs font-bold mb-1 uppercase tracking-wider">Saldo Tersedia</p>
                      <h3 className="text-2xl font-black mb-1">{formatPrice(user?.balance || 0)}</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2">
                           <p className="text-[10px] font-bold text-green-50 uppercase">Status Dompet</p>
                           {user?.wallet_address ? (
                              <Check size={14} className="text-green-300" />
                            ) : (
                              <RefreshCw size={12} className="animate-spin text-green-200" />
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {!user?.wallet_address && (
                        <button onClick={() => { 
                          const el = document.getElementById('link-wallet-section');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }} className="bg-white text-green-700 px-4 py-2 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center gap-2">
                          <Link size={16} /> Hubungkan Wallet
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-400/20 rounded-full blur-2xl"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                    <form onSubmit={handleTransfer}>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Send size={16} className="text-blue-500" /> Kirim Saldo
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Username Penerima</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 font-bold">@</span>
                            <input 
                              type="text" 
                              name="recipient"
                              placeholder="username_tujuan"
                              className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 font-bold" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nominal (IDR)</label>
                          <input 
                            type="number" 
                            name="amount"
                            placeholder="Min. Rp 1.000"
                            min={1000}
                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 font-bold" />
                        </div>
                        <button 
                          disabled={transferLoading || (user?.balance || 0) < 1000}
                          className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                          {transferLoading ? <><RefreshCw size={16} className="animate-spin" /> Memproses...</> : <><Send size={16} /> Kirim Sekarang</>}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div id="link-wallet-section" className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors md:col-span-2 lg:col-span-1">
                    {!user?.wallet_address ? (
                      <div className="text-center h-full flex flex-col justify-center">
                        <Link size={40} className="mx-auto text-gray-300 mb-4" />
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hubungkan Wallet</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Anda perlu menghubungkan wallet untuk menarik saldo penghasilan.</p>
                        <div className="space-y-3">
                          <button 
                            disabled={linkLoading}
                            onClick={() => handleLinkWallet(WALLET_TYPES.METAMASK)}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-bold text-gray-700 dark:text-gray-200">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="" className="w-6 h-6" />
                            MetaMask
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleWithdraw}>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Landmark size={16} className="text-green-600" /> Tarik Saldo
                        </h4>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alamat Tujuan</label>
                            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 font-mono text-xs break-all text-gray-600 dark:text-gray-400 font-bold">
                              {user.wallet_address}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nominal Penarikan (IDR)</label>
                            <input 
                              type="number" 
                              name="amount"
                              placeholder="Min. Rp 10.000"
                              min={10000}
                              max={user.balance}
                              className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-green-500 font-bold" />
                          </div>
                          <button 
                            disabled={payoutLoading || (user?.balance || 0) < 10000}
                            className="btn-primary w-full py-2 rounded-xl text-white text-sm font-bold shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all">
                            {payoutLoading ? 'Memproses...' : 'Tarik Sekarang'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                <details className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                  <summary className="p-4 sm:p-5 font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden outline-none">
                    <span className="flex items-center gap-2"><History size={20} className="text-green-600" /> Riwayat Pencairan</span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 dark:border-gray-800 pt-3">
                  {payouts.length === 0 ? (
                    <div className="text-center py-12">
                      <History size={48} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada riwayat penarikan.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                            <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest">Tanggal</th>
                            <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest text-right">Jumlah</th>
                            <th className="pb-4 font-bold text-xs text-gray-400 uppercase tracking-widest text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {payouts.map((p) => (
                            <tr key={p.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="py-4">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <p className="text-[10px] font-mono text-gray-500 truncate w-32">{p.tx_hash || 'TX pending'}</p>
                              </td>
                              <td className="py-4 text-right">
                                <p className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(p.amount)}</p>
                              </td>
                              <td className="py-4 text-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  p.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-emerald-400' :
                                  p.status === 'pending' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  </div>
                </details>
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
      <FollowListModal 
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        userId={user?.id}
        type={modalType}
        title={modalType === 'followers' ? 'Pengikut' : 'Mengikuti'}
      />
    </div>
  );
}
