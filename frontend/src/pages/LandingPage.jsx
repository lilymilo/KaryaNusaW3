import { Link } from 'react-router-dom';
import { ShoppingBag, Shield, Zap, Globe, ArrowRight, Lock, Truck, HeadphonesIcon, Tag, Star, Users, BadgeCheck, TrendingUp } from 'lucide-react';
import logo from '../assets/logo.png';
import ThemeToggle from '../components/ThemeToggle';

const features = [
  { Icon: Shield, title: 'Transaksi Aman', desc: 'Setiap transaksi dilindungi enkripsi tingkat tinggi dan sistem verifikasi berlapis untuk keamanan penuh.' },
  { Icon: Zap, title: 'Akses Instan', desc: 'Dapatkan produk digital Anda secara instan segera setelah pembayaran berhasil dikonfirmasi.' },
  { Icon: HeadphonesIcon, title: 'Dukungan 24/7', desc: 'Tim customer service kami siap membantu kapan saja melalui chat, email, maupun telepon.' },
  { Icon: Tag, title: 'Harga Terbaik', desc: 'Temukan produk berkualitas dengan harga kompetitif langsung dari kreator terpercaya.' },
];

const highlights = [
  { Icon: Lock, title: 'Akun Terverifikasi', desc: 'Setiap penjual melalui proses verifikasi identitas sebelum bisa berjualan di platform kami.' },
  { Icon: ShoppingBag, title: 'Produk Beragam', desc: 'Dari E-book, Kursus Online, Template Desain, hingga Software — semua tersedia dalam satu tempat.' },
  { Icon: Globe, title: 'Jangkauan Luas', desc: 'Akses koleksi digital Anda dari mana saja dengan tampilan responsif di semua perangkat.' },
  { Icon: Zap, title: 'Checkout Mudah', desc: 'Proses pembelian simpel dan cepat, dari pilih produk hingga konfirmasi pesanan hanya dalam hitungan detik.' },
];

const web3Benefits = [
  { Icon: BadgeCheck, title: 'Teknologi Blockchain', desc: 'Mencatat setiap transaksi secara permanen di buku besar digital (distributed ledger), menjamin keaslian dan mencegah manipulasi data oleh pihak mana pun.' },
  { Icon: Lock, title: 'Kontrak Pintar (Smart Contracts)', desc: 'Keamanan transaksi dijamin oleh kode program otomatis yang memastikan pembayaran hanya dilepaskan jika syarat pengiriman telah terpenuhi secara adil.' },
  { Icon: Users, title: 'Kepemilikan Digital Penuh', desc: 'Di era Web3, Anda memiliki kontrol penuh atas aset dan identitas digital Anda tanpa perlu bergantung sepenuhnya pada otoritas pusat yang terpusat.' },
  { Icon: TrendingUp, title: 'Ekonomi Tanpa Perantara', desc: 'Menghubungkan pembeli dan penjual secara langsung melalui jaringan blockchain, mengurangi biaya admin dan mempercepat proses likuiditas keuangan.' },
  { Icon: Globe, title: 'Transparansi Global', desc: 'Seluruh riwayat transaksi dapat diverifikasi secara publik di jaringan blockchain, menciptakan standar kepercayaan baru yang belum pernah ada sebelumnya.' },
  { Icon: Shield, title: 'Kriptografi Mutakhir', desc: 'Melindungi privasi dan keamanan akun Anda dengan enkripsi kunci publik-privat, memberikan proteksi maksimal terhadap serangan siber tradisional.' },
];

