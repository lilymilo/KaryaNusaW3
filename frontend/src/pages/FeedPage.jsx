import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { MessageSquare, Heart, Share2, Image as ImageIcon, X, Package, Repeat, BarChart2, Trash2, MoreHorizontal, User } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const [content, setContent] = useState('');
  const [stagedFile, setStagedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [linkedProduct, setLinkedProduct] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fileInputRef = useRef();
  const textareaRef = useRef();
  const observer = useRef();

  const lastThreadRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchFeed(true);
    if (user) fetchUserProducts();
  }, [user]);

  useEffect(() => {
    if (page > 1) {
      fetchFeed(false);
    }
  }, [page]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  const fetchFeed = async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const { data } = await api.get('/threads', {
        params: {
          page: isInitial ? 1 : page,
          limit: 20
        }
      });
      
      if (isInitial) {
        setThreads(data.data || []);
      } else {
        setThreads(prev => [...prev, ...(data.data || [])]);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const { data } = await api.get(`/shop/${user.username || user.id}`);
      setUserProducts(data.products || []);
    } catch (err) {}
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Hanya mendukung format gambar');
    if (file.size > 5 * 1024 * 1024) return toast.error('Maksimal ukuran 5MB');
    setStagedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const submitThread = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Harap login terlebih dahulu');
    if (!content.trim() && !stagedFile) return toast.error('Pos tidak boleh kosong');

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (stagedFile) {
        const fileExt = stagedFile.name.split('.').pop();
        const filePath = `threads/${user.id}/${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('public').upload(filePath, stagedFile);
        if (error) {
           const { error: fallbackErr } = await supabase.storage.from('avatars').upload(filePath, stagedFile);
           if (fallbackErr) throw fallbackErr;
           imageUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
        } else {
           imageUrl = supabase.storage.from('public').getPublicUrl(filePath).data.publicUrl;
        }
      }

      await api.post('/threads', {
        content: content.trim(),
        image_url: imageUrl,
        linked_product_id: linkedProduct?.id || null
      });

      toast.success('Utas berhasil diunggah!');
      setContent('');
      setStagedFile(null);
      setFilePreview(null);
      setLinkedProduct(null);
      fetchFeed(true);
    } catch (err) {
      console.error("Submit Thread Error:", err);
      toast.error(`Gagal mengunggah utas: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (threadId) => {
    if (!user) return toast.error('Harap login');
    try {
      const { data } = await api.post(`/threads/${threadId}/like`);
      setThreads(threads.map(t => t.id === threadId ? { ...t, isLiked: data.isLiked, likes_count: t.likes_count + (data.isLiked ? 1 : -1) } : t));
    } catch (err) {}
  };

  const handleRepost = async (e, threadId) => {
    e.stopPropagation();
    if (!user) return toast.error('Harap login');
    try {
      const { data: repostData } = await api.post(`/threads/${threadId}/repost`);
      toast.success('Berhasil direpost!');
      if (repostData) {
        setThreads(prev => [repostData, ...prev]);
      } else {
        fetchFeed(true);
      }
    } catch (err) {
      toast.error('Gagal merepost');
    }
  };

  const handleDelete = async (e, threadId) => {
    e.stopPropagation();
    if (!window.confirm('Hapus utas ini?')) return;
    try {
      await api.delete(`/threads/${threadId}`);
      toast.success('Utas dihapus');
      setThreads(threads.filter(t => t.id !== threadId));
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}j`;
    if (diff < 604800) return `${Math.floor(diff/86400)}h`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const articleClasses = "p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-0 transition-colors">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pt-16 max-w-2xl mx-auto border-x border-gray-200 dark:border-gray-800 min-h-screen bg-white dark:bg-gray-900 shadow-sm relative transition-colors">
        
        <div className="sticky top-16 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Linimasa</h1>
        </div>

        {user ? (
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex gap-3">
              {user.avatar ? (
                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700"><User size={20} className="text-gray-400" /></div>
              )}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => { setContent(e.target.value); autoResize(); }}
                  placeholder="Apa yang ingin Anda bagikan?"
                  className="w-full bg-transparent resize-none outline-none text-gray-900 dark:text-white text-[15px] placeholder-gray-400 dark:placeholder-gray-500 py-2 min-h-[56px]"
                  rows={2}
                />
                
                {filePreview && (
                  <div className="relative mb-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={filePreview} className="w-full max-h-72 object-cover" />
                    <button onClick={() => { setStagedFile(null); setFilePreview(null); }} className="absolute top-2 right-2 p-1.5 bg-gray-900/70 text-white rounded-full hover:bg-red-500 transition-colors">
                      <X size={14}/>
                    </button>
                  </div>
                )}

                {linkedProduct && (
                  <div className="relative mb-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-3 items-center bg-gray-50 dark:bg-gray-800">
                    <img src={linkedProduct.image || linkedProduct.image_url} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{linkedProduct.name}</p>
                      <p className="text-xs text-green-600 dark:text-emerald-400 font-semibold">Rp {linkedProduct.price?.toLocaleString('id-ID')}</p>
                    </div>
                    <button onClick={() => setLinkedProduct(null)} className="p-1 hover:text-red-500 text-gray-400"><X size={16}/></button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex gap-1 text-green-600 dark:text-emerald-400 -ml-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" title="Gambar">
                      <ImageIcon size={20} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                    <div className="relative">
                      <button onClick={() => setShowProductPicker(!showProductPicker)} className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" title="Tautkan Produk">
                        <Package size={20} />
                      </button>
                      {showProductPicker && (
                        <div className="absolute top-10 left-0 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-30 p-2 max-h-60 overflow-y-auto">
                          <p className="text-xs font-bold text-gray-500 mb-2 px-2">Katalog Anda</p>
                          {userProducts.length === 0 ? (
                            <p className="text-xs p-2 text-gray-400">Belum ada produk.</p>
                          ) : (
                            userProducts.map(p => (
                              <button key={p.id} onClick={() => { setLinkedProduct(p); setShowProductPicker(false); }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl flex items-center gap-2">
                                <img src={p.image || p.image_url} className="w-8 h-8 rounded-md object-cover" />
                                <span className="text-xs font-bold truncate text-gray-900 dark:text-white">{p.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={submitThread} disabled={submitting || (!content.trim() && !stagedFile)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-5 rounded-full shadow-sm disabled:opacity-50 transition-colors text-sm">
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login untuk mulai berbagi</h2>
            <p className="text-gray-500 text-sm">Bergabung dan promosikan produk digital terbaikmu.</p>
          </div>
        )}

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Belum ada utas yang dibagikan.</div>
          ) : (
            <>
              {threads.map((thread, index) => (
                <div key={thread.id} ref={index === threads.length - 1 ? lastThreadRef : null}>
                  <article 
                    onClick={() => navigate(`/thread/${thread.id}`)} 
                    className={articleClasses}
                  >
                    
                    {thread.quoted_thread_id && !thread.content && (
                      <div className="flex items-center gap-2 mb-1.5 ml-8 text-gray-500 text-[13px] font-bold">
                        <Repeat size={14} />
                        <span>{thread.author.full_name} merepost</span>
                      </div>
                    )}

                    <div className="flex gap-2.5 sm:gap-3">
                      <div onClick={(e) => { e.stopPropagation(); navigate(`/shop/${thread.author.username || thread.author.id}`); }} className="shrink-0">
                        {thread.author.avatar || thread.author.shop_logo_url ? (
                          <img loading="lazy" src={thread.author.avatar || thread.author.shop_logo_url} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"><User size={20} className="text-gray-400" /></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div onClick={(e) => { e.stopPropagation(); navigate(`/shop/${thread.author.username || thread.author.id}`); }} className="font-bold text-gray-900 dark:text-white hover:underline truncate text-[15px]">
                            {thread.author.shop_name || thread.author.full_name}
                          </div>
                          <span className="text-gray-500 dark:text-gray-400 text-sm truncate">@{thread.author.username}</span>
                          <span className="text-gray-400 text-sm">·</span>
                          <span className="text-gray-500 text-sm whitespace-nowrap">{formatTime(thread.created_at)}</span>
                          
                          <div className="ml-auto relative">
                            <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === thread.id ? null : thread.id); }} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors -mr-1.5">
                              <MoreHorizontal size={18} />
                            </button>
                            {openMenuId === thread.id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden py-1">
                                  {user && user.id === thread.author.id && (
                                    <button onClick={(e) => { handleDelete(e, thread.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-bold">
                                      <Trash2 size={16} /> Hapus Utas
                                    </button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.host + '/thread/' + thread.id); toast.success('Link disalin'); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                                    <Share2 size={16} /> Salin Tautan
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {thread.content && (
                          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-[15px] leading-relaxed mb-2.5">
                            {thread.content}
                          </p>
                        )}

                        {thread.image_url && (
                          <div className="mb-2.5 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img loading="lazy" src={thread.image_url} alt="" className="w-full h-auto max-h-96 object-cover" />
                          </div>
                        )}

                        {thread.quoted_thread && (
                          <div className="mb-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.quoted_thread.id}`); }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              {thread.quoted_thread.author?.avatar ? (
                                <img loading="lazy" src={thread.quoted_thread.author.avatar} className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><User size={10} className="text-gray-400" /></div>
                              )}
                              <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{thread.quoted_thread.author?.shop_name || thread.quoted_thread.author?.full_name || 'User'}</span>
                              <span className="text-gray-500 text-xs sm:text-sm truncate">@{thread.quoted_thread.author?.username || 'user'}</span>
                              <span className="text-gray-400 text-xs">·</span>
                              <span className="text-gray-500 text-xs whitespace-nowrap">{formatTime(thread.quoted_thread.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">{thread.quoted_thread.content}</p>
                            {thread.quoted_thread.image_url && (
                              <img src={thread.quoted_thread.image_url} className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 max-h-40 w-full object-cover" />
                            )}
                          </div>
                        )}

                        {thread.product && (
                          <div onClick={(e) => { e.stopPropagation(); navigate(`/home`); }} className="mb-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex gap-4 items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group relative z-10">
                            <img src={thread.product.image || thread.product.image_url} className="w-16 h-16 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-green-600 transition-colors line-clamp-1">{thread.product.name}</h4>
                              <p className="text-green-600 dark:text-emerald-400 font-bold text-sm mt-1">Rp {thread.product.price.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-600 dark:text-gray-300"><Package size={16}/></div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mt-1 pr-2 sm:pr-8 relative z-10 max-w-md -ml-2">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/thread/${thread.id}`); }} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"><MessageSquare size={18} /></div>
                            <span className="text-xs font-semibold">{thread.replies_count > 0 ? thread.replies_count : ''}</span>
                          </button>
                          <div className="relative group/repost">
                            <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
                              <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30"><Repeat size={18} /></div>
                              <span className="text-xs font-semibold">{thread.reposts_count > 0 ? thread.reposts_count : ''}</span>
                            </button>
                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-36 opacity-0 invisible group-hover/repost:opacity-100 group-hover/repost:visible transition-all z-20 overflow-hidden">
                              <button onClick={(e) => handleRepost(e, thread.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap">Repost</button>
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/quote/${thread.id}?type=thread`); }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap">Kutip Utas</button>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleLike(thread.id); }} className={`flex items-center gap-1.5 transition-colors group ${thread.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
                            <div className="p-2 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-900/30">
                              <Heart size={18} className={thread.isLiked ? "fill-pink-500" : ""} />
                            </div>
                            <span className="text-xs font-semibold">{thread.likes_count > 0 ? thread.likes_count : ''}</span>
                          </button>
                          <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
                            <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"><BarChart2 size={18} /></div>
                            <span className="text-xs font-semibold">{thread.views_count > 0 ? thread.views_count : ''}</span>
                          </button>
                          <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors group" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.host + '/thread/' + thread.id); toast.success('Link disalin') }}>
                             <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30"><Share2 size={18} /></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
              
              {loadingMore && (
                <div className="flex justify-center py-8 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <Repeat className="w-6 h-6 text-green-600 animate-spin" />
                </div>
              )}
              
              {!hasMore && threads.length > 0 && (
                <div className="p-10 text-center text-gray-400 text-sm font-medium bg-white dark:bg-gray-900">
                  — Anda telah melihat semuanya —
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
