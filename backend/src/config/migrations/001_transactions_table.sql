-- ============================================================
-- KaryaNusa: Tabel Transactions untuk Payment Gateway (QRIS/Midtrans)
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tabel transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  midtrans_order_id TEXT UNIQUE NOT NULL,
  snap_token TEXT,
  snap_redirect_url TEXT,
  payment_type TEXT,
  gross_amount NUMERIC(15,2) NOT NULL,
  transaction_status TEXT DEFAULT 'pending',
  fraud_status TEXT,
  midtrans_transaction_id TEXT,
  settlement_time TIMESTAMPTZ,
  invoice_sent BOOLEAN DEFAULT FALSE,
  invoice_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_transactions_midtrans_order_id ON transactions(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 3. RLS (Row Level Security) — opsional tapi direkomendasikan
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- User hanya bisa lihat transaksi miliknya sendiri
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Insert hanya bisa dilakukan oleh user yang terautentikasi
CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role (backend webhook) bisa update semua transaksi
-- Ini otomatis berlaku karena service_role bypass RLS

-- 4. Grant akses
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON transactions TO service_role;
