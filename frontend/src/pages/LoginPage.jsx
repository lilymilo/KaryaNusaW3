import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, LogIn, User, Store } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('buyer');
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Semua field wajib diisi');
    
    setLoading(true);
    try {
      await login(form.email, form.password, role);
      toast.success('Selamat datang kembali!');
      navigate('/home');
    } catch (err) {

      const msg = err.response?.data?.error || err.response?.data?.message || 'Login gagal';
      if (msg.toLowerCase().includes('email not confirmed')) {
        toast.error('Gagal Masuk: Email belum diverifikasi. Silakan cek inbox email Anda.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-[var(--text-secondary)] hover:text-purple-500 transition-colors font-medium">
        <ArrowLeft size={20} />
        <span className="hidden sm:inline">Kembali</span>
      </Link>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none transition-colors" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 dark:bg-cyan-600/15 rounded-full blur-3xl pointer-events-none transition-colors" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src={logo} alt="KaryaNusa Logo" className="w-12 h-12 rounded-2xl shadow-xl object-contain text-white" />
            <span className="text-3xl font-black gradient-text tracking-tighter">KaryaNusa</span>
          </Link>
          <h1 className="text-4xl font-black text-[var(--text-primary)]">Masuk Akun</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">Masuk ke dashboard Anda</p>
        </div>

        <div className="glass rounded-[2.5rem] p-8 sm:p-10 border border-[var(--border-color)] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Role Selection Toggle */}
          <div className="mb-8 relative z-10">
            <div className="flex bg-[var(--card-bg)] rounded-2xl p-1.5 border border-[var(--border-color)] shadow-inner">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  role === 'buyer' ? 'bg-purple-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <User size={18} /> Pembeli
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  role === 'seller' ? 'bg-purple-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Store size={18} /> Penjual
              </button>
            </div>
          </div>

          {/* Email form first */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" />
                <input
                  type="email" placeholder="nama@email.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl pl-12 pr-4 py-4 text-[var(--text-primary)] font-bold focus:border-purple-500 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" />
                <input
                  type={show ? 'text' : 'password'} placeholder="Masukkan password" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl pl-12 pr-12 py-4 text-[var(--text-primary)] font-bold focus:border-purple-500 outline-none transition-all shadow-inner"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-30 hover:opacity-100 transition-opacity">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-4.5 rounded-2xl text-white font-black text-lg shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              {loading ? 'Memproses...' : (
                <>
                  Masuk Akun <LogIn size={20} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)] opacity-20"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)]"><span className="px-3 bg-transparent backdrop-blur-md font-black">Atau via Google</span></div>
          </div>

          <button
            onClick={() => loginWithGoogle(role)}
            className="w-full flex items-center justify-center gap-4 bg-white hover:bg-slate-50 py-4 px-6 rounded-2xl text-gray-900 font-black transition-all shadow-lg active:scale-[0.98] group"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Lanjut dengan Google
          </button>

          <div className="mt-10 text-center">
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              Belum punya akun?{' '}
              <Link to="/register" className="text-purple-500 hover:text-purple-400 font-bold underline underline-offset-4">Daftar sekarang</Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-[var(--text-secondary)] opacity-30 text-[9px] mt-10 uppercase tracking-[0.3em] font-black">
          Powered by Secure Multi-Auth Shield
        </p>
      </div>
    </div>
  );
}
