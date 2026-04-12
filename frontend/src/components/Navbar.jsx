import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, PlusSquare, LogOut, User, MessageCircle, Home, Menu, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWallet } from '../context/WalletContext';
import { formatPrice } from '../utils/format';
import logo from '../assets/logo.png';

export default function Navbar({ onCartOpen }) {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { walletAddress } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!user || document.visibilityState === 'hidden') return;
    try {
      const { data } = await api.get('/chat/unread');
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    document.addEventListener('visibilitychange', fetchUnread);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', fetchUnread);
    };
  }, [fetchUnread]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/home" className="flex items-center gap-2">
            <img src={logo} alt="KaryaNusa Logo" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block tracking-tight">KaryaNusa</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            
            <button onClick={onCartOpen}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart size={20} className="text-gray-600 dark:text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <Link to="/home" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title="Beranda">
                <Home size={20} />
              </Link>
              <Link to="/feed" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title="Linimasa">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              </Link>
              <Link to="/chat" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title="Pesan">
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <div 
                className="relative flex items-center pl-4 border-l border-gray-200 dark:border-gray-700 ml-2"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer py-2">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user?.full_name || 'Member'}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight max-w-[120px] truncate">{user?.email}</span>
                  </div>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                  ) : (
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <User size={18} className="text-green-600 dark:text-emerald-400" />
                    </div>
                  )}
                </div>

                <div className={`absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl transition-all duration-200 overflow-hidden z-50 ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                   <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Saldo Marketplace</p>
                     <p className="text-sm font-black text-green-600 dark:text-emerald-400">
                       {formatPrice(user?.balance || 0)}
                     </p>
                     <div className="flex items-center gap-1.5 mt-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${user?.wallet_address ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                       <p className="text-[9px] font-bold text-gray-400 uppercase truncate">
                         {user?.wallet_address ? `Linked: ${user.wallet_address.slice(0,6)}...${user.wallet_address.slice(-4)}` : 'Wallet not linked'}
                       </p>
                     </div>
                   </div>
                   <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                     <User size={16} /> <span className="text-sm font-semibold">Pengaturan Akun</span>
                   </Link>
                   <Link to={`/shop/${user?.username || user?.id}`} onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                     <Home size={16} /> <span className="text-sm font-semibold">Lihat Profile Saya</span>
                   </Link>
                   <Link to="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                     <Package size={16} /> <span className="text-sm font-semibold">Pesanan Saya</span>
                   </Link>
                   <Link to="/create-product" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors">
                     <PlusSquare size={16} /> <span className="text-sm font-semibold">Tambah Produk</span>
                   </Link>
                   <div className="border-t border-gray-200 dark:border-gray-800"></div>
                   <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-500 transition-colors text-left">
                     <LogOut size={16} /> <span className="text-sm font-semibold">Keluar</span>
                   </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </nav>

      <div className={`sm:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'} overflow-hidden border-t border-gray-200 dark:border-gray-800 pb-safe`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center p-3">
             <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="p-4 space-y-2">
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors">
               <User size={20} className="text-gray-600 dark:text-gray-400" />
               <span className="font-bold text-gray-900 dark:text-white">Pengaturan Akun</span>
            </Link>
            <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors">
               <Package size={20} className="text-gray-600 dark:text-gray-400" />
               <span className="font-bold text-gray-900 dark:text-white">Pesanan Saya</span>
            </Link>
            <Link to={`/shop/${user?.username || user?.id}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors">
               <Home size={20} className="text-gray-600 dark:text-gray-400" />
               <span className="font-bold text-gray-900 dark:text-white">Profil Publik (Toko)</span>
            </Link>
            <div className="border-t border-gray-100 dark:border-gray-800 my-2"></div>
            <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors text-left">
               <LogOut size={20} className="text-red-500" />
               <span className="font-bold text-red-500">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-1 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <div className="grid grid-cols-5 items-center h-16">
          <Link to="/home" className="relative flex flex-col items-center justify-center w-full h-full">
            <div className={`flex items-center justify-center transition-all duration-300 z-10 ${isActive('/home') ? '-translate-y-4 w-11 h-11 bg-green-600 dark:bg-green-500 text-white rounded-full shadow-lg border-4 border-white dark:border-gray-900' : 'translate-y-1 w-10 h-10 text-gray-500 dark:text-gray-400 bg-transparent'}`}>
              <Home size={20} fill={isActive('/home') ? 'currentColor' : 'none'} />
            </div>
            <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400 transition-all duration-300 ${isActive('/home') ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'}`}>Home</span>
          </Link>

          <Link to="/feed" className="relative flex flex-col items-center justify-center w-full h-full">
            <div className={`flex items-center justify-center transition-all duration-300 z-10 ${isActive('/feed') ? '-translate-y-4 w-11 h-11 bg-green-600 dark:bg-green-500 text-white rounded-full shadow-lg border-4 border-white dark:border-gray-900' : 'translate-y-1 w-10 h-10 text-gray-500 dark:text-gray-400 bg-transparent'}`}>
              <svg className="w-5 h-5" fill={isActive('/feed') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            </div>
            <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400 transition-all duration-300 ${isActive('/feed') ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'}`}>Feed</span>
          </Link>

          <Link to="/create-product" className="relative flex flex-col items-center justify-center w-full h-full">
            <div className={`flex items-center justify-center transition-all duration-300 z-10 ${isActive('/create-product') ? '-translate-y-4 w-11 h-11 bg-green-600 dark:bg-green-500 text-white rounded-full shadow-lg border-4 border-white dark:border-gray-900' : 'translate-y-1 w-10 h-10 text-gray-500 dark:text-gray-400 bg-transparent'}`}>
              <PlusSquare size={20} fill={isActive('/create-product') ? 'currentColor' : 'none'} />
            </div>
            <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400 transition-all duration-300 ${isActive('/create-product') ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'}`}>Jual</span>
          </Link>

          <Link to="/chat" className="relative flex flex-col items-center justify-center w-full h-full">
            <div className={`relative flex items-center justify-center transition-all duration-300 z-10 ${isActive('/chat') ? '-translate-y-4 w-11 h-11 bg-green-600 dark:bg-green-500 text-white rounded-full shadow-lg border-4 border-white dark:border-gray-900' : 'translate-y-1 w-10 h-10 text-gray-500 dark:text-gray-400 bg-transparent'}`}>
              <MessageCircle size={20} fill={isActive('/chat') ? 'currentColor' : 'none'} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold border border-white dark:border-gray-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400 transition-all duration-300 ${isActive('/chat') ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'}`}>Chat</span>
          </Link>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="relative flex flex-col items-center justify-center w-full h-full">
            <div className={`flex items-center justify-center transition-all duration-300 z-10 ${isMobileMenuOpen ? '-translate-y-4 w-11 h-11 bg-green-600 dark:bg-green-500 text-white rounded-full shadow-lg border-4 border-white dark:border-gray-900' : 'translate-y-1 w-10 h-10 text-gray-500 dark:text-gray-400 bg-transparent'}`}>
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
            <span className={`absolute bottom-1 text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400 transition-all duration-300 ${isMobileMenuOpen ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'}`}>Menu</span>
          </button>
        </div>
      </div>
    </>
  );
}
