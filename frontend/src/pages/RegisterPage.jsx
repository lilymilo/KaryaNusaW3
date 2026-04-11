import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Store, Phone, Eye, EyeOff, ArrowLeft, MailCheck } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('buyer'); 
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [show, setShow] = useState({ pass: false, conf: false });

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    shop_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Konfirmasi password tidak cocok');
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter');
    
    // Validate Phone
    const validatedPhone = validateWA(form.phone_number);
    if (!validatedPhone) {
      return toast.error('Nomor WhatsApp tidak valid (Gunakan format 08xx atau +628xx)');
    }

    setLoading(true);
    try {
      const res = await register({ ...form, phone_number: validatedPhone, role });
      if (res.needsConfirmation) {
        setIsSuccess(true);
      } else {
        toast.success('Registrasi berhasil!');
        navigate('/home');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4">
        <div className="glass max-w-md w-full p-10 rounded-[2.5rem] text-center border border-[var(--border-color)] shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <MailCheck className="w-12 h-12 text-purple-500 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4">Cek Email Anda!</h2>
          <p className="text-[var(--text-secondary)] mb-10 leading-relaxed font-medium">
            Kami telah mengirimkan tautan verifikasi ke <br/>
            <span className="text-purple-500 font-bold">{form.email}</span>. <br/>
            Klik link tersebut untuk mengaktifkan akun Anda.
          </p>
          
          <div className="space-y-4">
            <a 
              href={`https://mail.google.com/mail/u/0/#search/from%3Anoreply%40supabase.io+OR+KaryaNusa`}
              target="_blank" rel="noreferrer"
              className="w-full btn-primary py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              Buka Kotak Masuk
            </a>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-4 text-[var(--text-secondary)] font-bold hover:text-[var(--text-primary)] transition-colors"
            >
              Lanjut ke Halaman Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300 flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-[var(--text-secondary)] hover:text-purple-500 transition-colors font-medium">
        <ArrowLeft size={20} />
        <span className="hidden sm:inline">Kembali</span>
      </Link>

      <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-2xl sm:blur-3xl pointer-events-none transition-colors" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-600/10 dark:bg-cyan-600/15 rounded-full blur-2xl sm:blur-3xl pointer-events-none transition-colors" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src={logo} alt="KaryaNusa Logo" className="w-12 h-12 rounded-2xl object-contain shadow-lg" />
            <span className="text-2xl font-bold gradient-text">KaryaNusa</span>
          </Link>
          <h1 className="text-3xl font-black text-[var(--text-primary)]">Daftar Akun</h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">Isi data akun Anda di bawah ini</p>
        </div>

        <div className="glass rounded-[2rem] p-8 border border-[var(--border-color)] shadow-2xl">
          
          <div className="mb-6">
            <div className="flex bg-[var(--card-bg)] rounded-xl p-1 border border-[var(--border-color)]">
              <button
                onClick={() => setRole('buyer')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  role === 'buyer' ? 'bg-purple-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <User size={16} /> Pembeli
              </button>
              <button
                onClick={() => setRole('seller')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  role === 'seller' ? 'bg-purple-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Store size={16} /> Penjual
              </button>
            </div>
          </div>

          {/* Email Form First */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'seller' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">NAMA TOKO</label>
                <div className="relative">
                  <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" />
                  <input type="text" placeholder="Contoh: Toko Berkah" required
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-all text-sm font-medium"
                    value={form.shop_name} onChange={e => setForm({...form, shop_name: e.target.value})} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">NAMA LENGKAP</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" />
                <input type="text" placeholder="Nama Lengkap" required
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-all text-sm font-medium"
                  value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">USERNAME</label>
                <input type="text" placeholder="user123" required
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-all text-sm font-medium"
                  value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">WHATSAPP</label>
                <input type="tel" placeholder="08..." required
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-all text-sm font-medium"
                  value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">EMAIL</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" />
                <input type="email" placeholder="example@mail.com" required
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-all text-sm font-medium"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">PASSWORD</label>
                <div className="relative">
                  <input type={show.pass ? 'text' : 'password'} placeholder="******" required
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-all text-sm font-medium"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button type="button" onClick={() => setShow({...show, pass: !show.pass})} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                    {show.pass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">KONFIRMASI</label>
                <div className="relative">
                  <input type={show.conf ? 'text' : 'password'} placeholder="******" required
                    className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-all text-sm font-medium"
                    value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
                  <button type="button" onClick={() => setShow({...show, conf: !show.conf})} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                    {show.conf ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-4 rounded-xl text-white font-bold text-sm shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? 'Sedang Memproses...' : 'Daftar Akun'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-color)] opacity-20"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)]"><span className="px-3 bg-transparent backdrop-blur-md font-black">Atau via Google</span></div>
          </div>

          <button
            onClick={() => loginWithGoogle(role)}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 py-3.5 rounded-xl text-gray-900 font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Lanjut dengan Google
          </button>

          <p className="text-center text-sm font-medium text-[var(--text-secondary)] mt-8">
            Sudah punya akun? <Link to="/login" className="text-purple-500 font-bold hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
