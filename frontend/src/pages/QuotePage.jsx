import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import api from '../api/axios';
import { supabase } from '../api/supabaseClient';
import toast from 'react-hot-toast';
import { ArrowLeft, Image as ImageIcon, X, Package, User } from 'lucide-react';

export default function QuotePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'thread';
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [targetData, setTargetData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [content, setContent] = useState('');
  const [stagedFile, setStagedFile] = useState(null);
  const [stagedPreview, setStagedPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (type === 'thread') {
          const { data } = await api.get(`/threads/${id}`);
          setTargetData(data);
        } else if (type === 'product') {
          const { data } = await api.get(`/products/${id}`);
          setTargetData(data);
        }
      } catch (err) {
        toast.error(`Gagal memuat ${type}`);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, type]);

  const handleImageUploadLocal = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Harus berupa gambar');
    if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran maksimal 5MB');
    setStagedFile(file);
    setStagedPreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeStagedImage = () => {
    setStagedFile(null);
    setStagedPreview(null);
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const submitQuote = async () => {
    if (!content.trim() && !stagedFile) return toast.error('Kutipan tidak boleh kosong');
    setSubmitting(true);
    
    try {
      let image_url = null;
      if (stagedFile) {
         const fileExt = stagedFile.name.split('.').pop();
         const fileName = `${Math.random()}.${fileExt}`;
         const filePath = `threads/${user.id}/${fileName}`;
         const { error: uploadError } = await supabase.storage.from('products').upload(filePath, stagedFile);
         if (uploadError) throw uploadError;
         const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
         image_url = publicUrl;
      }

      const payload = {
         content,
         image_url,
      };

      if (type === 'thread') payload.quoted_thread_id = id;
      if (type === 'product') payload.linked_product_id = id;

      await api.post('/threads', payload);
      toast.success('Berhasil menambahkan kutipan!');
      navigate('/feed');
    } catch (err) {
      toast.error('Gagal memposting kutipan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
      <Navbar onCartOpen={() => {}} />
      <div className="max-w-2xl mx-auto pt-20 px-4 sm:px-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg">Kutip</h1>
            </div>
            <button onClick={submitQuote} disabled={submitting || (!content.trim() && !stagedFile)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-6 rounded-full shadow-sm disabled:opacity-50 transition-colors text-sm">
              {submitting ? 'Memuat...' : 'Post'}
            </button>
          </div>

          {loading ? (
             <div className="p-10 text-center text-gray-500">Memuat data...</div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="flex gap-3 sm:gap-4 mb-4">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-10 h-10 rounded-full object-cover shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shrink-0"><User size={20} className="text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <textarea 
                    autoFocus
                    placeholder="Tambahkan komentar Anda..."
                    className="w-full bg-transparent text-gray-900 dark:text-white text-[15px] sm:text-[17px] leading-relaxed resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 min-h-[100px]"
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                  
                  {stagedPreview && (
                    <div className="relative mb-4 inline-block w-full max-w-sm">
                      <img src={stagedPreview} className="rounded-2xl rounded-tl-sm w-full h-auto border border-gray-200 dark:border-gray-700" />
                      <button onClick={removeStagedImage} className="absolute top-2 right-2 p-1.5 bg-gray-900/70 hover:bg-red-500 text-white rounded-full transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {type === 'thread' && targetData && (
                     <div className="mt-2 mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 mb-2">
                           {targetData.author?.avatar ? (
                             <img src={targetData.author.avatar} className="w-5 h-5 rounded-full object-cover" />
                           ) : (
                             <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><User size={12} className="text-gray-400"/></div>
                           )}
                           <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{targetData.author?.shop_name || targetData.author?.full_name}</span>
                           <span className="text-gray-500 text-sm truncate">@{targetData.author?.username}</span>
                           <span className="text-gray-400 text-sm">·</span>
                           <span className="text-gray-500 text-sm whitespace-nowrap">{formatTime(targetData.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">{targetData.content}</p>
                        {targetData.image_url && (
                          <img src={targetData.image_url} className="mt-2 rounded-xl max-h-32 object-cover border border-gray-200 dark:border-gray-700" />
                        )}
                     </div>
                  )}

                  {type === 'product' && targetData && (
                     <div className="mt-2 mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 flex gap-4 items-center">
                        <img src={targetData.image} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{targetData.name}</h4>
                           <p className="text-green-600 dark:text-emerald-400 font-bold text-sm mt-1">Rp {(targetData.price || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-600 dark:text-gray-300"><Package size={16}/></div>
                     </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div className="flex items-center gap-1 -ml-2">
                      <input type="file" ref={fileInputRef} onChange={handleImageUploadLocal} accept="image/*" className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-green-600 dark:text-emerald-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full transition-colors" title="Tambah Media">
                        <ImageIcon size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
