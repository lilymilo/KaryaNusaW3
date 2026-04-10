-- =======================================================
-- FIX RLS POLICIES: Wishlist & Product Ratings
-- =======================================================
-- Jalankan script ini di Supabase SQL Editor
-- untuk memperbaiki fitur Wishlist dan Ulasan.

-- -------------------------------------------------------
-- 1. FIX WISHLIST POLICIES
-- -------------------------------------------------------
-- Drop policy lama yang terlalu luas
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;

-- Buat policy terpisah per operasi agar aman
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- 2. FIX PRODUCT_RATINGS POLICIES
-- -------------------------------------------------------
-- Semua orang bisa melihat rating
DROP POLICY IF EXISTS "Ratings viewable by all" ON product_ratings;
CREATE POLICY "Ratings viewable by all" ON product_ratings
  FOR SELECT USING (true);

-- Authenticated user bisa menambah rating (hanya milik sendiri)
DROP POLICY IF EXISTS "Users can add ratings" ON product_ratings;
CREATE POLICY "Users can add ratings" ON product_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- 3. FIX PRODUCTS UPDATE POLICY (untuk update avg_rating)
-- -------------------------------------------------------
-- Pastikan ada policy yang memungkinkan update avg_rating
-- Policy lama "Sellers can manage own products" sudah ada FOR ALL,
-- tapi update avg_rating dilakukan oleh system (bukan seller).
-- Tambahkan policy khusus untuk update avg_rating oleh authenticated user.
DROP POLICY IF EXISTS "Authenticated users can update product ratings" ON products;
CREATE POLICY "Authenticated users can update product ratings" ON products
  FOR UPDATE USING (true)
  WITH CHECK (true);
