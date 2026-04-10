import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, Search, User, MessageCircle, 
  ArrowLeft, MoreVertical, 
  Image as ImageIcon, Smile, Paperclip, ChevronLeft,
  X, File, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabaseClient';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

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
  
  // File staging states
  const [stagedFile, setStagedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const isDirectChat = !!username;
  const [mobileShowSidebar, setMobileShowSidebar] = useState(!isDirectChat);

  const scrollRef = useRef();
  const fileInputRef = useRef();

  // 1. Initial Load: Conversations & Active Partner
  useEffect(() => {
    fetchConversations();
    if (username) {
        fetchPartnerByUsername(username);
    } else {
        setActivePartner(null);
        setMessages([]);
    }
  }, [username]);

  // 2. Real-time Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = payload.new;
          if (activePartner && newMsg.sender_id === activePartner.id) {
            setMessages(prev => [...prev, newMsg]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activePartner]);

  // 3. Scroll to bottom
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
      // We now use a dedicated robust profile lookup for chat
      const { data } = await api.get(`/chat/profile/${encodeURIComponent(uname)}`);
      setActivePartner(data);
      fetchMessages(data.id);
    } catch (err) {
      console.error('Error fetching partner:', err.response?.data || err.message);
      toast.error('Gagal memuat profil chat');
    } finally {
      setLoading(false);
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

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatar = (p) => {
    if (!p) return 'https://ui-avatars.com/api/?name=User&background=random';
    // For sellers, shop_logo is primary. For buyers (or non-shop profiles), avatar is primary.
    const url = p.shop_logo_url || p.avatar;
    if (url) return url;
    
    // Fallback to UI Avatars with Initials
    const name = p.shop_name || p.full_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`;
  };

  if (!user) return null;

  return (
    <div className="h-screen bg-[var(--bg-color)] flex flex-col overflow-hidden transition-colors duration-300 pb-safe">
      <Navbar />

      <div className="flex-1 mt-14 sm:mt-16 flex overflow-hidden relative">
        
        {/* SIDEBAR - Conversation List */}
        <div className={`${(activePartner && !mobileShowSidebar) ? 'hidden' : 'flex'} md:flex w-full md:w-80 lg:w-96 flex-col border-r border-[var(--border-color)] bg-white/5`}>
          <div className="p-4 sm:p-6 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => navigate(-1)} className="p-2 bg-[var(--card-bg)] hover:bg-white/10 border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)]"><ArrowLeft size={18} /></button>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">Kotak Masuk</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
              <input type="text" placeholder="Cari pesan..." className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-sm focus:border-purple-500 transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <MessageCircle size={40} className="mx-auto mb-3" />
                <p className="text-sm">Belum ada percakapan</p>
              </div>
            ) : (
              conversations.map((conv, idx) => (
                <div key={idx} onClick={() => { 
                  const identifier = conv.user.username || conv.user.id;
                  navigate(`/chat/${identifier}`); 
                  setActivePartner(conv.user); 
                  setMobileShowSidebar(false); 
                }}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${activePartner?.id === conv.user.id ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-white/5 text-[var(--text-primary)]'}`}>
                  <img src={getAvatar(conv.user)} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/20" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold truncate text-xs sm:text-sm">{conv.user.shop_name || conv.user.full_name}</h4>
                      <span className={`text-[9px] sm:text-[10px] ${activePartner?.id === conv.user.id ? 'text-white/70' : 'opacity-70'}`}>{formatTime(conv.timestamp)}</span>
                    </div>
                    <p className={`text-[11px] sm:text-xs truncate ${activePartner?.id === conv.user.id ? 'text-white/80' : 'opacity-70'}`}>{conv.lastMessage}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN CHAT - Message View */}
        <div className={`${(!activePartner || mobileShowSidebar) ? 'hidden' : 'flex'} md:flex flex-1 flex-col bg-[var(--bg-color)] relative`}>
          {activePartner ? (
            <>
              {/* Header */}
              <div className="p-3 sm:p-4 md:px-8 md:py-5 border-b border-[var(--border-color)] flex items-center justify-between glass sticky top-0 z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button 
                    onClick={() => { 
                      if (isDirectChat && !conversations.length) {
                        navigate(-1);
                      } else {
                        setMobileShowSidebar(true);
                      }
                    }} 
                    className="p-2 sm:p-2.5 bg-[var(--card-bg)] hover:bg-white/10 border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] transition-all md:hidden">
                    <ArrowLeft size={18} />
                  </button>
                  <img src={getAvatar(activePartner)} alt="" className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-purple-500/20" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base md:text-lg truncate">{activePartner.shop_name || activePartner.full_name}</h3>
                    <p className="text-[9px] sm:text-[10px] font-bold text-green-500 uppercase tracking-widest">Active Now</p>
                  </div>
                </div>
                <button className="p-2 text-[var(--text-secondary)] hover:bg-white/5 rounded-xl"><MoreVertical size={18} /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-4 sm:space-y-6 bg-dots-grid">
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[88%] sm:max-w-[85%] md:max-w-[70%] space-y-1`}>
                        <div className={`px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl sm:rounded-[1.5rem] text-[13px] sm:text-[15px] font-medium leading-relaxed shadow-sm ${msg.sender_id === user.id ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-none'}`}>
                          
                          {/* Attachment Rendering */}
                          {msg.attachment_url && (
                            <div className="mb-2 sm:mb-3">
                              {msg.attachment_type === 'image' ? (
                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.attachment_url} alt="Attachment" className="max-w-full rounded-lg border border-white/10 max-h-60 sm:max-h-80 object-cover" />
                                </a>
                              ) : (
                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" 
                                  className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border ${msg.sender_id === user.id ? 'bg-white/10 border-white/20' : 'bg-[var(--bg-color)] border-[var(--border-color)]'}`}>
                                  <File className="text-purple-400" size={20} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] sm:text-xs font-bold truncate">File Lampiran</p>
                                    <p className="text-[8px] sm:text-[10px] opacity-70">Klik untuk unduh</p>
                                  </div>
                                  <Download size={16} />
                                </a>
                              )}
                            </div>
                          )}
                          
                          {msg.content}
                        </div>
                        <p className={`text-[9px] sm:text-[10px] text-[var(--text-secondary)] font-black uppercase ${msg.sender_id === user.id ? 'text-right' : 'text-left'}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 sm:p-4 md:px-10 md:py-6 border-t border-[var(--border-color)] glass">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
                  
                  {/* Staging Preview Area */}
                  {stagedFile && (
                    <div className="absolute bottom-full left-0 right-0 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300 px-2 sm:px-0">
                      <div className="glass p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-purple-500/30 flex items-center gap-3 sm:gap-4 bg-[var(--card-bg)] shadow-2xl">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center"><File className="text-purple-500" /></div>
                        )}
                        <div className="pr-8 min-w-0">
                          <p className="text-[10px] sm:text-xs font-black text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[200px]">{stagedFile.name}</p>
                          <p className="text-[8px] sm:text-[10px] font-bold text-purple-500 uppercase tracking-widest">Siap Dikirim</p>
                        </div>
                        <button type="button" onClick={() => { setStagedFile(null); setFilePreview(null); }} className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all"><X size={12} /></button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                       <button type="button" onClick={() => { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); }} className="p-2 sm:p-2.5 text-[var(--text-secondary)] hover:bg-white/10 rounded-xl" title="Gambar"><ImageIcon size={20} /></button>
                       <button type="button" onClick={() => { fileInputRef.current.accept = "*/*"; fileInputRef.current.click(); }} className="p-2 sm:p-2.5 text-[var(--text-secondary)] hover:bg-white/10 rounded-xl" title="File"><Paperclip size={20} /></button>
                    </div>
                    
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                    <div className="flex-1 relative">
                       <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ketik pesan..." className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl pl-4 pr-10 py-3 sm:py-4 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-purple-500 transition-all shadow-inner" />
                       <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-purple-500 hidden sm:block"><Smile size={20} /></button>
                    </div>
                    
                    <button type="submit" disabled={(!newMessage.trim() && !stagedFile) || sending} className="p-3 sm:p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl sm:rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0">
                      {sending ? <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} className="sm:ml-1" />}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-10">
               <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-600/5 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center mb-6 sm:mb-10 border border-purple-500/10"><MessageCircle size={40} className="text-purple-500" /></div>
               <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-3 sm:mb-4">Kotak Masuk KaryaNusa</h3>
               <p className="max-w-xs sm:max-w-md text-sm sm:text-base text-[var(--text-secondary)] font-medium">Pilih teman bicara untuk mulai berbagi file digital secara real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
