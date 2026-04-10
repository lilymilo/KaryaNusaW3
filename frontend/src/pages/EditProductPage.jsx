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
        
        // Handle images (support both new images array and old single image fallback)
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
      
      // Kirim array gambar lama yang dipertahankan
      fd.append('existing_images', JSON.stringify(existingImages));

      // Jika ada gambar tunggal tersisa (untuk kompatibilitas fallback jika backend butuh 'image')
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
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] transition-colors duration-300">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pt-20 max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        <div className="py-8 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-2 glass rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-[var(--text-secondary)]">Kembali</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Produk</h1>
            <p className="text-[var(--text-secondary)] text-sm">Sesuaikan detail produk Anda</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-[var(--border-color)]">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-purple-400" /> Gambar Produk
            </h2>
            <div
              onClick={() => totalImagesCount < 5 && fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                totalImagesCount > 0 ? 'border-purple-500/50' : 'border-[var(--border-color)] hover:border-purple-500/50'
              } ${totalImagesCount >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              
              {totalImagesCount > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Existing Images */}
                  {existingImages.map((img, idx) => (
                    <div key={`exist-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-color)]">
                      <img src={img} alt={`existing-${idx}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        setExistingImages(prev => prev.filter((_, i) => i !== idx));
                      }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* New Images Previews */}
                  {newPreviews.map((prev, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-color)]">
                      <img src={prev} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        setNewImages(imgs => imgs.filter((_, i) => i !== idx));
                        setNewPreviews(prvs => prvs.filter((_, i) => i !== idx));
                      }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  ))}

                  {totalImagesCount < 5 && (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500/30 rounded-lg aspect-square hover:bg-white/5 transition-colors">
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">Tambah</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8">
                  <Upload size={40} className="text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Klik untuk upload gambar</p>
                  <p className="text-gray-600 text-sm mt-1">PNG, JPG, WEBP · Maks 5MB · Hingga 5 Foto</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImage} className="hidden" />
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Package size={18} className="text-purple-400" /> Informasi Produk
            </h2>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Nama Produk *</label>
              <input type="text" placeholder="Nama produk Anda"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] opacity-70 focus:opacity-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Harga (IDR) *</label>
                <input type="text" inputMode="numeric" placeholder="0"
                  value={form.price ? Number(form.price).toLocaleString('id-ID') : ''} 
                  onChange={e => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Stok</label>
                <input type="text" inputMode="numeric" placeholder="0"
                  value={form.stock ? Number(form.stock).toLocaleString('id-ID') : ''} 
                  onChange={e => setForm({ ...form, stock: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Kategori</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 cursor-pointer">
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[var(--bg-color)]">{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Deskripsi Produk *</label>
              <textarea rows={4} placeholder="Jelaskan produk Anda secara detail..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] opacity-70 focus:opacity-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-all" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full btn-primary py-4 rounded-xl text-white font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Produk'}
          </button>
        </form>
      </div>
    </div>
  );
}
