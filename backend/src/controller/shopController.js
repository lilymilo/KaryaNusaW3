import { supabase } from '../config/supabaseClient.js';

export const getShopDetails = async (req, res) => {
  try {
    const { username: rawUsername } = req.params;
    if (!rawUsername) return res.status(400).json({ error: "Identifier required" });

    const identifier = decodeURIComponent(rawUsername).trim();

    // 1. Fetch profile by different possible identifiers (CASE INSENSITIVE where possible)
    let profile = null;

    // A. By Username (Primary)
    const { data: byUsername } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', identifier)
      .maybeSingle();
    profile = byUsername;

    // B. By Shop Name
    if (!profile) {
      const { data: byShopName } = await supabase
        .from('profiles')
        .select('*')
        .ilike('shop_name', identifier)
        .maybeSingle();
      profile = byShopName;
    }

    // C. By Full Name
    if (!profile) {
      const { data: byFullName } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', identifier)
        .maybeSingle();
      profile = byFullName;
    }

    // D. By ID (Direct Lookup)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (!profile && isUuid) {
      const { data: byId } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', identifier)
        .maybeSingle();
      profile = byId;
    }

    if (!profile) {
      console.error(`Profile not found for identifier: "${identifier}"`);
      return res.status(404).json({ error: `Profil "${identifier}" tidak ditemukan` });
    }

    return await fetchProducts(profile, res);

  } catch (error) {
    console.error('getShopDetails Error:', error);
    res.status(500).json({ error: error.message });
  }
};

async function fetchProducts(profile, res) {
  try {
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*, profiles(shop_name, full_name, avatar)')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (productError) throw productError;

    res.json({
      shop: profile,
      products: products || []
    });
  } catch (err) {
    // If fetching products fails (e.g. table doesn't exist yet but unlikely), still return the shop
    res.json({
      shop: profile,
      products: []
    });
  }
}
