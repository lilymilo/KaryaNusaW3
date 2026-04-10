import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, PlusSquare, LogOut, User, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.png';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ onCartOpen }) {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2">
          <img src={logo} alt="KaryaNusa Logo" className="w-9 h-9 rounded-lg object-contain" />
          <span className="text-xl font-bold gradient-text hidden sm:block">KaryaNusa</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Cart */}
          <button onClick={onCartOpen}
            className="relative p-2 glass rounded-xl hover:bg-white/10 transition-colors">
            <ShoppingCart size={20} className="text-[var(--text-secondary)]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 btn-primary rounded-full text-xs text-white flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Orders */}
          <Link to="/orders" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors hidden sm:block">
            <Package size={20} className="text-[var(--text-secondary)]" />
          </Link>

          {/* Messages */}
          <Link to="/chat" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors hidden sm:block">
            <MessageCircle size={20} className="text-[var(--text-secondary)]" />
          </Link>

          {/* Create Product - Only for Sellers */}
          {user?.role === 'seller' && (
            <Link to="/create-product" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors hidden sm:block">
              <PlusSquare size={20} className="text-[var(--text-secondary)]" />
            </Link>
          )}

          {/* Mobile menu items */}
          <Link to="/orders" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors sm:hidden">
            <Package size={20} className="text-[var(--text-secondary)]" />
          </Link>
          
          <Link to="/chat" className="p-2 glass rounded-xl hover:bg-white/10 transition-colors sm:hidden">
            <MessageCircle size={20} className="text-[var(--text-secondary)]" />
          </Link>

          {/* User */}
          <div className="flex items-center gap-2 pl-3 border-l border-[var(--border-color)]">
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
            <button onClick={handleLogout} className="p-1.5 text-red-500/70 hover:text-red-500 transition-colors ml-1">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>

  );
}

