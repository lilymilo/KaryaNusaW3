import { supabase } from '../config/supabaseClient.js';

export const getShopDetails = async (req, res) => {
  try {
    const { username: rawUsername } = req.params;
    if (!rawUsername) return res.status(400).json({ error: "Identifier required" });

    const identifier = decodeURIComponent(rawUsername).trim();
    let profile = null;

    // 1. Cek apakah identifier adalah UUID (ID Profil)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      const { data: byId } = await supabase.from('profiles').select('*').eq('id', identifier).maybeSingle();
      profile = byId;
    }

    // 2. Cek berdasarkan username
    if (!profile) {
      const { data: byUsername } = await supabase.from('profiles').select('*').ilike('username', identifier).maybeSingle();
      profile = byUsername;
    }

    // 3. Fallback: shop_name atau full_name
    if (!profile) {
      const { data: byShopName } = await supabase.from('profiles').select('*').ilike('shop_name', identifier).maybeSingle();
      profile = byShopName;
      
      if (!profile) {
        const { data: byFullName } = await supabase.from('profiles').select('*').ilike('full_name', identifier).maybeSingle();
        profile = byFullName;
      }
    }

    if (!profile) {
      console.warn(`Profile not found for identifier: "${identifier}"`);
      return res.status(404).json({ error: `Profil "${identifier}" tidak ditemukan` });
    }

    return await fetchProducts(profile, res);

  } catch (error) {
    console.error('getShopDetails Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const searchShops = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const searchTerm = `%${q}%`;
    const { data: shops, error } = await supabase
      .from('profiles')
      .select('id, username, shop_name, full_name, avatar, shop_logo_url, role')
      .or(`username.ilike.${searchTerm},shop_name.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
      .limit(10);

    if (error) throw error;
    res.json(shops || []);
  } catch (error) {
    console.error('searchShops Error:', error);
    res.status(500).json({ error: 'Gagal mencari toko/kreator' });
  }
};

async function fetchProducts(profile, res) {
  try {
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*, profiles(username, shop_name, full_name, avatar)')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (productError) throw productError;

    res.json({
      shop: profile,
      products: products || []
    });
  } catch (err) {
    res.json({
      shop: profile,
      products: []
    });
  }
}
