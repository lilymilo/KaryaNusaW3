import { useState, useEffect, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, Search, User, MessageCircle, 
  ArrowLeft, MoreVertical, 
  Image as ImageIcon, Smile, Paperclip, ChevronLeft,
  X, File, Download, Check, CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabaseClient';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const ChatMessage = memo(({ msg, isOwn, formatTime, onImageLoad }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[88%] sm:max-w-[85%] md:max-w-[70%] space-y-1`}>
        <div className={`px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl sm:rounded-[1.5rem] text-[13px] sm:text-[15px] font-medium leading-relaxed shadow-sm ${isOwn ? 'bg-green-600 dark:bg-green-500 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-tl-none font-semibold transition-colors'}`}>
          
          {msg.attachment_url && (
            <div className="mb-2 sm:mb-3">
              {msg.attachment_type === 'image' ? (
                <div className="relative group overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 transition-colors" style={{ minHeight: '120px', minWidth: '150px' }}>
                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={msg.attachment_url} 
                      alt="Attachment" 
                      loading="lazy"
                      onLoad={onImageLoad}
                      className="max-w-full rounded-lg border border-black/10 max-h-60 sm:max-h-80 object-cover bg-white w-full transition-opacity duration-300" 
                    />
                  </a>
                </div>
              ) : (
                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" 
                  className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 transition-colors'}`}>
                  <File className={`${isOwn ? "text-green-200" : "text-green-600 dark:text-emerald-400"}`} size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-bold truncate">File Lampiran</p>
                    <p className="text-[8px] sm:text-[10px] font-medium opacity-80">Klik untuk unduh</p>
                  </div>
                  <Download className="dark:text-gray-400" size={16} />
                </a>
              )}
            </div>
          )}
          
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <p className={`text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase`}>{formatTime(msg.created_at)}</p>
          {isOwn && (
             msg.is_read ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} className="text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
});

