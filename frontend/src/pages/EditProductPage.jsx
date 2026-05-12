import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, ArrowLeft, Package, ImageIcon, Film, X, FileArchive, FileText } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

const CATEGORIES = ['E-book', 'Course', 'Software', 'Template', 'Design', 'Audio', 'Other'];

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

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_COVER_SIZE = 10 * 1024 * 1024;

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

const getUrlType = (url) => {
  if (!url) return 'image';
  const l = url.toLowerCase();
  if (l.includes('.pdf')) return 'pdf';
  if (l.includes('.mp4') || l.includes('.webm') || l.includes('.mov') || l.includes('.avi')) return 'video';
  if (l.includes('.zip') || l.includes('.rar') || l.includes('.7z')) return 'archive';
  if (l.includes('.doc') || l.includes('.epub') || l.includes('.txt')) return 'document';
  return 'image';
};

export default function EditProductPage() {
  const { id } = useParams();
  const [form, setForm] = useState({ name: '', price: '', description: '', category: 'E-book' });

  // Existing data from server
  const [existingCovers, setExistingCovers] = useState([]);
  const [existingMainFileUrl, setExistingMainFileUrl] = useState(null);

  // New uploads
  const [newMainFile, setNewMainFile] = useState(null);
  const [newCovers, setNewCovers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const mainFileRef = useRef();
  const coverRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setForm({
          name: data.name || '',
          price: data.price?.toString() || '',
          description: data.description || '',
          category: data.category || 'E-book'
        });

        if (data.main_file_url) {
          setExistingMainFileUrl(data.main_file_url);
        }

        if (data.images && data.images.length > 0) {
          setExistingCovers(data.images);
        } else if (data.image && !data.main_file_url) {
          // Legacy: if no main_file_url, image array IS the main files
          setExistingCovers([data.image]);
        }
      } catch (err) {
        toast.error('Gagal mengambil data produk');
        navigate('/profile');
      } finally {
        setFetching(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const currentMainFile = newMainFile || (existingMainFileUrl ? { type: getUrlType(existingMainFileUrl), url: existingMainFileUrl } : null);
  const mainType = currentMainFile?.type;
  const isNonVisualMain = ['pdf', 'archive', 'document'].includes(mainType);
  const showCoverZone = isNonVisualMain;

  const handleMainFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ftype = getFileType(file);
    if (ftype === 'other') return toast.error(`Format ${file.name} tidak didukung`);
    if (file.size > MAX_FILE_SIZE) return toast.error(`${file.name} terlalu besar (maks 50MB)`);

    if (['image', 'video'].includes(ftype)) {
      setNewCovers([]);
      setExistingCovers([]);
    }

    setNewMainFile({
      file,
      type: ftype,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    });
    setExistingMainFileUrl(null);
  };

  const handleCoverSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const totalCovers = existingCovers.length + newCovers.length;
    if (totalCovers + files.length > 4) return toast.error('Maksimal 4 cover');

    const valid = files.filter(file => {
      const ftype = getFileType(file);
      if (!['image', 'video'].includes(ftype)) { toast.error('Cover hanya bisa gambar atau video'); return false; }
      if (file.size > MAX_COVER_SIZE) { toast.error(`${file.name} terlalu besar (maks 10MB)`); return false; }
      return true;
    });

    setNewCovers(prev => [...prev, ...valid.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: getFileType(file)
    }))]);
  };

  const removeMainFile = () => { setNewMainFile(null); setExistingMainFileUrl(null); setNewCovers([]); setExistingCovers([]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.description) return toast.error('Nama, harga, dan deskripsi wajib diisi');
    setLoading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('existing_images', JSON.stringify(existingCovers));
      fd.append('existing_main_file_url', existingMainFileUrl || '');

      if (newMainFile) fd.append('main_file', newMainFile.file);
      newCovers.forEach(c => fd.append('covers', c.file));

      await api.put(`/products/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100)); }
      });
      toast.success('Produk berhasil diperbarui!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal memperbarui produk');
    } finally { setLoading(false); setUploadProgress(0); }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="w-8 h-8 border-2 border-green-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const FileIcon = ({ type, size = 28 }) => {
    if (type === 'video') return <Film size={size} className="text-blue-500" />;
    if (type === 'pdf' || type === 'document') return <FileText size={size} className="text-red-500" />;
    if (type === 'archive') return <FileArchive size={size} className="text-yellow-600" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pt-16 max-w-2xl mx-auto px-4 sm:px-6 pb-20 sm:pb-8">
        <div className="py-8 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft size={18} className="text-gray-500" />
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Kembali</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Edit Produk</h1>
            <p className="text-gray-500 text-sm font-medium">Sesuaikan detail produk Anda</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main File Zone */}
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Package size={18} className="text-green-600 dark:text-emerald-400" /> File Utama Produk
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">Upload file utama: ZIP, PDF, gambar, video, atau dokumen</p>

            <div onClick={() => !currentMainFile && mainFileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-gray-50 dark:bg-gray-800/50 ${
                currentMainFile ? 'border-green-500/50' : 'border-gray-300 dark:border-gray-600 hover:border-green-500/50 cursor-pointer'
              }`}>
              {currentMainFile ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                    {currentMainFile.type === 'image' ? (
                      <img src={currentMainFile.preview || currentMainFile.url} alt="main" className="w-full h-full object-cover" />
                    ) : (
                      <FileIcon type={currentMainFile.type} />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {newMainFile ? newMainFile.file.name : (existingMainFileUrl?.split('/').pop() || 'File utama')}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {newMainFile ? `${(newMainFile.file.size / (1024*1024)).toFixed(2)} MB · ` : ''}
                      <span className="uppercase font-bold text-green-600 dark:text-emerald-400">{currentMainFile.type}</span>
                    </p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeMainFile(); }}
                    className="p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="py-6">
                  <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">Klik untuk upload file utama</p>
                  <p className="text-gray-400 text-sm mt-1 font-medium">Maks 50MB</p>
                </div>
              )}
            </div>
            <input ref={mainFileRef} type="file" accept={MAIN_FILE_ACCEPTED} onChange={handleMainFileSelect} className="hidden" />
          </div>

          {/* Cover Zone */}
          {showCoverZone && (
            <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
              <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" /> Cover / Preview
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full ml-1">OPSIONAL</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">Tambahkan gambar atau video sebagai thumbnail/preview</p>

              <div onClick={() => (existingCovers.length + newCovers.length) < 4 && coverRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-gray-50 dark:bg-gray-800/50 ${
                  (existingCovers.length + newCovers.length) > 0 ? 'border-blue-500/50' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500/50'
                } ${(existingCovers.length + newCovers.length) >= 4 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>

                {(existingCovers.length + newCovers.length) > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingCovers.map((img, idx) => {
                      const type = getUrlType(img);
                      return (
                        <div key={`e-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                          {type === 'image' ? (
                            <img src={img} alt={`cover-${idx}`} className="w-full h-full object-cover" />
                          ) : (
                            <FileIcon type={type} size={24} />
                          )}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setExistingCovers(p => p.filter((_, i) => i !== idx)); }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                    {newCovers.map((c, idx) => (
                      <div key={`n-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                        {c.type === 'image' && c.preview ? (
                          <img src={c.preview} alt={`new-${idx}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-2">
                            <Film size={20} className="text-blue-500" />
                            <p className="text-[9px] font-bold text-gray-500 truncate max-w-full px-1">{c.file.name}</p>
                          </div>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); setNewCovers(p => p.filter((_, i) => i !== idx)); }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(existingCovers.length + newCovers.length) < 4 && (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg aspect-square hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900">
                        <Upload size={20} className="text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-400 font-bold">Tambah</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4">
                    <ImageIcon size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 font-bold text-sm">Klik untuk upload cover</p>
                    <p className="text-gray-400 text-xs mt-1 font-medium">Gambar atau Video · Maks 10MB · Maks 4</p>
                  </div>
                )}
              </div>
              <input ref={coverRef} type="file" accept={COVER_ACCEPTED} multiple onChange={handleCoverSelect} className="hidden" />
            </div>
          )}

          {/* Product Info */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl p-6 space-y-4 transition-colors">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package size={18} className="text-green-600 dark:text-emerald-400" /> Informasi Produk
            </h2>
            <div>
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Nama Produk *</label>
              <input type="text" placeholder="Nama produk Anda" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
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

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">Mengupload...</span>
                <span className="text-xs font-black text-green-600 dark:text-emerald-400">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full btn-primary shadow-sm py-4 rounded-xl text-white font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? `Menyimpan${uploadProgress > 0 ? ` (${uploadProgress}%)` : '...'}` : 'Simpan Perubahan Produk'}
          </button>
        </form>
      </div>
    </div>
  );
}
