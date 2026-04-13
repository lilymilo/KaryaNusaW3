import { supabase, supabaseAdmin, getAuthClient } from '../config/supabaseClient.js';

export const toggleFollow = async (req, res) => {
  try {
    const { target_id } = req.params;
    const follower_id = req.user.id;

    if (target_id === follower_id) {
      return res.status(400).json({ error: 'Tidak dapat follow diri sendiri.' });
    }

    const adminClient = supabaseAdmin || getAuthClient(req);
    
    // Check if following exists - force count first to be sure
    const { data: existingFollow } = await adminClient.from('follows')
      .select('*')
      .eq('follower_id', follower_id)
      .eq('following_id', target_id)
      .maybeSingle();

    if (existingFollow) {
      // DELETE
      const { error: unfollowError } = await adminClient.from('follows')
        .delete()
        .eq('follower_id', follower_id)
        .eq('following_id', target_id);
      
      if (unfollowError) throw unfollowError;
      return res.json({ message: 'Berhasil berhenti mengikuti', isFollowing: false });
    } else {
      // INSERT
      const { error: followError } = await adminClient.from('follows')
        .insert([{ follower_id, following_id: target_id }]);
      
      if (followError) {
        // If it still fails with duplicate, it means it exists but select missed it - so delete it instead (toggle)
        if (followError.code === '23505') {
           await adminClient.from('follows')
            .delete()
            .eq('follower_id', follower_id)
            .eq('following_id', target_id);
           return res.json({ message: 'Berhasil berhenti mengikuti', isFollowing: false });
        }
        throw followError;
      }
      return res.json({ message: 'Berhasil mengikuti', isFollowing: true });
    }
  } catch (error) {
    console.error('toggleFollow Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem.' });
  }
};

export const checkFollowStatus = async (req, res) => {
  try {
    const { target_id } = req.params;
    if (!req.user) return res.json({ isFollowing: false });
    
    const follower_id = req.user.id;
    const adminClient = supabaseAdmin || getAuthClient(req);
    const { data: follow } = await adminClient.from('follows')
      .select('*')
      .eq('follower_id', follower_id)
      .eq('following_id', target_id)
      .maybeSingle();

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('checkFollowStatus Error:', error);
    res.json({ isFollowing: false });
  }
};

export const getFollowStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const client = supabaseAdmin || (req.user ? getAuthClient(req) : supabase);
    
    const { count: followersCount, error: followersError } = await client.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
      
    const { count: followingCount, error: followingError } = await client.from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (followersError || followingError) {
      console.error('getFollowStats DB error:', followersError || followingError);
      throw new Error('Database count error');
    }

    res.json({ followers: followersCount || 0, following: followingCount || 0 });
  } catch (error) {
    console.error('getFollowStats Error:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik pengikut.' });
  }
};

export const addReview = async (req, res) => {
  try {
    const { target_id } = req.params;
    const reviewer_id = req.user.id;
    const { rating, comment } = req.body;

    if (target_id === reviewer_id) {
      return res.status(400).json({ error: 'Tidak dapat mereview toko sendiri.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating harus antara 1 dan 5.' });
    }

    const { error: upsertError } = await (supabaseAdmin || getAuthClient(req)).from('reviews')
      .upsert(
        { reviewer_id, target_id, rating, comment: comment || null },
        { onConflict: 'reviewer_id, target_id' }
      );

    if (upsertError) throw upsertError;
    res.json({ message: 'Ulasan berhasil disimpan.' });
  } catch (error) {
    console.error('addReview Error:', error);
    res.status(500).json({ error: 'Gagal menyimpan ulasan.' });
  }
};

export const getReviews = async (req, res) => {
  try {
    const { target_id } = req.params;
    
    // Selalu gunakan admin client untuk bypass RLS
    const client = supabaseAdmin || supabase;
    
    const { data: reviews, error } = await client.from('reviews')
      .select(`
        id, rating, comment, created_at,
        reviewer:profiles!reviewer_id(id, full_name, username, avatar)
      `)
      .eq('target_id', target_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getReviews] Supabase error:', error);
      throw error;
    }

    console.log(`[getReviews] target_id=${target_id}, found=${reviews?.length || 0}`);

    const totalRating = (reviews || []).reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews && reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    res.json({
      reviews: reviews || [],
      stats: {
        total: (reviews || []).length,
        average: parseFloat(averageRating)
      }
    });
  } catch (error) {
    console.error('[getReviews] Error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar ulasan.' });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const client = supabaseAdmin || (req.user ? getAuthClient(req) : supabase);
    const { data: list, error } = await client.from('follows')
      .select(`
        follower:profiles!follower_id(id, full_name, username, avatar)
      `)
      .eq('following_id', userId);

    if (error) throw error;
    res.json(list.map(f => f.follower));
  } catch (error) {
    console.error('getFollowers Error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar pengikut.' });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const client = supabaseAdmin || (req.user ? getAuthClient(req) : supabase);
    const { data: list, error } = await client.from('follows')
      .select(`
        following:profiles!following_id(id, full_name, username, avatar)
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    res.json(list.map(f => f.following));
  } catch (error) {
    console.error('getFollowing Error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar mengikuti.' });
  }
};
