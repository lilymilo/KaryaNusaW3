-- Skrip untuk menambahkan dukungan beberapa gambar untuk produk
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