const categories = ['E-book', 'Course', 'Software', 'Template', 'Design', 'Audio'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src={logo} alt="KaryaNusa Logo" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-xl font-bold gradient-text hidden sm:block">KaryaNusa</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm btn-primary text-white rounded-lg font-medium">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — teks kiri, LOGO kanan */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-2xl sm:blur-3xl transition-colors" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-cyan-600/10 dark:bg-cyan-600/20 rounded-full blur-2xl sm:blur-3xl transition-colors" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-xs text-purple-300 mb-6">
                <Zap size={14} /> Marketplace Produk Digital Nusantara
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
                Akses <span className="gradient-text">Aset Digital</span> Tanpa Batas
              </h1>
              <p className="text-sm sm:text-lg text-[var(--text-secondary)] mb-8 max-w-lg mx-auto lg:mx-0">
                Temukan ribuan karya dan materi edukasi pilihan dari kreator terpercaya. Beli, unduh, dan nikmati langsung dari perangkat Anda kapan saja.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register" className="btn-primary px-8 py-3.5 sm:py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 text-base sm:text-lg">
                  Mulai Belanja <ArrowRight size={20} />
                </Link>
                <Link to="/login" className="px-8 py-3.5 sm:py-4 rounded-xl glass text-[var(--text-primary)] font-semibold flex items-center justify-center gap-2 text-base sm:text-lg hover:bg-[var(--card-hover-bg)] transition-colors">
                  Masuk ke Akun
                </Link>
              </div>
            </div>
            {/* Logo sebagai hero visual — Disembunyikan di Mobile sesuai permintaan USER */}
            <div className="hidden lg:flex relative items-center justify-center order-first lg:order-last mb-8 lg:mb-0">
              <div className="absolute w-64 h-64 sm:w-80 sm:h-80 bg-purple-600/20 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col items-center glass rounded-3xl p-8 sm:p-12 shadow-2xl shadow-purple-900/40 border border-white/10">
                <img
                  src={logo}
                  alt="KaryaNusa Logo"
                  className="w-24 h-24 sm:w-40 sm:h-40 object-contain drop-shadow-2xl mb-6 animate-pulse-slow"
                />
                <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">KaryaNusa</h2>
                <p className="text-[var(--text-secondary)] text-center text-xs sm:text-sm">Digitalizing The Nation's Creativity</p>
                <div className="flex gap-6 mt-6">
                  <p className="text-[var(--text-secondary)] text-center text-[10px] sm:text-xs italic opacity-70">Aman • Transparan • Terdesentralisasi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {highlights.map((item) => (
            <div key={item.title} className="glass rounded-2xl p-6 text-center card-hover border border-white/5">
              <item.Icon size={24} className="text-purple-400 mx-auto mb-3" />
              <div className="text-sm font-bold text-[var(--text-primary)] mb-1">{item.title}</div>
              <div className="text-[var(--text-secondary)] text-xs leading-relaxed opacity-80">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Branding Hub — Replacing Showcase images with Typography & Logo */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-[3rem] p-8 lg:p-16 border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-cyan-600/5 transition-opacity group-hover:opacity-100 opacity-50" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight">
                  Pusat <span className="gradient-text">Ekonomi Digital</span> Nusantara
                </h2>
                <div className="space-y-6">
                  <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                    KaryaNusa hadir untuk mendemokrasikan akses terhadap aset digital berkualitas. Kami percaya bahwa setiap kreator di seluruh pelosok Nusantara berhak mendapatkan panggung yang setara untuk memasarkan karya intelektual mereka.
                  </p>
                  <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                    Melalui kurasi yang ketat dan sistem yang transparan, kami memastikan setiap E-book, Kursus, hingga Template yang Anda dapatkan adalah investasi terbaik untuk pertumbuhan skill dan produktivitas Anda.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 mt-10">
                  <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-purple-400">
                    Aman & Terpercaya
                  </div>
                  <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-cyan-400">
                    Akses Instan
                  </div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2 flex flex-col items-center justify-center p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
                <img src={logo} alt="KaryaNusa Branding" className="w-48 h-48 lg:w-64 lg:h-64 object-contain drop-shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-pulse-slow" />
                <div className="mt-8 text-center">
                  <h3 className="text-2xl font-bold gradient-text">KARYANUSA</h3>
                  <p className="text-[var(--text-secondary)] text-sm mt-2 font-medium">Digitalizing The Nation's Creativity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Mengapa <span className="gradient-text">KaryaNusa?</span></h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Kami menghadirkan pengalaman belanja online yang mudah, aman, dan menyenangkan untuk semua.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((item) => (
              <div key={item.title} className="glass rounded-2xl p-6 card-hover">
                <div className="w-12 h-12 btn-primary rounded-xl flex items-center justify-center mb-4">
                  <item.Icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keunggulan Marketplace Digital */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-900/10 to-cyan-900/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-purple-400 text-sm font-medium uppercase tracking-widest mb-3">Revolusi Web3 & Blockchain</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Masa Depan Marketplace: <span className="gradient-text">Web3 & Blockchain</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              KaryaNusa bukan sekadar marketplace biasa. Kami memanfaatkan kekuatan teknologi <b>Blockchain</b> dan <b>Web3</b> untuk memberikan keamanan yang tak tertandingi, transparansi penuh pada setiap transaksi, dan kedaulatan data bagi setiap pengguna. Selamat datang di era ekonomi digital yang lebih adil dan terpercaya.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {web3Benefits.map((item) => (
              <div key={item.title} className="glass rounded-2xl p-6 card-hover border border-purple-500/20">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                  <item.Icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{item.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Productivity Hub — Replacing "Tingkatkan Skill" image */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="glass rounded-[2.5rem] p-10 border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-purple-500/20">
              <BadgeCheck size={48} className="text-white" />
            </div>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Investasi Intelektual</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Dunia berubah dengan cepat. Di KaryaNusa, kami menyediakan "senjata" digital untuk Anda tetap relevan. Setiap aset yang Anda beli adalah kunci untuk membuka pintu peluang baru.
            </p>
          </div>
          <div>
            <p className="text-purple-400 text-sm font-medium uppercase tracking-widest mb-3">Produktivitas & Edukasi</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Tingkatkan <span className="gradient-text">Skill Anda</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Platform kami dirancang untuk mendukung perjalanan belajar Anda. Dari kursus pemrograman, template desain profesional, hingga E-book panduan bisnis — semua tersedia dari kreator terbaik di bidangnya.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {['Akses materi selamanya', 'Kualitas konten terkurasi', 'Dukungan komunitas kreator'].map(item => (
                <div key={item} className="flex items-center gap-3 text-[var(--text-secondary)] text-sm">
                  <div className="w-5 h-5 rounded-full btn-primary flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <Link to="/register" className="btn-primary px-7 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2">
              Mulai Belanja <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Wide Library Section — Replacing "Koleksi Lengkap" image */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-cyan-400 text-sm font-medium uppercase tracking-widest mb-3">Koleksi Digital</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Ribuan Pilihan <span className="gradient-text">Aset Kreatif</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Telusuri koleksi aset digital terlengkap yang dikurasi khusus untuk kebutuhan profesional Anda. Karya kreator lokal kami menawarkan kualitas global dengan sentuhan kearifan lokal yang unik dan siap digunakan segera.
            </p>
            <Link to="/register" className="btn-primary px-7 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2">
              Jelajahi Koleksi <ArrowRight size={18} />
            </Link>
          </div>
          <div className="order-1 lg:order-2 glass rounded-[2.5rem] p-10 border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-600 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-cyan-500/20">
              <ShoppingBag size={48} className="text-white" />
            </div>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Katalog Teraktif</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Setiap hari, ratusan aset baru ditambahkan ke galeri kami. Mulai dari UI Kit hingga kode sumber aplikasi, semua tersedia dalam satu ekosistem yang kohesif.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Kategori <span className="gradient-text">Produk</span></h2>
          <p className="text-[var(--text-secondary)] mb-8">Jelajahi berbagai kategori produk yang tersedia di platform kami</p>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(cat => (
              <Link key={cat} to="/register"
                className="px-6 py-3 glass rounded-full text-sm font-medium hover:bg-purple-600/30 transition-all">
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Siap Mulai Belanja?</h2>
            <p className="text-[var(--text-secondary)] mb-8">Buat akun gratis sekarang dan nikmati kemudahan berbelanja di KaryaNusa — marketplace digital Indonesia terpercaya.</p>
            <Link to="/register" className="btn-primary px-10 py-4 rounded-xl text-white font-semibold inline-flex items-center gap-2 text-lg">
              Daftar Gratis <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-12 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={logo} alt="KaryaNusa Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-xl font-bold gradient-text">KaryaNusa</span>
        </div>
        <p className="text-[var(--text-secondary)] mb-2">© 2025 KaryaNusa. Marketplace Online Terpercaya di Nusantara.</p>
        <p className="text-[var(--text-secondary)] opacity-50 text-xs">Dibuat dengan dedikasi untuk memajukan ekonomi digital Indonesia.</p>
      </footer>

    </div>
  );
}
