import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, ArrowLeft, Package, ImageIcon } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import toast from 'react-hot-toast';

const CATEGORIES = ['E-book', 'Course', 'Software', 'Template', 'Design', 'Audio', 'Other'];

export default function EditProductPage() {
  const { id } = useParams();
  const [form, setForm] = useState({ name: '', price: '', description: '', category: 'E-book', stock: '' });
  const [existingImages, setExistingImages] = useState([]); // URLs from server
  const [newImages, setNewImages] = useState([]); // New File objects
  const [newPreviews, setNewPreviews] = useState([]); // URLs for new files
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setForm({
          name: data.name || '',
          price: data.price?.toString() || '',
          description: data.description || '',
          category: data.category || 'E-book',
          stock: data.stock?.toString() || ''
        });
        
        if (data.images && data.images.length > 0) {
          setExistingImages(data.images);
        } else if (data.image) {
          setExistingImages([data.image]);
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

  const handleImage = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (existingImages.length + newImages.length + files.length > 5) {
      return toast.error('Maksimal hanya 5 gambar yang diperbolehkan');
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Ukuran gambar ${file.name} melebihi 5MB`);
        return false;
      }
      return true;
    });

    setNewImages(prev => [...prev, ...validFiles]);
    const newPrvs = validFiles.map(file => URL.createObjectURL(file));
    setNewPreviews(prev => [...prev, ...newPrvs]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.description) return toast.error('Nama, harga, dan deskripsi wajib diisi');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      
      fd.append('existing_images', JSON.stringify(existingImages));

      if (existingImages.length > 0 && newImages.length === 0) {
          fd.append('image', existingImages[0]);
      }
      
      newImages.forEach(img => fd.append('images', img));

      await api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Produk berhasil diperbarui!');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal memperbarui produk');
    } finally {
      setLoading(false);
    }
  };

  const totalImagesCount = existingImages.length + newPreviews.length;

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="w-8 h-8 border-2 border-green-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 pb-32">
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl p-6 transition-colors">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-green-600 dark:text-emerald-400" /> Gambar Produk
            </h2>
            <div
              onClick={() => totalImagesCount < 5 && fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-gray-50 dark:bg-gray-800/50 ${
                totalImagesCount > 0 ? 'border-green-500/50' : 'border-gray-300 dark:border-gray-600 hover:border-green-500/50'
              } ${totalImagesCount >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              
              {totalImagesCount > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {existingImages.map((img, idx) => (
                    <div key={`exist-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <img src={img} alt={`existing-${idx}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        setExistingImages(prev => prev.filter((_, i) => i !== idx));
                      }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  
                  {newPreviews.map((prev, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <img src={prev} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        setNewImages(imgs => imgs.filter((_, i) => i !== idx));
                        setNewPreviews(prvs => prvs.filter((_, i) => i !== idx));
                      }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))}

                  {totalImagesCount < 5 && (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg aspect-square hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900">
                      <Upload size={24} className="text-gray-400 dark:text-gray-500 mb-1" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">Tambah</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8">
                  <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">Klik untuk upload gambar</p>
                  <p className="text-gray-400 text-sm mt-1 font-medium">PNG, JPG, WEBP · Maks 5MB · Hingga 5 Foto</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImage} className="hidden" />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl p-6 space-y-4 transition-colors">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package size={18} className="text-green-600 dark:text-emerald-400" /> Informasi Produk
            </h2>

            <div>
              <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Nama Produk *</label>
              <input type="text" placeholder="Nama produk Anda"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Harga (IDR) *</label>
                <input type="text" inputMode="numeric" placeholder="0"
                  value={form.price ? Number(form.price).toLocaleString('id-ID') : ''} 
                  onChange={e => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Stok</label>
                <input type="text" inputMode="numeric" placeholder="0"
                  value={form.stock ? Number(form.stock).toLocaleString('id-ID') : ''} 
                  onChange={e => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors font-medium" />
              </div>
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

          <button type="submit" disabled={loading}
            className="w-full btn-primary shadow-sm py-4 rounded-xl text-white font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Produk'}
          </button>
        </form>
      </div>
    </div>
  );
}
