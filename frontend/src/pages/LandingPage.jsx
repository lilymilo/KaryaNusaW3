import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Coins, Globe, Key, Sun, Moon, Menu, X as XIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useScrollReveal from '../hooks/useScrollReveal';
import logo from '../assets/logo.png';

function ScrollReveal({ children, delay = 0, className = '' }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`scroll-hidden ${isVisible ? 'scroll-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
      <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="logo" className="w-9 h-9 object-contain" />
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">KaryaNusa</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all group"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-yellow-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={18} className="text-gray-600 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-bold hover:text-green-600 dark:hover:text-emerald-400 transition-colors">
                Masuk
              </Link>
              <Link to="/register" className="px-6 py-2.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition shadow-sm active:scale-95">
                Daftar
              </Link>
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {isMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 animate-in slide-in-from-top duration-300">
            <div className="px-4 pt-2 pb-6 space-y-3">
              <Link to="/login" className="block w-full text-center py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                Masuk
              </Link>
              <Link to="/register" className="block w-full text-center py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-md">
                Daftar Sekarang
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-4 py-1.5 rounded-full uppercase tracking-widest border border-green-200 dark:border-green-800 inline-flex items-center gap-2">
              <Globe size={16} /> Web3 Terintegrasi
            </span>
            <h1 className="mt-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight">
              Beli Produk Digital, <span className="text-green-600 dark:text-emerald-400">Miliki Sepenuhnya.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg font-medium">
              KaryaNusa menghadirkan era baru marketplace digital. Bukan sekadar menyewa hak pakai, tapi memastikan setiap aset digital yang Anda beli adalah mutlak milik Anda berkat teknologi Web3.
            </p>
            <div className="mt-8">
              <a href="#masalah" className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-md inline-block">
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>

          <div className="hidden md:flex justify-center items-center p-4 md:p-8">
            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 relative flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-full shadow-inner border border-gray-100 dark:border-gray-700 p-8 transition-colors duration-300">
               <img src={logo} alt="KaryaNusa Web3 Visual" className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </main>

      <ScrollReveal>
        <section id="masalah" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6">Ilusi "Kepemilikan" di Internet Saat Ini</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium mb-10">
              Pernahkah Anda membeli e-book, lisensi software, atau aset desain berharga mahal, namun khawatir akses Anda suatu saat dicabut karena platform tersebut bermasalah, tutup, atau akun Anda diblokir sepihak? 
              <br/><br/>
              Secara tradisional (Web2), <strong className="text-gray-900 dark:text-white">Anda sebenarnya tidak memiliki aset tersebut.</strong> Anda hanya merental atau memegang lisensi akses yang kendalinya murni ada di tangan server pihak ketiga. Ketika perusahaan tersebut menyuntik mati servernya, aset "milik" Anda ikut lenyap di udara.
            </p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-12 md:py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-green-600 dark:text-emerald-400 mb-6">Solusinya: Teknologi Web3</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                Web3 adalah evolusi internet yang mengembalikan hak kepemilikan mutlak kepada penggunanya dengan memanfaatkan teknologi Blockchain terdesentralisasi. Tanpa perantara otoritas tunggal, aset digital Anda tercatat secara permanen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ScrollReveal delay={0}>
                <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition h-full">
                  <Key size={40} className="text-green-600 dark:text-emerald-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Kunci di Tangan Anda</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium text-sm leading-relaxed">
                    Aset digital yang dibeli terikat langsung secara kriptografis di dompet digital (wallet) pribadi Anda, bukan dititipkan di database tertutup milik suatu perusahaan.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition h-full">
                  <ShieldCheck size={40} className="text-green-600 dark:text-emerald-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Imun Terhadap Sensor</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium text-sm leading-relaxed">
                    Tidak ada entitas apa pun yang bisa seenaknya menghapus, memblokir, atau menyita aset digital yang sudah Anda beli secara sah melalui smart contract.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={300}>
                <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition h-full">
                  <Coins size={40} className="text-green-600 dark:text-emerald-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Kebebasan Transfer</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium text-sm leading-relaxed">
                    Karena Anda benar-benar memiliki wujud digital aset tersebut, Anda bebas mentransfer, mewariskan, atau menjualnya kembali layaknya barang fisik karya seni di dunia nyata.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-12 md:py-20 bg-green-50 dark:bg-green-950/30 border-y border-green-100 dark:border-green-900/50 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-8">Kenapa KaryaNusa?</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-10">
              KaryaNusa diciptakan sebagai jembatan masa depan bagi kreator Nusantara. Kami menyembunyikan dan menyederhanakan rumitnya teknologi Web3 agar terasa senyaman marketplace biasa, namun diam-diam melindungi karya dengan tingkat keamanan tiada banding.
            </p>
            <div className="text-left bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-green-200 dark:border-green-800/50 transition-colors">
              <ul className="space-y-6 font-medium text-gray-800 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5 text-xl">✅</span> 
                  <span><strong className="text-gray-900 dark:text-white">Kontribusi Penuh Bagi Kreator:</strong> Kami mengeliminasi pajak pihak tengah. Kreator menerima porsi bayaran maksimal secara instan, transparan (dicatat di blockchain), tanpa proses pencairan manual yang lamban.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5 text-xl">✅</span> 
                  <span><strong className="text-gray-900 dark:text-white">Anti-Pembajakan Konvensional:</strong> Keaslian tiap produk digital yang dijual dapat langsung dibuktikan dengan sertifikat kepemilikan NFT (Non-Fungible Token), melindungi reputasi kreator dari pihak-pihak nakal.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5 text-xl">✅</span> 
                  <span><strong className="text-gray-900 dark:text-white">Dibangun Oleh dan Untuk Anak Bangsa:</strong> Memberdayakan ekonomi kreator lokal untuk bersaing secara berdaulat tanpa bergantung pada kemauan regulasi platform monopoli asing.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="bg-gray-900 dark:bg-black py-16 md:py-24 text-center relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 p-32 bg-green-500 opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-purple-500 opacity-5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Revolusi Digital Ada di Tangan Anda</h2>
            <p className="text-gray-300 dark:text-gray-400 mb-10 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Berhentilah "menyewa" aset digital. Mulailah menguasainya secara mutlak hari ini. Tunjukkan dukungan Anda dan bergabunglah ke dunia marketplace terdesentralisasi pertama di Indonesia.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg hover:shadow-green-500/30 active:scale-95">
                Registrasi Sekarang
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <footer className="bg-white dark:bg-gray-900 py-8 px-4 text-center border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
         <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">© 2026 KaryaNusa Marketplace. Mengabdi pada kemerdekaan digital kreator Nusantara.</p>
      </footer>
    </div>
  );
}
