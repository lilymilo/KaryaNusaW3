import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Store, Phone, Eye, EyeOff, ArrowLeft, MailCheck, Wallet, Loader2, Check } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { useWallet, WALLET_TYPES } from '../context/WalletContext';
import { MetaMaskIcon } from '../components/icons/WalletIcons';
import toast from 'react-hot-toast';

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

export default function RegisterPage() {
  const { register, loginWithGoogle, loginWithWallet } = useAuth();
  const { connectWallet, signMessage } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [show, setShow] = useState({ pass: false, conf: false });
  const [walletLoading, setWalletLoading] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

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
    
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
    if (!strongPasswordRegex.test(form.password)) {
      return toast.error('Password lemah! Harus minimal 8 karakter, serta wajib mengandung huruf besar, huruf kecil, angka, dan simbol (misal: @$!._-).', { duration: 5500 });
    }

    const validatedPhone = validateWA(form.phone_number);
    if (!validatedPhone) {
      return toast.error('Nomor WhatsApp tidak valid (Gunakan format 08xx atau +628xx)');
    }

    setLoading(true);
    try {
      const res = await register({ ...form, phone_number: validatedPhone });
      if (res.needsConfirmation) {
        setIsSuccess(true);
      } else {
        toast.success('Registrasi berhasil!');
        navigate('/profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  const pwd = form.password;
  const validations = [
    { label: 'Min. 8 Karakter', valid: pwd.length >= 8 },
    { label: 'Huruf Besar & Kecil', valid: /(?=.*[a-z])(?=.*[A-Z])/.test(pwd) },
    { label: 'Ada Angka', valid: /\d/.test(pwd) },
    { label: 'Ada Simbol (@$!._-)', valid: /[@$!%*?&._-]/.test(pwd) }
  ];

  const handleWalletRegister = async (type) => {
    setWalletLoading(type);
    try {
      const { address, chain } = await connectWallet(type);

      const timestamp = Date.now();
      const message = `Daftar di KaryaNusa\n\nWallet: ${address}\nTimestamp: ${timestamp}\nNonce: ${Math.random().toString(36).substring(2)}`;

      const signature = await signMessage(message, type);

      const result = await loginWithWallet(address, signature, message, chain);

      if (result.isNewUser) {
        toast.success('Akun wallet berhasil dibuat! 🎉');
      } else {
        toast.success('Wallet sudah terdaftar, berhasil masuk!');
      }
      navigate('/profile');
    } catch (err) {
      const body = err.response?.data;
      const msg = body?.error || err.message || 'Gagal menghubungkan wallet';
      toast.error(body?.hint ? `${msg} (${body.hint})` : msg);
    } finally {
      setWalletLoading(null);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 max-w-md w-full p-10 rounded-[2.5rem] text-center border border-gray-200 dark:border-gray-700 shadow-xl animate-in fade-in zoom-in duration-500 transition-colors">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <MailCheck className="w-12 h-12 text-green-600 animate-bounce" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Cek Email Anda!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed font-medium">
            Kami telah mengirimkan tautan verifikasi ke <br/>
            <span className="text-green-600 dark:text-emerald-400 font-bold">{form.email}</span>. <br/>
            Klik link tersebut untuk mengaktifkan akun Anda.
          </p>

          <div className="space-y-4">
            <a
              href={`https://mail.google.com/mail/u/0/#search/from%3Anoreply%40supabase.io+OR+KaryaNusa`}
              target="_blank" rel="noreferrer"
              className="w-full btn-primary py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              Buka Kotak Masuk
            </a>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Lanjut ke Halaman Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-20 relative overflow-hidden transition-colors duration-300">

      <Link to="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors font-medium">
        <ArrowLeft size={20} />
        <span className="hidden sm:inline">Kembali</span>
      </Link>

      <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-green-600/10 dark:bg-green-600/5 rounded-full blur-2xl sm:blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-2xl sm:blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img src={logo} alt="KaryaNusa Logo" className="w-12 h-12 rounded-2xl object-contain shadow-sm bg-white dark:bg-gray-800 p-1 transition-colors" />
            <span className="text-2xl font-bold text-green-600 dark:text-emerald-400 transition-colors">KaryaNusa</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Daftar Akun</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Isi data akun Anda di bawah ini</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-200 dark:border-gray-700 shadow-xl relative z-10 transition-colors">

          <div className="mb-6">
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">NAMA TOKO</label>
              <div className="relative">
                <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Contoh: Toko Berkah" required
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:border-green-500 outline-none transition-all text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20"
                  value={form.shop_name} onChange={e => setForm({...form, shop_name: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">NAMA LENGKAP</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Nama Lengkap" required
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:border-green-500 outline-none transition-all text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20"
                  value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">USERNAME</label>
                <input type="text" placeholder="user123" required
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-green-500 outline-none transition-all text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20"
                  value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">WHATSAPP</label>
                <input type="tel" placeholder="08..." required
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-green-500 outline-none transition-all text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20"
                  value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">EMAIL</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="example@mail.com" required
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:border-green-500 outline-none transition-all text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">PASSWORD</label>
                <div className="relative">
                  <input type={show.pass ? 'text' : 'password'} placeholder="Min. 8 Karakter Kuat" required
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-green-500 outline-none transition-all text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                  <button type="button" onClick={() => setShow({...show, pass: !show.pass})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {show.pass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">KONFIRMASI</label>
                <div className="relative">
                  <input type={show.conf ? 'text' : 'password'} placeholder="Ketik ulang password" required
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-green-500 outline-none transition-all text-sm font-medium shadow-sm focus:ring-2 focus:ring-green-500/20"
                    value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} />
                  <button type="button" onClick={() => setShow({...show, conf: !show.conf})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {show.conf ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>
            </div>

            {form.password && (
              <div className="grid grid-cols-2 gap-2 mt-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                {validations.map((v, i) => (
                  <div key={i} className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-colors ${v.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                    {v.valid ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 ml-1 mr-1" />}
                    {v.label}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-4 rounded-xl text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? 'Sedang Memproses...' : 'Daftar Akun'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400"><span className="px-3 bg-white dark:bg-gray-900 font-black">Atau via Google</span></div>
          </div>

          <button
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 py-3.5 rounded-xl text-gray-900 dark:text-white font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Lanjut dengan Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-gray-400">
              <span className="px-3 bg-white dark:bg-gray-900 font-black flex items-center gap-1.5">
                <Wallet size={12} /> Atau via Wallet
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {!showWalletModal ? (
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 py-4 px-6 rounded-2xl text-gray-900 dark:text-white font-black transition-all active:scale-[0.98] hover:shadow-md"
              >
                <Wallet size={20} className="text-gray-600 dark:text-gray-300" />
                <span>Pilih Penyedia Wallet</span>
              </button>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Pilih Web3 Wallet</span>
                  <button onClick={() => setShowWalletModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <ArrowLeft size={16} />
                  </button>
                </div>
                <button
                  id="register-metamask-btn"
                  onClick={() => handleWalletRegister(WALLET_TYPES.METAMASK)}
                  disabled={walletLoading !== null}
                  className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/40 dark:hover:to-amber-900/40 border border-orange-200 dark:border-orange-800/50 py-3.5 px-6 rounded-xl text-gray-900 dark:text-white font-black transition-all active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {walletLoading === WALLET_TYPES.METAMASK ? (
                    <Loader2 size={22} className="animate-spin text-orange-500" />
                  ) : (
                    <div className="group-hover:scale-110 transition-transform">
                      <MetaMaskIcon />
                    </div>
                  )}
                  <span className="text-sm">{walletLoading === WALLET_TYPES.METAMASK ? 'Menghubungkan...' : 'Daftar via MetaMask'}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wider font-bold text-orange-500/70 dark:text-orange-400/70">EVM</span>
                </button>

              </div>
            )}
          </div>

          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mt-8">
            Sudah punya akun? <Link to="/login" className="text-green-600 dark:text-emerald-400 font-bold hover:underline transition-colors">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
