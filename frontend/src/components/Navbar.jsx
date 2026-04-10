import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, PlusSquare, LogOut, User, MessageCircle, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.png';
import ThemeToggle from './ThemeToggle';

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
      <nav className="fixed top-0 w-full z-50 glass border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <img src={logo} alt="KaryaNusa Logo" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-xl font-bold gradient-text hidden sm:block">KaryaNusa</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle - Always Visible */}
            <ThemeToggle />

            {/* Cart - Always Visible */}
            <button onClick={onCartOpen}
              className="relative p-2 glass rounded-xl hover:bg-white/10 transition-colors">
              <ShoppingCart size={20} className="text-[var(--text-secondary)]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 btn-primary rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Desktop Only Actions */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <Link to="/orders" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors" title="Pesanan">
                <Package size={20} className="text-[var(--text-secondary)]" />
              </Link>

              <Link to="/chat" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors" title="Pesan">
                <MessageCircle size={20} className="text-[var(--text-secondary)]" />
              </Link>

              {user?.role === 'seller' && (
                <Link to="/create-product" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors" title="Tambah Produk">
                  <PlusSquare size={20} className="text-[var(--text-secondary)]" />
                </Link>
              )}

              {/* User Profile - Desktop */}
              <div className="flex items-center gap-2 pl-3 border-l border-[var(--border-color)] ml-1">
                <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-bold text-[var(--text-primary)] leading-tight">{user?.full_name || 'Member'}</span>
                    <span className="text-[10px] text-[var(--text-secondary)] opacity-70 leading-tight">{user?.email}</span>
                  </div>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-purple-500/30" />
                  ) : (
                    <div className="w-9 h-9 btn-primary rounded-full flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                  )}
                </Link>
                <button onClick={handleLogout} className="p-1.5 text-red-500/70 hover:text-red-500 transition-colors ml-1" title="Keluar">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
            
            {/* Mobile Logout - Visible only in Top Nav for Mobile */}
            <button onClick={handleLogout} className="sm:hidden p-1.5 text-red-500/70 hover:text-red-500 transition-colors ml-1" title="Keluar">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--border-color)] px-4 pb-safe">
        <div className="flex justify-between items-center h-16">
          <Link to="/home" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/home') ? 'text-purple-500' : 'text-[var(--text-secondary)]'}`}>
            <Home size={22} fill={isActive('/home') ? 'currentColor' : 'none'} className={isActive('/home') ? 'opacity-100' : 'opacity-70'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </Link>

          <Link to="/chat" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/chat') ? 'text-purple-500' : 'text-[var(--text-secondary)]'}`}>
            <MessageCircle size={22} fill={isActive('/chat') ? 'currentColor' : 'none'} className={isActive('/chat') ? 'opacity-100' : 'opacity-70'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
          </Link>

          {user?.role === 'seller' && (
            <Link to="/create-product" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/create-product') ? 'text-purple-500' : 'text-[var(--text-secondary)]'}`}>
              <div className="bg-purple-600 text-white p-2 rounded-xl -mt-8 shadow-lg shadow-purple-500/40 border-2 border-[var(--bg-color)]">
                <PlusSquare size={24} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Jual</span>
            </Link>
          )}

          <Link to="/orders" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/orders') ? 'text-purple-500' : 'text-[var(--text-secondary)]'}`}>
            <Package size={22} fill={isActive('/orders') ? 'currentColor' : 'none'} className={isActive('/orders') ? 'opacity-100' : 'opacity-70'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pesanan</span>
          </Link>

          <Link to="/profile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-purple-500' : 'text-[var(--text-secondary)]'}`}>
            <User size={22} fill={isActive('/profile') ? 'currentColor' : 'none'} className={isActive('/profile') ? 'opacity-100' : 'opacity-70'} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Profil</span>
          </Link>
        </div>
      </div>
    </>
  );
}
