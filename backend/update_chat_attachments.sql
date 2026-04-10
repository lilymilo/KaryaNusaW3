-- 1. Menambahkan kolom lampiran ke tabel messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT; -- 'image' atau 'file'

-- 2. Membuat Bucket Storage 'chat-attachments' jika belum ada
-- Catatan: SQL di Supabase tidak selalu bisa membuat bucket secara langsung tergantung ekstensi, 
-- namun script berikut mencoba mendaftarkannya ke tabel storage.objects.
-- Jika gagal, silakan buat manual melalui Dashboard: Storage -> New Bucket -> 'chat-attachments' (Public).

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Kebijakan Storage (RLS) untuk Bucket 'chat-attachments'
-- Supaya user bisa upload ke folder mereka sendiri
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');