export default function ChatPage() {
  const { username } = useParams(); // Target seller username
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  
  const [stagedFile, setStagedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const isDirectChat = !!username;
  const [mobileShowSidebar, setMobileShowSidebar] = useState(!isDirectChat);

  const scrollRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const ids = new Set(Object.keys(state));
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  useEffect(() => {
    fetchConversations();
    if (username) {
        fetchPartnerByUsername(username);
    } else {
        setActivePartner(null);
        setMessages([]);
    }
  }, [username]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat_room')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const newMsg = payload.new;
          if (activePartner && newMsg.sender_id === activePartner.id) {
            setMessages(prev => [...prev, newMsg]);
            api.post(`/chat/read/${activePartner.id}`).catch(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` },
        (payload) => {
          const updatedMsg = payload.new;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          fetchConversations();
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.receiver_id === user.id) {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.add(payload.payload.sender_id);
                return newSet;
            });
            setTimeout(() => {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(payload.payload.sender_id);
                    return newSet;
                });
            }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activePartner]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!username) setLoading(false);
    }
  };

  const fetchPartnerByUsername = async (uname) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/chat/profile/${encodeURIComponent(uname)}`);
      setActivePartner(data);
      fetchMessages(data.id);
      
      api.post(`/chat/read/${data.id}`).catch(() => {});
      fetchConversations(); // refresh sidebar badges
      
      if (user && data.id !== user.id) {
        const statusRes = await api.get(`/social/follow/${data.id}/status`);
        setIsFollowing(statusRes.data.isFollowing);
      }
    } catch (err) {
      console.error('Error fetching partner:', err.response?.data || err.message);
      toast.error('Gagal memuat profil chat');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!activePartner) return;
    try {
      const { data } = await api.post(`/social/follow/${activePartner.id}`);
      setIsFollowing(data.isFollowing);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah status follow');
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      const { data } = await api.get(`/chat/messages/${partnerId}`);
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('Ukuran file maksimal 10MB');
    }

    setStagedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !stagedFile) || !activePartner || sending) return;

    setSending(true);
    try {
      let attachment_url = null;
      let attachment_type = null;

      if (stagedFile) {
        attachment_url = await uploadFile(stagedFile);
        attachment_type = stagedFile.type.startsWith('image/') ? 'image' : 'file';
      }

      const { data } = await api.post('/chat/send', {
        receiver_id: activePartner.id,
        content: newMessage.trim(),
        attachment_url,
        attachment_type
      });
      
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setStagedFile(null);
      setFilePreview(null);
      fetchConversations();
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  let typingTimeout = null;
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!activePartner) return;

    if (!typingTimeout) {
      supabase.channel('chat_room').send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: user.id, receiver_id: activePartner.id }
      });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      typingTimeout = null;
    }, 2000);
  };

  const handleGlobalSearch = async (e) => {
    const val = e.target.value;
    setGlobalSearchQuery(val);
    if (!val.trim()) {
      setGlobalSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get('/chat/search', { params: { q: val } });
      setGlobalSearchResults(data);
    } catch {}
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatar = (p) => {
    if (!p) return 'https://ui-avatars.com/api/?name=User&background=random';
    const url = p.shop_logo_url || p.avatar;
    if (url) return url;
    
    const name = p.shop_name || p.full_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16a34a&color=fff&bold=true`;
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden transition-colors duration-300 pb-[72px] sm:pb-0">
      <Navbar />

      <div className="flex-1 mt-14 sm:mt-16 flex overflow-hidden relative">
        
        <div className={`${(activePartner && !mobileShowSidebar) ? 'hidden' : 'flex'} md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900`}>
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 shadow-sm transition-colors"><ArrowLeft size={18} /></button>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Kotak Masuk</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={globalSearchQuery} onChange={handleGlobalSearch} placeholder="Cari percakapan atau username..." className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {globalSearchQuery.trim() ? (
              globalSearchResults.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pengguna "{globalSearchQuery}" tidak ditemukan</p>
                </div>
              ) : (
                globalSearchResults.map((usr, idx) => (
                  <div key={idx} onClick={() => { 
                    navigate(`/chat/${usr.username || usr.id}`); 
                    setActivePartner(usr); 
                    setMobileShowSidebar(false); 
                  }}
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${activePartner?.id === usr.id ? 'bg-green-600 dark:bg-green-500 text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}>
                    <div className="relative">
                      <img src={getAvatar(usr)} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm bg-white dark:bg-gray-800" />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${onlineUsers.has(usr.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold truncate text-xs sm:text-sm ${activePartner?.id === usr.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{usr.shop_name || usr.full_name}</h4>
                      <p className={`text-[11px] sm:text-xs truncate font-medium ${activePartner?.id === usr.id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>Mulai percakapan baru</p>
                    </div>
                  </div>
                ))
              )
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <MessageCircle size={40} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Belum ada percakapan</p>
              </div>
            ) : (
              conversations.map((conv, idx) => (
                <div key={idx} onClick={() => { 
                  const identifier = conv.user.username || conv.user.id;
                  navigate(`/chat/${identifier}`); 
                  setActivePartner(conv.user); 
                  setMobileShowSidebar(false); 
                }}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${activePartner?.id === conv.user.id ? 'bg-green-600 dark:bg-green-500 text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}>
                  <div className="relative">
                    <img src={getAvatar(conv.user)} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-sm bg-white dark:bg-gray-800" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${onlineUsers.has(conv.user.id) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                         <h4 className={`font-bold truncate text-xs sm:text-sm ${activePartner?.id === conv.user.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{conv.user.shop_name || conv.user.full_name}</h4>
                         {conv.unreadCount > 0 && <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0"></span>}
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-bold ${activePartner?.id === conv.user.id ? 'text-green-200' : 'text-gray-400 dark:text-gray-500'}`}>{formatTime(conv.timestamp)}</span>
                    </div>
                    <p className={`text-[11px] sm:text-xs truncate font-medium ${conv.unreadCount > 0 ? 'text-gray-800 dark:text-gray-200 font-bold' : (activePartner?.id === conv.user.id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400')}`}>{conv.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${(!activePartner || mobileShowSidebar) ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-gray-50 dark:bg-gray-950 relative`}>
          {activePartner ? (
            <>
              <div className="p-3 sm:p-4 md:px-8 md:py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-10 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button 
                    onClick={() => { 
                      if (isDirectChat && !conversations.length) {
                        navigate(-1);
                      } else {
                        setMobileShowSidebar(true);
                      }
                    }} 
                    className="p-2 sm:p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 transition-all md:hidden shadow-sm">
                    <ArrowLeft size={18} />
                  </button>
                  <img src={getAvatar(activePartner)} alt="" className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors" />
                  <div className="min-w-0 flex-1 ml-2 cursor-pointer group" onClick={() => navigate(`/shop/${activePartner.username || activePartner.id}`)}>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base md:text-lg truncate group-hover:text-green-600 transition-colors">{activePartner.shop_name || activePartner.full_name}</h3>
                    {typingUsers.has(activePartner.id) ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-bold text-green-500 dark:text-emerald-400">mengetik</span>
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 bg-green-500 dark:bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-green-500 dark:bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1 bg-green-500 dark:bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    ) : onlineUsers.has(activePartner.id) ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[9px] sm:text-[10px] font-black text-green-500 dark:text-emerald-400 uppercase tracking-widest">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleFollow} className={`hidden sm:block px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isFollowing ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'btn-primary text-white'}`}>
                    {isFollowing ? 'Mengikuti' : 'Ikuti'}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl"><MoreVertical size={18} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                  {messages.map((msg, idx) => (
                    <ChatMessage 
                      key={msg.id || idx} 
                      msg={msg} 
                      isOwn={msg.sender_id === user.id} 
                      formatTime={formatTime}
                      onImageLoad={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    />
                  ))}
                  <div ref={scrollRef} />
                </div>
              </div>

              <div className="p-3 sm:p-4 md:px-10 md:py-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
                  
                  {stagedFile && (
                    <div className="absolute bottom-full left-0 right-0 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300 px-2 sm:px-0">
                      <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-3 sm:gap-4 shadow-lg transition-colors">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover bg-gray-50 dark:bg-gray-900" />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-green-50 dark:bg-green-900/40 flex items-center justify-center border border-green-100 dark:border-green-900/50"><File className="text-green-600 dark:text-emerald-400" /></div>
                        )}
                        <div className="pr-8 min-w-0">
                          <p className="text-[10px] sm:text-xs font-black text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[200px]">{stagedFile.name}</p>
                          <p className="text-[8px] sm:text-[10px] font-bold text-green-600 dark:text-emerald-400 uppercase tracking-widest">Siap Dikirim</p>
                        </div>
                        <button type="button" onClick={() => { setStagedFile(null); setFilePreview(null); }} className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1.5 bg-red-50 dark:bg-red-900/40 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all border border-red-100 dark:border-red-900/50 hover:border-red-500"><X size={12} /></button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                       <button type="button" onClick={() => { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); }} className="p-2 sm:p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="Gambar"><ImageIcon size={20} /></button>
                       <button type="button" onClick={() => { fileInputRef.current.accept = "*/*"; fileInputRef.current.click(); }} className="p-2 sm:p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors" title="File"><Paperclip size={20} /></button>
                    </div>
                    
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                    <div className="flex-1 relative">
                       <input type="text" value={newMessage} onChange={handleTyping} placeholder="Ketik pesan..." className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl pl-4 pr-10 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-sm font-medium" />
                       <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 hidden sm:block transition-colors"><Smile size={20} /></button>
                    </div>
                    
                    <button type="submit" disabled={(!newMessage.trim() && !stagedFile) || sending} className="p-3 sm:p-4 btn-primary text-white rounded-xl sm:rounded-2xl shadow-sm active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0">
                      {sending ? <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} className="sm:ml-1" />}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-10">
               <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-50 dark:bg-green-900/20 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center mb-6 sm:mb-10 border border-green-100 dark:border-green-900/30 shadow-sm transition-colors"><MessageCircle size={40} className="text-green-600 dark:text-emerald-400" /></div>
               <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3 sm:mb-4">Kotak Masuk KaryaNusa</h3>
               <p className="max-w-xs sm:max-w-md text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">Pilih teman bicara untuk mulai berbagi file digital secara real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
