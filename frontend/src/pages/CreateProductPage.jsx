import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft, Package, ImageIcon, Film, X, FileArchive, FileText } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

const CATEGORIES = ['E-book', 'Course', 'Software', 'Template', 'Design', 'Video', 'Other'];

// Explicit MIME types for cross-browser/mobile compatibility
// Mobile Safari & Chrome don't recognize file extensions like .zip/.pdf in accept attribute
const COVER_ACCEPTED = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
].join(',');

const MAIN_FILE_ACCEPTED = [
  'application/pdf',
  'application/zip', 'application/x-zip-compressed', 'application/x-zip',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/epub+zip', 'text/plain',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
].join(',');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB for covers

const getFileType = (file) => {
  const type = file.type || '';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
  
  const ext = file.name.toLowerCase().split('.').pop();
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['doc', 'docx', 'epub', 'txt'].includes(ext)) return 'document';
  
  return 'other';
};

export default function CreateProductPage() {
  const [form, setForm] = useState({ name: '', price: '', description: '', category: 'E-book' });
  
  // Separated: main file (ZIP/PDF/image/video) vs cover (image/video preview)
  const [mainFile, setMainFile] = useState(null); // { file, type }
  const [coverFiles, setCoverFiles] = useState([]); // [{ file, preview, type }]
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const mainFileRef = useRef();
  const coverRef = useRef();
  const navigate = useNavigate();

  // Determine if cover zone should be shown
  // Cover is only relevant when main file is ZIP/PDF/DOC (non-visual file)
  const mainFileType = mainFile?.type;
  const isNonVisualMain = ['pdf', 'archive', 'document'].includes(mainFileType);
  const showCoverZone = isNonVisualMain;

  // Handle main file selection
  const handleMainFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ftype = getFileType(file);
    if (ftype === 'other') {
      return toast.error(`Format ${file.name} tidak didukung`);
    }

    if (file.size > MAX_FILE_SIZE) {
      return toast.error(`${file.name} terlalu besar (maks 50MB)`);
    }

    // If main file is image/video (visual), clear covers — they're not needed
    if (['image', 'video'].includes(ftype)) {
      setCoverFiles([]);
    }

    setMainFile({ 
      file, 
      type: ftype,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    });
  };

  // Handle cover file selection (only when main = ZIP/PDF/DOC)
  const handleCoverSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (coverFiles.length + files.length > 4) {
      return toast.error('Maksimal 4 cover yang diperbolehkan');
    }

    const validFiles = files.filter(file => {
      const ftype = getFileType(file);
      // Cover hanya bisa image atau video — PNG/JPG TIDAK bisa jadi cover (jika bukan main file visual)
      if (!['image', 'video'].includes(ftype)) {
        toast.error(`Cover hanya bisa berupa gambar atau video`);
        return false;
      }
      if (file.size > MAX_COVER_SIZE) {
        toast.error(`${file.name} terlalu besar (maks 10MB untuk cover)`);
        return false;
      }
      return true;
    });

    const newCovers = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: getFileType(file),
    }));

    setCoverFiles(prev => [...prev, ...newCovers]);
  };

  const removeMainFile = () => {
    setMainFile(null);
    setCoverFiles([]); // Reset covers when main file removed
  };

  const removeCover = (idx) => {
    setCoverFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let k in form) {
      if (!form[k]) return toast.error('Mohon lengkapi semua data');
    }
    if (!mainFile) return toast.error('Upload minimal 1 file produk');
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v);
      });
      
      // Append main file
      fd.append('main_file', mainFile.file);
      
      // Append covers (if any)
      coverFiles.forEach(c => fd.append('covers', c.file));
      
      await api.post('/products', fd, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        }
      });
      toast.success('Produk berhasil dibuat!');
      navigate('/home');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal membuat produk');
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
          {/* ─── Main File Zone ─── */}
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Package size={18} className="text-green-600 dark:text-emerald-400" /> File Utama Produk
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">
              Upload file utama: ZIP, PDF, gambar, video, atau dokumen lainnya
            </p>
            
            <div
              onClick={() => !mainFile && mainFileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-gray-50 dark:bg-gray-800/50 ${
                mainFile ? 'border-green-500/50' : 'border-gray-300 dark:border-gray-600 hover:border-green-500/50 cursor-pointer'
              }`}>
              
              {mainFile ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                    {mainFile.type === 'image' && mainFile.preview ? (
                      <img src={mainFile.preview} alt="preview" className="w-full h-full object-cover" />
                    ) : mainFile.type === 'video' ? (
                      <Film size={28} className="text-blue-500" />
                    ) : mainFile.type === 'pdf' || mainFile.type === 'document' ? (
                      <FileText size={28} className="text-red-500" />
                    ) : mainFile.type === 'archive' ? (
                      <FileArchive size={28} className="text-yellow-600" />
                    ) : null}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{mainFile.file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {(mainFile.file.size / (1024 * 1024)).toFixed(2)} MB · 
                      <span className="uppercase font-bold ml-1 text-green-600 dark:text-emerald-400">{mainFile.type}</span>
                    </p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeMainFile(); }}
                    className="p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">Klik untuk upload file utama</p>
                  <p className="text-gray-400 text-sm mt-1 font-medium">Maks 50MB</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    <span className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 text-[10px] font-bold rounded-md">ZIP/RAR</span>
                    <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-md">PDF/DOC</span>
                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-emerald-400 text-[10px] font-bold rounded-md">GAMBAR</span>
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md">VIDEO</span>
                  </div>
                </div>
              )}
            </div>
            <input ref={mainFileRef} type="file" accept={MAIN_FILE_ACCEPTED} onChange={handleMainFileSelect} className="hidden" />
          </div>

          {/* ─── Cover Zone (only when main file is non-visual) ─── */}
          {showCoverZone && (
            <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
              <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" /> Cover / Preview
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full ml-1">OPSIONAL</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">
                Tambahkan gambar atau video sebagai thumbnail/preview produk
              </p>
              
              <div
                onClick={() => coverFiles.length < 4 && coverRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-gray-50 dark:bg-gray-800/50 ${
                  coverFiles.length > 0 ? 'border-blue-500/50' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500/50'
                } ${coverFiles.length >= 4 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                
                {coverFiles.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {coverFiles.map((media, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                        {media.type === 'image' && media.preview ? (
                          <img src={media.preview} alt={`cover-${idx}`} className="w-full h-full object-cover" />
                        ) : media.type === 'video' ? (
                          <div className="flex flex-col items-center gap-2 p-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                              <Film size={20} className="text-blue-500" />
                            </div>
                            <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-full px-1">{media.file.name}</p>
                          </div>
                        ) : null}
                        <button type="button" onClick={(e) => {
                          e.stopPropagation();
                          removeCover(idx);
                        }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {coverFiles.length < 4 && (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg aspect-square hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900">
                        <Upload size={20} className="text-gray-400 dark:text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Tambah</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4">
                    <ImageIcon size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-bold text-sm">Klik untuk upload cover</p>
                    <p className="text-gray-400 text-xs mt-1 font-medium">Gambar atau Video · Maks 10MB · Maks 4 File</p>
                  </div>
                )}
              </div>
              <input ref={coverRef} type="file" accept={COVER_ACCEPTED} multiple onChange={handleCoverSelect} className="hidden" />
            </div>
          )}

          {/* ─── Product Info ─── */}
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

          {/* Upload Progress Bar */}
          {loading && uploadProgress > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Mengupload...</span>
                <span className="text-xs font-black text-green-600 dark:text-emerald-400">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }} 
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full btn-primary shadow-sm py-4 rounded-xl text-white font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? `Mempublikasikan${uploadProgress > 0 ? ` (${uploadProgress}%)` : '...'}` : 'Publikasikan Produk'}
          </button>
        </form>
      </div>
    </div>
  );
}
