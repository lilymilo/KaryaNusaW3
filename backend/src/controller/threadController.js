import { getAuthClient, supabase, supabaseAdmin } from '../config/supabaseClient.js';

export const getFeed = async (req, res) => {
  try {
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        *,
        author:profiles!author_id(id, full_name, username, avatar, shop_name),
        product:products!linked_product_id(*),
        quoted_thread:threads!quoted_thread_id(*, author:profiles!author_id(id, full_name, username, avatar, shop_name))
      `)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    let likedThreadIds = [];
    if (req.user) {
      const { data: likes } = await supabaseAdmin
        .from('thread_likes')
        .select('thread_id')
        .eq('user_id', req.user.id);
      likedThreadIds = likes?.map(l => l.thread_id) || [];
    }

    const enhancedThreads = threads.map(t => ({
      ...t,
      isLiked: likedThreadIds.includes(t.id)
    }));

    res.json(enhancedThreads);
  } catch (err) {
    console.error("getFeed ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getUserThreads = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        *,
        author:profiles!author_id(id, full_name, username, avatar, shop_name),
        product:products!linked_product_id(*),
        quoted_thread:threads!quoted_thread_id(*, author:profiles!author_id(id, full_name, username, avatar, shop_name)),
        parent_thread:threads!parent_id(id, author_id, author:profiles!author_id(username))
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    let likedThreadIds = [];
    if (req.user && threads.length > 0) {
      const { data: likes } = await supabaseAdmin
        .from('thread_likes')
        .select('thread_id')
        .eq('user_id', req.user.id)
        .in('thread_id', threads.map(t => t.id));
      likedThreadIds = likes?.map(l => l.thread_id) || [];
    }

    const enhancedThreads = threads.map(t => ({
      ...t,
      isLiked: likedThreadIds.includes(t.id)
    }));

    res.json(enhancedThreads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createThread = async (req, res) => {
  try {
    const { content, image_url, linked_product_id, quoted_thread_id } = req.body;
    if (!content && !image_url) return res.status(400).json({ error: 'Konten tidak boleh kosong' });

    const authSupabase = getAuthClient(req);
    const { data, error } = await authSupabase
      .from('threads')
      .insert([{
        author_id: req.user.id,
        content,
        image_url,
        linked_product_id,
        quoted_thread_id
      }])
      .select('*, author:profiles!author_id(id, full_name, username, avatar, shop_name)')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("createThread ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params; // thread id
    const userId = req.user.id;

    const { data: existing } = await supabaseAdmin
      .from('thread_likes')
      .select('*')
      .eq('thread_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from('thread_likes').delete().eq('thread_id', id).eq('user_id', userId);
      const { data: thread } = await supabaseAdmin.from('threads').select('likes_count').eq('id', id).single();
      await supabaseAdmin.from('threads').update({ likes_count: Math.max(0, thread.likes_count - 1) }).eq('id', id);
      res.json({ isLiked: false });
    } else {
      await supabaseAdmin.from('thread_likes').insert([{ thread_id: id, user_id: userId }]);
      const { data: thread } = await supabaseAdmin.from('threads').select('likes_count').eq('id', id).single();
      await supabaseAdmin.from('threads').update({ likes_count: thread.likes_count + 1 }).eq('id', id);
      res.json({ isLiked: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getThread = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: thread, error } = await supabase
      .from('threads')
      .select(`
        *,
        author:profiles!author_id(id, full_name, username, avatar, shop_name),
        product:products!linked_product_id(*),
        quoted_thread:threads!quoted_thread_id(*, author:profiles!author_id(id, full_name, username, avatar, shop_name))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!thread) return res.status(404).json({ error: 'Thread tidak ditemukan' });

    thread.replies_count = thread.replies_count || 0;
    thread.reposts_count = thread.reposts_count || 0;
    thread.views_count = thread.views_count || 0;

    const { data: replies } = await supabase
      .from('threads')
      .select('*, author:profiles!author_id(id, full_name, username, avatar, shop_name)')
      .eq('parent_id', id)
      .order('created_at', { ascending: true });

    await supabaseAdmin.from('threads').update({ views_count: thread.views_count + 1 }).eq('id', id);

    let isLiked = false;
    if (req.user) {
      const { data: like } = await supabaseAdmin
        .from('thread_likes')
        .select('*')
        .eq('thread_id', id)
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (like) isLiked = true;
    }

    res.json({ ...thread, views_count: thread.views_count + 1, isLiked, replies: replies || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const replyToThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, image_url } = req.body;
    if (!content) return res.status(400).json({ error: 'Konten tidak boleh kosong' });

    const authSupabase = getAuthClient(req);
    const { data: reply, error } = await authSupabase
      .from('threads')
      .insert([{
        author_id: req.user.id,
        parent_id: id,
        content,
        image_url
      }])
      .select('*, author:profiles!author_id(id, full_name, username, avatar, shop_name)')
      .single();

    if (error) throw error;

    const { data: parent } = await supabaseAdmin.from('threads').select('replies_count').eq('id', id).single();
    await supabaseAdmin.from('threads').update({ replies_count: (parent?.replies_count || 0) + 1 }).eq('id', id);

    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const repostThread = async (req, res) => {
  try {
    const { id } = req.params; // quoted thread id
    const { content } = req.body; // optional caption

    const authSupabase = getAuthClient(req);
    const { data: repost, error } = await authSupabase
      .from('threads')
      .insert([{
        author_id: req.user.id,
        quoted_thread_id: id,
        content: content || ''
      }])
      .select()
      .single();

    if (error) throw error;

    const { data: fullRepost } = await supabase
      .from('threads')
      .select(`
        *,
        author:profiles!author_id(id, full_name, username, avatar, shop_name),
        quoted_thread:threads!quoted_thread_id(*, author:profiles!author_id(id, full_name, username, avatar, shop_name))
      `)
      .eq('id', repost.id)
      .single();

    const { data: quoted } = await supabaseAdmin.from('threads').select('reposts_count').eq('id', id).single();
    await supabaseAdmin.from('threads').update({ reposts_count: (quoted?.reposts_count || 0) + 1 }).eq('id', id);

    res.json(fullRepost || repost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteThread = async (req, res) => {
  try {
    const { id } = req.params;
    const authSupabase = getAuthClient(req);
    
    const { data: thread } = await supabaseAdmin.from('threads').select('author_id, parent_id, quoted_thread_id').eq('id', id).single();
    
    if (!thread) return res.status(404).json({ error: 'Utas tidak ditemukan' });
    if (thread.author_id !== req.user.id) return res.status(403).json({ error: 'Tidak memiliki izin menghapus utas ini' });

    const { error } = await supabaseAdmin.from('threads').delete().eq('id', id);
    if (error) throw error;

    if (thread.parent_id) {
        const { data: parent } = await supabaseAdmin.from('threads').select('replies_count').eq('id', thread.parent_id).single();
        if (parent) {
           await supabaseAdmin.from('threads').update({ replies_count: Math.max(0, parent.replies_count - 1) }).eq('id', thread.parent_id);
        }
    }

    if (thread.quoted_thread_id) {
        const { data: quoted } = await supabaseAdmin.from('threads').select('reposts_count').eq('id', thread.quoted_thread_id).single();
        if (quoted) {
           await supabaseAdmin.from('threads').update({ reposts_count: Math.max(0, quoted.reposts_count - 1) }).eq('id', thread.quoted_thread_id);
        }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
