-- =======================================================
-- SCRIPT PERBAIKAN PROFILE & PERIZINAN GOOGLE LOGIN
-- =======================================================
-- Kenapa gagal membuat produk?
-- 1. Untuk membuat produk, Anda WAJIB memiliki status "seller".
-- 2. Saat login memakai Akun Google, sistem gagal mendaftarkan
--    nama & data Anda ke tabel 'profiles' karena tidak ada instruksi otomatis, 
--    serta Anda tidak punya akses hak cipta (RLS) untuk insert.
--
-- CARA PENGGUNAAN:
-- Masuk ke Supabase Dashboard -> SQL Editor -> New Query.
-- Salin semua kode di bawah dan klik RUN.
-- =======================================================

-- 1. Tambahkan izin bagi setiap orang untuk menambahkan data profilnya sendiri 
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Memasukkan para pengguna yang sudah terlanjur login ke dalam tabel profiles
INSERT INTO public.profiles (id, email, full_name, shop_name, role)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User Google'), 
  'Toko ' || COALESCE(raw_user_meta_data->>'full_name', 'Misterius'),
  'buyer' -- Default jadi buyer sekarang
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Membuat fungsi Trigger otomatis
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, shop_name, phone_number, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'shop_name',
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    shop_name = EXCLUDED.shop_name,
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Pasangkan fungsinya
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Selesai! Anda bebas lanjut tambah produk sekarang!
