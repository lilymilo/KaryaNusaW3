import { getAuthClient, supabase, supabaseAdmin } from '../config/supabaseClient.js';

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

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const authSupabase = getAuthClient(req);

    const { data: messages, error } = await authSupabase
      .from('messages')
      .select('*, sender:sender_id(id, full_name, avatar, shop_name, username), receiver:receiver_id(id, full_name, avatar, shop_name, username)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

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

export const getPartnerProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) return res.status(400).json({ error: "Identifier required" });

    const handle = decodeURIComponent(identifier).trim();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle);
    if (isUuid) {
      const { data: byId } = await supabase.from('profiles').select('*').eq('id', handle).maybeSingle();
      if (byId) return res.json(byId);
    }

    const { data: byUsername } = await supabase.from('profiles').select('*').ilike('username', handle).maybeSingle();
    if (byUsername) return res.json(byUsername);

    const { data: byShopName } = await supabase.from('profiles').select('*').ilike('shop_name', handle).maybeSingle();
    if (byShopName) return res.json(byShopName);

    const { data: byFullName } = await supabase.from('profiles').select('*').ilike('full_name', handle).maybeSingle();
    if (byFullName) return res.json(byFullName);

    return res.status(404).json({ error: "Profil tidak ditemukan" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const authSupabase = getAuthClient(req);
    const { count, error } = await authSupabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ unreadCount: count || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const authSupabase = getAuthClient(req);

    const { error } = await authSupabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', req.user.id)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const searchTerm = `%${q}%`;
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, shop_name, full_name, avatar, shop_logo_url')
      .or(`username.ilike.${searchTerm},shop_name.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
      .neq('id', req.user.id)
      .limit(10);

    if (error) throw error;
    res.json(users || []);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mencari pengguna' });
  }
};
