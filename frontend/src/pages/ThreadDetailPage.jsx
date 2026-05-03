import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { MessageSquare, Heart, Share2, Repeat, BarChart2, ArrowLeft, Package, Trash2, MoreHorizontal, User } from 'lucide-react';

export default function ThreadDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchThread();
  }, [id]);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/threads/${id}`);
      setThread(data);
    } catch (err) {
      console.error('Error fetching thread:', err);
      toast.error('Gagal memuat utas');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Harap login terlebih dahulu');
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await api.post(`/threads/${id}/reply`, { content: replyContent.trim() });
      toast.success('Balasan terkirim!');
      setReplyContent('');
      fetchThread();
    } catch (err) {
      toast.error('Gagal mengirim balasan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (threadId) => {
    if (!user) return toast.error('Harap login');
    try {
      const { data } = await api.post(`/threads/${threadId}/like`);
      if (threadId === id) {
        setThread(prev => ({ ...prev, isLiked: data.isLiked, likes_count: prev.likes_count + (data.isLiked ? 1 : -1) }));
      } else {
        setThread(prev => ({
          ...prev,
          replies: prev.replies.map(r => r.id === threadId ? { ...r, isLiked: data.isLiked, likes_count: r.likes_count + (data.isLiked ? 1 : -1) } : r)
        }));
      }
    } catch (err) {}
  };

  const handleRepost = async (threadId) => {
    if (!user) return toast.error('Harap login');
    try {
      await api.post(`/threads/${threadId}/repost`);
      toast.success('Berhasil direpost!');
      if (threadId === id) {
        setThread(prev => ({ ...prev, reposts_count: prev.reposts_count + 1 }));
      }
    } catch (err) {
      toast.error('Gagal merepost');
    }
  };

  const handleDelete = async (e, threadId, isParent = false) => {
    e.stopPropagation();
    if (!window.confirm('Hapus utas ini?')) return;
    try {
      await api.delete(`/threads/${threadId}`);
      toast.success('Utas dihapus');
      if (isParent) {
        navigate('/feed');
      } else {
        setThread(prev => ({
          ...prev,
          replies: prev.replies.filter(r => r.id !== threadId),
          replies_count: Math.max(0, prev.replies_count - 1)
        }));
      }
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${time} · ${date}`;
  };

  const formatRelativeTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}j`;
    if (diff < 604800) return `${Math.floor(diff/86400)}h`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!thread) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 sm:pb-0 transition-colors">
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="pt-14 max-w-2xl mx-auto border-x border-gray-200 dark:border-gray-800 min-h-screen bg-white dark:bg-gray-900 shadow-sm relative transition-colors">
        <div className="sticky top-14 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-6">
          <button onClick={() => navigate('/feed')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Utas</h1>
        </div>

        <div className="p-3 sm:p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-2.5 mb-3">
            {thread.author.avatar || thread.author.shop_logo_url ? (
              <img src={thread.author.avatar || thread.author.shop_logo_url} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800 cursor-pointer border border-gray-200 dark:border-gray-700" onClick={() => navigate(`/shop/${thread.author.username || thread.author.id}`)} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer border border-gray-200 dark:border-gray-700" onClick={() => navigate(`/shop/${thread.author.username || thread.author.id}`)}>
                <User size={20} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0" onClick={() => navigate(`/shop/${thread.author.username || thread.author.id}`)}>
              <h2 className="font-bold text-[15px] text-gray-900 dark:text-white cursor-pointer hover:underline truncate">{thread.author.shop_name || thread.author.full_name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm cursor-pointer">@{thread.author.username}</p>
            </div>
            <div className="relative">
              <button onClick={() => setOpenMenuId(openMenuId === 'main' ? null : 'main')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <MoreHorizontal size={20} />
              </button>
              {openMenuId === 'main' && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpenMenuId(null)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden py-1">
                    {user && user.id === thread.author.id && (
                      <button onClick={(e) => { handleDelete(e, thread.id, true); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold">
                        <Trash2 size={16} /> Hapus
                      </button>
                    )}
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link disalin'); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                      <Share2 size={16} /> Salin Tautan
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {thread.content && (
            <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-base sm:text-[17px] leading-normal mb-3">
              {thread.content}
            </p>
          )}

          {thread.image_url && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={thread.image_url} alt="" className="w-full h-auto object-cover" />
            </div>
          )}

          {thread.quoted_thread && (
            <div className="mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => navigate(`/thread/${thread.quoted_thread.id}`)}>
              <div className="flex items-center gap-2 mb-2">
                {thread.quoted_thread.author?.avatar ? (
                  <img loading="lazy" src={thread.quoted_thread.author.avatar} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><User size={12} className="text-gray-400" /></div>
                )}
                <span className="font-bold text-sm text-gray-900 dark:text-white">{thread.quoted_thread.author?.shop_name || thread.quoted_thread.author?.full_name || 'User'}</span>
                <span className="text-gray-500 text-sm">@{thread.quoted_thread.author?.username || 'user'}</span>
              </div>
              <p className="text-[15px] text-gray-800 dark:text-gray-200">{thread.quoted_thread.content}</p>
              {thread.quoted_thread.image_url && (
                <img loading="lazy" src={thread.quoted_thread.image_url} className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 max-h-48 w-full object-cover" />
              )}
            </div>
          )}

          {thread.product && (
            <div onClick={() => navigate(`/home`)} className="mb-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex gap-4 items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group cursor-pointer">
              <img src={thread.product.image || thread.product.image_url} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[15px] text-gray-900 dark:text-white group-hover:text-green-600 transition-colors line-clamp-1">{thread.product.name}</h4>
                <p className="text-green-600 dark:text-emerald-400 font-bold text-sm mt-1">Rp {thread.product.price.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-gray-600 dark:text-gray-300"><Package size={18}/></div>
            </div>
          )}

          <div className="text-gray-500 dark:text-gray-400 text-[15px] py-3 border-b border-gray-200 dark:border-gray-800">
            {formatTime(thread.created_at)}
          </div>
          <div className="py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-5 text-sm">
            <span><strong className="text-gray-900 dark:text-white">{thread.replies_count || 0}</strong> <span className="text-gray-500">Balasan</span></span>
            <span><strong className="text-gray-900 dark:text-white">{thread.reposts_count || 0}</strong> <span className="text-gray-500">Repost</span></span>
            <span><strong className="text-gray-900 dark:text-white">{thread.likes_count || 0}</strong> <span className="text-gray-500">Suka</span></span>
            <span><strong className="text-gray-900 dark:text-white">{thread.views_count || 1}</strong> <span className="text-gray-500">Dilihat</span></span>
          </div>

          <div className="flex items-center justify-around text-gray-500 py-1 max-w-lg mx-auto">
            <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
              <div className="p-2.5 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"><MessageSquare size={22} /></div>
            </button>
            <div className="relative group/repost">
              <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
                <div className="p-2.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30"><Repeat size={22} /></div>
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-36 opacity-0 invisible group-hover/repost:opacity-100 group-hover/repost:visible transition-all z-20 overflow-hidden">
                <button onClick={() => handleRepost(thread.id)} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap">Repost</button>
                <button onClick={() => navigate(`/quote/${thread.id}?type=thread`)} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap">Kutip Utas</button>
              </div>
            </div>
            <button onClick={() => handleLike(thread.id)} className={`flex items-center gap-2 transition-colors group ${thread.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
              <div className="p-2.5 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-900/30">
                <Heart size={22} className={thread.isLiked ? "fill-pink-500" : ""} />
              </div>
            </button>
            <button className="flex items-center gap-2 hover:text-green-500 transition-colors group" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link disalin') }}>
               <div className="p-2.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30"><Share2 size={22} /></div>
            </button>
          </div>
        </div>

        {user ? (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-3">
            {user.avatar ? (
              <img src={user.avatar} className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shrink-0"><User size={20} className="text-gray-400" /></div>
            )}
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">
                Membalas <span className="text-green-600 dark:text-emerald-400 font-semibold">@{thread.author.username}</span>
              </div>
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Tulis balasan..."
                className="w-full bg-transparent resize-none outline-none text-gray-900 dark:text-white text-[15px] placeholder-gray-400 dark:placeholder-gray-500 min-h-[44px] py-1"
                rows={1}
              />
              <div className="flex justify-end mt-2">
                <button onClick={submitReply} disabled={submitting || !replyContent.trim()} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded-full shadow-sm disabled:opacity-50 transition-colors text-sm">
                  {submitting ? 'Membalas...' : 'Balas'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center border-b border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 text-sm">Masuk untuk membalas utas ini.</p>
          </div>
        )}

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {thread.replies?.map(reply => (
            <div key={reply.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/thread/${reply.id}`)}>
              <div className="flex gap-2.5 sm:gap-3">
                <div className="shrink-0 flex flex-col items-center">
                  {reply.author.avatar || reply.author.shop_logo_url ? (
                    <img src={reply.author.avatar || reply.author.shop_logo_url} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" onClick={(e) => { e.stopPropagation(); navigate(`/shop/${reply.author.username || reply.author.id}`); }} />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/shop/${reply.author.username || reply.author.id}`); }}>
                      <User size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="font-bold text-[15px] text-gray-900 dark:text-white hover:underline truncate" onClick={(e) => { e.stopPropagation(); navigate(`/shop/${reply.author.username || reply.author.id}`); }}>
                      {reply.author.shop_name || reply.author.full_name}
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-[13px] truncate">@{reply.author.username}</span>
                    <span className="text-gray-400 text-[13px]">·</span>
                    <span className="text-gray-500 text-[13px] hover:underline">{formatRelativeTime(reply.created_at)}</span>
                    {user && user.id === reply.author.id && (
                      <div className="ml-auto relative">
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === reply.id ? null : reply.id); }} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === reply.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden py-1">
                              <button onClick={(e) => { handleDelete(e, reply.id, false); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2 text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold">
                                <Trash2 size={14} /> Hapus
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-1">
                    Membalas <span className="text-green-600 dark:text-emerald-400 font-semibold">@{thread.author.username}</span>
                  </p>

                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-[15px] leading-relaxed mb-2">
                    {reply.content}
                  </p>
                  <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 pr-10 relative z-10 max-w-md -ml-2">
                    <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
                      <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"><MessageSquare size={16} /></div>
                      <span className="text-xs">{reply.replies_count > 0 ? reply.replies_count : ''}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleRepost(reply.id); }} className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
                      <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30"><Repeat size={16} /></div>
                      <span className="text-xs">{reply.reposts_count > 0 ? reply.reposts_count : ''}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleLike(reply.id); }} className={`flex items-center gap-1.5 transition-colors group ${reply.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
                      <div className="p-2 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-900/30">
                        <Heart size={16} className={reply.isLiked ? "fill-pink-500" : ""} />
                      </div>
                      <span className="text-xs">{reply.likes_count > 0 ? reply.likes_count : ''}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.host + '/thread/' + reply.id); toast.success('Link disalin') }} className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
                       <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/30"><Share2 size={16} /></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
