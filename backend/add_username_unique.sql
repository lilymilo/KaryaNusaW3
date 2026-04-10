-- Menambahkan constraint UNIQUE pada kolom username di tabel profiles
-- agar setiap toko memiliki identitas unik di URL
ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
