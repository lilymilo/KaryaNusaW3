import { getAuthClient, supabase } from '../config/supabaseClient.js';

// 1. Get Conversation History
export const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const authSupabase = getAuthClient(req);

    const { data, error } = await authSupabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${req.user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get All Conversations (List of people user has chatted with)
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const authSupabase = getAuthClient(req);

    // Fetch all messages involving the user
    const { data: messages, error } = await authSupabase
      .from('messages')
      .select('*, sender:sender_id(id, full_name, avatar, shop_name, username), receiver:receiver_id(id, full_name, avatar, shop_name, username)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by conversation partner
    const conversationsMap = new Map();
    messages.forEach(msg => {
      const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
      if (!otherUser) return;
      
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, {
          user: otherUser,
          lastMessage: msg.content,
          timestamp: msg.created_at,
          unreadCount: (msg.receiver_id === userId && !msg.is_read) ? 1 : 0
        });
      } else if (msg.receiver_id === userId && !msg.is_read) {
        conversationsMap.get(otherId).unreadCount += 1;
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Send Message
export const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content, attachment_url, attachment_type } = req.body;
    const authSupabase = getAuthClient(req);

    const { data, error } = await authSupabase
      .from('messages')
      .insert([{
        sender_id: req.user.id,
        receiver_id,
        content,
        attachment_url,
        attachment_type
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Get Partner Profile (Robust lookup for chat)
export const getPartnerProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) return res.status(400).json({ error: "Identifier required" });

    const handle = decodeURIComponent(identifier).trim();

    // A. Try finding by ID first (most stable)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle);
    if (isUuid) {
      const { data: byId } = await supabase.from('profiles').select('*').eq('id', handle).maybeSingle();
      if (byId) return res.json(byId);
    }

    // B. fallback 1: Username
    const { data: byUsername } = await supabase.from('profiles').select('*').ilike('username', handle).maybeSingle();
    if (byUsername) return res.json(byUsername);

    // C. fallback 2: Shop Name
    const { data: byShopName } = await supabase.from('profiles').select('*').ilike('shop_name', handle).maybeSingle();
    if (byShopName) return res.json(byShopName);

    // D. fallback 3: Full Name
    const { data: byFullName } = await supabase.from('profiles').select('*').ilike('full_name', handle).maybeSingle();
    if (byFullName) return res.json(byFullName);

    return res.status(404).json({ error: "Profil tidak ditemukan" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
