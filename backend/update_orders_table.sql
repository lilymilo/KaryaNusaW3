-- Menambah kolom untuk mendukung pengiriman produk digital dan pembayaran
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
