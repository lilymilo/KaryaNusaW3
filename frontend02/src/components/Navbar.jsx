import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, PlusSquare, LogOut, User, MessageCircle, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ThemeToggle from './ThemeToggle';
import logo from '../assets/logo.png';

export default function Navbar({ onCartOpen }) {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <img src={logo} alt="KaryaNusa Logo" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block tracking-tight">KaryaNusa</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart - Always Visible */}
            <button onClick={onCartOpen}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ShoppingCart size={20} className="text-gray-600 dark:text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Desktop Only Actions */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <Link to="/orders" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title="Pesanan">
                <Package size={20} />
              </Link>

              <Link to="/chat" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title="Pesan">
                <MessageCircle size={20} />
              </Link>

              {user?.role === 'seller' && (
                <Link to="/create-product" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title="Tambah Produk">
                  <PlusSquare size={20} />
                </Link>
              )}

              {/* User Profile - Desktop */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 ml-2">
                <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{user?.full_name || 'Member'}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{user?.email}</span>
                  </div>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                  ) : (
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <User size={18} className="text-green-600 dark:text-emerald-400" />
                    </div>
                  )}
                </Link>
                <button onClick={handleLogout} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-1" title="Keluar">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
            
            {/* Mobile Logout */}
            <button onClick={handleLogout} className="sm:hidden p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-1" title="Keluar">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <div className={`grid ${user?.role === 'seller' ? 'grid-cols-5' : 'grid-cols-4'} items-center h-16`}>
          <Link to="/home" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/home') ? 'text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <Home size={22} fill={isActive('/home') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </Link>

          <Link to="/chat" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/chat') ? 'text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <MessageCircle size={22} fill={isActive('/chat') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
          </Link>

          {user?.role === 'seller' && (
            <Link to="/create-product" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/create-product') ? 'text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <div className="bg-green-600 dark:bg-green-500 text-white p-2.5 rounded-xl -mt-9 shadow-lg border-4 border-white dark:border-gray-900 flex items-center justify-center">
                <PlusSquare size={22} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Jual</span>
            </Link>
          )}

          <Link to="/orders" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/orders') ? 'text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <Package size={22} fill={isActive('/orders') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pesanan</span>
          </Link>

          <Link to="/profile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-green-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
            <User size={22} fill={isActive('/profile') ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Profil</span>
          </Link>
        </div>
      </div>
    </>
  );
}
