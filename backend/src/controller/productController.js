import { supabase, getAuthClient } from '../config/supabaseClient.js';
import { mintNFT, isNFTEnabled } from '../services/nftService.js';

export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query;
    let query = supabase.from('products').select('*, product_ratings(*), profiles(shop_name, full_name, wallet_address)');

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
    if (error) {
      console.error("Fetch Products Error:", error.message);
      throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil daftar produk. Silakan coba lagi nanti." });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*, product_ratings(*), profiles(shop_name, full_name, wallet_address)')
      .eq('id', id)
      .single();

    if (error) {
       console.error("Fetch Product Detail Error:", error.message);
       throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(404).json({ error: "Produk tidak ditemukan atau link sudah kedaluwarsa." });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: "Nama dan harga produk wajib diisi" });
    }

    let imageUrl = null;
    let imagesArr = [];

    const authSupabase = getAuthClient(req);

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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, shop_name, role, wallet_address')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
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

    const product = data[0];

    let nftResult = null;
    if (isNFTEnabled()) {
      try {
        const metadata = {
          name: product.name,
          description: product.description || '',
          image: imageUrl,
          external_url: `https://karyanusa.com/product/${product.id}`,
          attributes: [
            { trait_type: 'Category', value: product.category || 'Other' },
            { trait_type: 'Price IDR', value: product.price },
            { trait_type: 'Seller', value: profile?.shop_name || profile?.full_name || 'Seller' },
            { trait_type: 'Created', value: new Date().toISOString() }
          ]
        };

        const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
        const metadataPath = `nft-metadata/${product.id}.json`;
        
        await authSupabase.storage
          .from('products')
          .upload(metadataPath, metadataBuffer, {
            contentType: 'application/json',
            upsert: true
          });

        const { data: { publicUrl: metadataURI } } = authSupabase.storage
          .from('products')
          .getPublicUrl(metadataPath);

        const mintToAddress = profile?.wallet_address || process.env.MERCHANT_ETH_ADDRESS;
        
        if (mintToAddress) {
          nftResult = await mintNFT(mintToAddress, metadataURI);

          if (nftResult) {
            await authSupabase
              .from('products')
              .update({
                token_id: nftResult.tokenId,
                nft_tx_hash: nftResult.txHash,
                nft_contract_address: nftResult.contractAddress,
                metadata_uri: metadataURI
              })
              .eq('id', product.id);

            product.token_id = nftResult.tokenId;
            product.nft_tx_hash = nftResult.txHash;
            product.nft_contract_address = nftResult.contractAddress;
            product.metadata_uri = metadataURI;
          }
        }
      } catch (nftError) {
        console.error('NFT minting failed (non-critical):', nftError.message);
      }
    }
    
    res.status(201).json({ 
      message: nftResult 
        ? "Produk berhasil dibuat & NFT diminting!" 
        : "Produk berhasil dibuat",
      data: product,
      nft: nftResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, stock, existing_images } = req.body;
    
    let updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = Number(price);
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = Number(stock);

    let oldImages = [];
    if (existing_images) {
      try {
        oldImages = JSON.parse(existing_images);
      } catch (e) {
        console.error("Failed to parse existing_images", e);
      }
    }

    const authSupabase = getAuthClient(req);

    if (req.files && req.files.length > 0) {
      let imagesArr = [...oldImages];
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
    } else if (existing_images) {
      updateData.image = oldImages[0] || null;
      updateData.images = oldImages;
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

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const authSupabase = getAuthClient(req);
    
    // 1. Cek apakah produk memiliki riwayat pesanan (Order history)
    // Jika ada pesanan, produk tidak boleh dihapus secara permanen demi integritas data
    const { data: orders, error: orderError } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (orderError) throw orderError;
    if (orders && orders.length > 0) {
      return res.status(400).json({ 
        error: "Produk tidak bisa dihapus karena sudah memiliki riwayat pesanan. Silakan ubah stok menjadi 0 jika Anda ingin menghentikan penjualan produk ini." 
      });
    }

    // 2. Jika tidak ada pesanan, bersihkan referensi di tabel lain (transient data)
    // Gunakan supabaseAdmin untuk memastikan kita punya izin menghapus record dari user lain (misal: cart orang lain)
    
    // Hapus dari Wishlist
    await supabaseAdmin.from('wishlist').delete().eq('product_id', id);
    
    // Hapus dari Keranjang (Cart)
    await supabaseAdmin.from('cart').delete().eq('product_id', id);
    
    // Hapus Rating/Reviews
    await supabaseAdmin.from('product_ratings').delete().eq('product_id', id);
    
    // Lepaskan tautan di Threads (set null)
    await supabaseAdmin.from('threads').update({ linked_product_id: null }).eq('linked_product_id', id);

    // 3. Akhirnya hapus produk utama
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
    
    res.json({ message: "Produk berhasil dihapus permanen" });
  } catch (error) {
    console.error("Delete Product Error:", error.message);
    res.status(500).json({ error: "Gagal menghapus produk: " + error.message });
  }
};

export const addRating = async (req, res) => {
  try {
    const { id: product_id } = req.params;
    const { score, comment } = req.body;
    const authSupabase = getAuthClient(req);

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