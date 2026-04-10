import { supabase, getAuthClient } from '../config/supabaseClient.js';

// 1. GET all products with Filtering
export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query;
    let query = supabase.from('products').select('*, product_ratings(*), profiles(shop_name, full_name)');

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (minPrice) {
      query = query.gte('price', Number(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', Number(maxPrice));
    }

    if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('avg_rating', { ascending: false });
    else if (sort === 'popular') query = query.order('sold', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. GET single product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*, product_ratings(*), profiles(shop_name, full_name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: "Produk tidak ditemukan" });
  }
};

// 3. Add product (with Image Upload)
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: "Nama dan harga produk wajib diisi" });
    }

    let imageUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400';
    let imagesArr = [];

    const authSupabase = getAuthClient(req);

    // Handle Upload to Supabase Storage
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `${req.user.id}/${fileName}`;

        const { error: uploadError } = await authSupabase.storage
          .from('products')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (uploadError) throw new Error(`Gagal mengupload gambar: ${uploadError.message}`);

        const { data: { publicUrl } } = authSupabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        imagesArr.push(publicUrl);
      }
      imageUrl = imagesArr[0];
    }

    // Get seller profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, shop_name, role')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    if (profile?.role !== 'seller') {
      return res.status(403).json({ error: "Hanya akun Penjual yang diizinkan menambah produk. Pastikan profil Anda sudah diubah menjadi Penjual." });
    }

    const { data, error } = await authSupabase
      .from('products')
      .insert([{ 
        seller_id: req.user.id,
        seller_name: profile?.shop_name || profile?.full_name || 'Seller',
        name, 
        price: Number(price), 
        description: description || '',
        category: category || 'Other',
        stock: Number(stock) || 0,
        image: imageUrl,
        images: imagesArr
      }])
      .select();

    if (error) {
      console.error("Supabase Product Insert Error:", error);
      throw error;
    }
    
    res.status(201).json({ message: "Produk berhasil dibuat", data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Update Product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, stock } = req.body;
    
    let updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = Number(price);
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = Number(stock);

    const authSupabase = getAuthClient(req);

    if (req.files && req.files.length > 0) {
      let imagesArr = [];
      for (const file of req.files) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `${req.user.id}/${fileName}`;

        const { error: uploadError } = await authSupabase.storage
          .from('products')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (uploadError) throw new Error(`Gagal mengupload gambar baru: ${uploadError.message}`);

        const { data: { publicUrl } } = authSupabase.storage
          .from('products')
          .getPublicUrl(filePath);
        
        imagesArr.push(publicUrl);
      }
      updateData.image = imagesArr[0];
      updateData.images = imagesArr;
    }

    const { data, error } = await authSupabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('seller_id', req.user.id) // Ensure only owner can update
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: "Produk tidak ditemukan atau Anda tidak memiliki akses" });
    }

    res.json({ message: "Produk berhasil diupdate", data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. DELETE product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const authSupabase = getAuthClient(req);
    
    // Gunakan select untuk memastikan ada produk yang terpengaruh
    const { data, error } = await authSupabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('seller_id', req.user.id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(403).json({ error: "Produk tidak ditemukan atau bukan milik Anda" });
    }
    
    res.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Add Rating
export const addRating = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { score, comment } = req.body;
    const authSupabase = getAuthClient(req);

    // Get profile
    const { data: profile } = await authSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', req.user.id)
      .single();

    const { error: ratingError } = await authSupabase
      .from('product_ratings')
      .insert([{
        product_id,
        user_id: req.user.id,
        user_name: profile?.full_name || 'Buyer',
        score: Number(score),
        comment
      }]);

    if (ratingError) throw ratingError;

    // Re-calculate avg rating
    const { data: ratings } = await authSupabase
      .from('product_ratings')
      .select('score')
      .eq('product_id', product_id);
    
    const avgRating = ratings.reduce((s, r) => s + r.score, 0) / ratings.length;

    await authSupabase
      .from('products')
      .update({ avg_rating: avgRating })
      .eq('id', product_id);

    res.json({ message: "Rating berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};