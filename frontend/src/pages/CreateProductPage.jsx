import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft, Package, ImageIcon, Film, X } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

const CATEGORIES = ['E-book', 'Course', 'Software', 'Template', 'Design', 'Video', 'Other'];

const ACCEPTED_TYPES = [
  'image/*',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
].join(',');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for video

const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'other';
};

export default function CreateProductPage() {
  const [form, setForm] = useState({ name: '', price: '', description: '', category: 'E-book' });
  const [mediaFiles, setMediaFiles] = useState([]); // { file, preview, type }
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (mediaFiles.length + files.length > 5) {
      return toast.error('Maksimal 5 file yang diperbolehkan');
    }

    const validFiles = files.filter(file => {
      const ftype = getFileType(file);
      if (ftype === 'other') {
        toast.error(`Format ${file.name} tidak didukung`);
        return false;
      }
      const limit = ftype === 'image' ? 5 * 1024 * 1024 : MAX_FILE_SIZE;
      if (file.size > limit) {
        toast.error(`${file.name} terlalu besar (maks ${ftype === 'image' ? '5MB' : '50MB'})`);
        return false;
      }
      return true;
    });

    const newMedia = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: getFileType(file),
    }));

    setMediaFiles(prev => [...prev, ...newMedia]);
  };


  const removeMedia = (idx) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let k in form) {
      if (!form[k]) return toast.error('Mohon lengkapi semua data');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v);
      });
      mediaFiles.forEach(m => fd.append('images', m.file));
      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Produk berhasil dibuat!');
      navigate('/home');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal membuat produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pt-16 max-w-2xl mx-auto px-4 sm:px-6 pb-20 sm:pb-8">
        <div className="py-8">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Buat Produk</h1>
          <p className="text-gray-500 text-sm font-medium">Jual produk Anda di KaryaNusa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-green-600 dark:text-emerald-400" /> Media Produk
            </h2>
            <div
              onClick={() => mediaFiles.length < 5 && fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-gray-50 dark:bg-gray-800/50 ${
                mediaFiles.length > 0 ? 'border-green-500/50' : 'border-gray-300 dark:border-gray-600 hover:border-green-500/50'
              } ${mediaFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              
              {mediaFiles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaFiles.map((media, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                      {media.type === 'image' && media.preview ? (
                        <img src={media.preview} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                      ) : media.type === 'video' ? (
                        <div className="flex flex-col items-center gap-2 p-3">
                          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <Film size={24} className="text-blue-500" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-full px-1">{media.file.name}</p>
                          <span className="text-[9px] font-bold text-blue-500 uppercase">Video</span>
                        </div>
                      ) : null}
                      <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        removeMedia(idx);
                      }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {mediaFiles.length < 5 && (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg aspect-square hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900">
                      <Upload size={24} className="text-gray-400 dark:text-gray-500 mb-1" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">Tambah</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8">
                  <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">Klik untuk upload media</p>
                  <p className="text-gray-400 text-sm mt-1 font-medium">Gambar (5MB) · Video (50MB) · Maks 5 File</p>
                  <div className="flex justify-center gap-3 mt-3">
                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-emerald-400 text-[10px] font-bold rounded-md">PNG JPG WEBP</span>
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md">MP4 WEBM</span>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} multiple onChange={handleMediaSelect} className="hidden" />
          </div>

          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-gray-700 transition-colors">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package size={18} className="text-green-600 dark:text-emerald-400" /> Informasi Produk
            </h2>

            <div>
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Nama Produk *</label>
              <input type="text" placeholder="Nama produk Anda"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Harga (IDR) *</label>
              <input type="text" inputMode="numeric" placeholder="0"
                value={form.price ? Number(form.price).toLocaleString('id-ID') : ''} 
                onChange={e => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors font-medium" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Kategori</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 cursor-pointer font-medium transition-colors">
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-white dark:bg-gray-800">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Deskripsi Produk *</label>
              <textarea rows={4} placeholder="Jelaskan produk Anda secara detail..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none transition-all font-medium" />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-2xl p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
            </div>
            <div>
              <p className="font-bold text-purple-900 dark:text-purple-300 text-sm mb-1">Aset Digital Tokenisasi (NFT)</p>
              <p className="text-xs text-purple-700/80 dark:text-purple-400/80 leading-relaxed">Produk ini akan dicetak (minting) secara otomatis ke jaringan blockchain Ethereum Sepolia sebagai NFT. Pembeli akan menerima kepemilikan NFT saat transaksi berhasil.</p>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full btn-primary shadow-sm py-4 rounded-xl text-white font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Mempublikasikan & Minting NFT...' : 'Publikasikan Produk'}
          </button>
        </form>
      </div>
    </div>
  );
}

