<p align="center">
  <h1 align="center">🇮🇩 KaryaNusa</h1>
  <p align="center">
    <strong>Marketplace Karya Digital Nusantara dengan Integrasi Web3</strong>
  </p>
  <p align="center">
    Platform e-commerce sosial untuk produk kreatif digital Indonesia — dilengkapi autentikasi crypto wallet, pembayaran ETH, NFT product minting, social feed, dan real-time chat.
  </p>
</p>

---

## 📖 Deskripsi Singkat

**KaryaNusa** adalah marketplace full-stack yang menghubungkan kreator digital Indonesia dengan pembeli, menggabungkan fitur e-commerce tradisional dengan teknologi Web3 (blockchain). Platform ini dibangun menggunakan **React + Vite** di frontend dan **Express.js + Supabase** di backend.

### ✨ Fitur Utama

| Kategori | Fitur |
|---|---|
| **🛒 Marketplace** | Buat, edit, hapus produk · Pencarian & filter · Keranjang belanja · Checkout & order tracking |
| **🔐 Autentikasi** | Register/Login email · Login via MetaMask wallet · Link wallet ke akun existing |
| **💰 Pembayaran** | Transfer ETH (Sepolia testnet / Hardhat local) · Status pembayaran real-time |
| **🎨 NFT** | Mint produk sebagai ERC-721 NFT · Transfer kepemilikan saat pembelian · Smart contract KaryaNusaNFT |
| **🌐 Sosial** | Social feed (threads) · Quote & reply · Follow/unfollow · Profil publik toko |
| **💬 Chat** | Real-time messaging antar pengguna · Attachment support · Typing indicator |
| **❤️ Wishlist** | Simpan produk favorit · Sinkronisasi lintas halaman |
| **🌙 UI/UX** | Dark/Light mode · Responsive design · Lazy loading · Micro-animations |

### 🏗️ Arsitektur

```
KaryaNusa/
├── frontend/          # React 19 + Vite 8 + TailwindCSS 4
├── backend/           # Express 5 + Supabase (PostgreSQL + Auth + Storage)
└── localchain/        # Hardhat local blockchain (untuk development)
```

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, Vite 8, TailwindCSS 4, React Router 7, Lucide Icons, react-hot-toast |
| **Backend** | Node.js, Express 5, Supabase JS SDK, Multer (upload), ethers.js 6 |
| **Database** | Supabase (PostgreSQL) — Auth, Database, Storage, RLS |
| **Blockchain** | Solidity 0.8.24, Hardhat, ethers.js 6, ERC-721 (OpenZeppelin) |
| **Wallet** | MetaMask (EVM) |

---

## ⚙️ Petunjuk Setup Environment

### Prasyarat (Prerequisites)

Pastikan sudah terinstall di komputer Anda:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x (biasanya sudah bundled dengan Node.js)
- **Git** — [Download](https://git-scm.com/)
- **MetaMask** browser extension (opsional, untuk fitur Web3) — [Install](https://metamask.io/)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/bagus155/Karyanusa.git
cd Karyanusa
```

### 2️⃣ Setup Supabase

Proyek ini menggunakan [Supabase](https://supabase.com/) sebagai backend-as-a-service. Anda perlu:

1. Buat akun gratis di [supabase.com](https://supabase.com/)
2. Buat **New Project**
3. Dari **Settings → API**, salin:
   - `Project URL` → untuk `SUPABASE_URL`
   - `anon public` key → untuk `SUPABASE_ANON_KEY`
   - `service_role` key → untuk `SUPABASE_SERVICE_ROLE_KEY`

4. Buat tabel-tabel berikut di **SQL Editor** Supabase:

<details>
<summary>📄 Klik untuk melihat SQL Schema</summary>

```sql
-- Tabel Profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  phone_number TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'seller',
  shop_name TEXT DEFAULT 'Personal Shop',
  shop_description TEXT,
  shop_address TEXT,
  shop_contact TEXT,
  shop_logo_url TEXT,
  shop_banner_url TEXT,
  wallet_address TEXT UNIQUE,
  custom_password TEXT,
  balance DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  category TEXT,
  images TEXT[],
  stock INTEGER DEFAULT 0,
  nft_token_id INTEGER,
  nft_tx_hash TEXT,
  nft_contract_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  tx_hash TEXT,
  buyer_address TEXT,
  buyer_location JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Cart
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Tabel Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Tabel Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  message TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Threads (Social Feed)
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[],
  product_id UUID REFERENCES products(id),
  parent_id UUID REFERENCES threads(id),
  quoted_thread_id UUID REFERENCES threads(id),
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Thread Likes
CREATE TABLE IF NOT EXISTS thread_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Tabel Follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Storage Buckets (jalankan di SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('shops', 'shops', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT DO NOTHING;

-- RLS Policies (permit all untuk development — sesuaikan untuk production)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Contoh policy (baca publik, tulis oleh pemilik)
CREATE POLICY "Public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Owner update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public read" ON products FOR SELECT USING (true);
CREATE POLICY "Seller manage" ON products FOR ALL USING (auth.uid() = seller_id);
```

</details>

5. Buat **Storage Buckets**: `products`, `avatars`, `shops`, `chat-attachments` — set sebagai **public**.

### 3️⃣ Konfigurasi Environment Variables

#### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` dan isi dengan kredensial Supabase Anda:

```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
PORT=5003
MERCHANT_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

#### Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5003/api
VITE_API_PROXY=http://localhost:5003
VITE_MERCHANT_ETH_ADDRESS=0xYOUR_MERCHANT_WALLET_ADDRESS
VITE_USE_LOCALNET=true
```

### 4️⃣ Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# (Opsional) Install local blockchain dependencies
cd ../localchain
npm install
```

---

## 🔗 Tautan Model ML / Smart Contract

### Smart Contract — KaryaNusaNFT (ERC-721)

Proyek ini menggunakan smart contract Solidity untuk fitur NFT. File kontrak tersedia di:

| File | Deskripsi |
|---|---|
| [`backend/contracts/KaryaNusaNFT.sol`](backend/contracts/KaryaNusaNFT.sol) | Source code Solidity (ERC-721 + URIStorage + Ownable) |
| [`backend/contracts/KaryaNusaNFT.json`](backend/contracts/KaryaNusaNFT.json) | ABI hasil compile (digunakan oleh backend) |

#### Cara Deploy Smart Contract (Opsional)

Jika Anda ingin menggunakan fitur NFT minting:

1. **Jalankan Hardhat local node:**
   ```bash
   cd localchain
   npx hardhat node
   ```

2. **Deploy contract** menggunakan Hardhat atau Remix IDE ke:
   - **Local**: Hardhat Network (`chainId: 31337`, RPC: `http://127.0.0.1:8545`)
   - **Testnet**: Sepolia (`chainId: 11155111`)

3. **Set environment variables** setelah deploy:
   ```env
   # Di backend/.env (tambahkan jika ingin menggunakan NFT)
   SEPOLIA_RPC_URL=http://127.0.0.1:8545          # atau https://rpc.sepolia.org
   PLATFORM_WALLET_PRIVATE_KEY=0xYOUR_KEY_HERE
   NFT_CONTRACT_ADDRESS=0xDEPLOYED_ADDRESS_HERE
   ```

> **Catatan:** Fitur NFT bersifat opsional. Aplikasi tetap berjalan normal tanpa konfigurasi blockchain. Ketika environment variable blockchain tidak diset, fitur minting/transfer NFT akan di-skip secara otomatis.

---

## 🚀 Cara Menjalankan Aplikasi

### Mode Development (Lokal)

Buka **2 terminal** terpisah:

#### Terminal 1 — Backend (port 5003)

```bash
cd backend
npm run dev
```

Output yang diharapkan:
```
========================================
 KaryaNusa Backend is RUNNING
 URL: http://localhost:5003
 Environment: development
========================================
```

#### Terminal 2 — Frontend (port 5173)

```bash
cd frontend
npm run dev
```

Output yang diharapkan:
```
  VITE v8.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

#### (Opsional) Terminal 3 — Local Blockchain

Jika ingin menggunakan fitur pembayaran ETH lokal:

```bash
cd localchain
npx hardhat node
```

Ini akan menjalankan blockchain lokal di `http://127.0.0.1:8545` dengan 20 akun test yang masing-masing memiliki 10.000 ETH.

### 🌐 Akses Aplikasi

Buka browser dan kunjungi: **[http://localhost:5173](http://localhost:5173)**

### Alur Penggunaan

```
1. 📝 Register     →  Buat akun dengan email & password, atau connect MetaMask wallet
2. 👤 Setup Profil  →  Lengkapi username, nama toko, alamat, kontak WhatsApp
3. 🛍️ Jelajahi      →  Browse produk di homepage, cari & filter
4. ➕ Jual Produk   →  Buat listing produk baru (dengan opsional NFT minting)
5. 🛒 Beli Produk   →  Tambah ke keranjang → Checkout → Bayar (ETH atau konfirmasi manual)
6. 💬 Chat          →  Real-time messaging dengan penjual/pembeli
7. 📢 Social Feed   →  Buat thread, promosikan produk, like & reply
8. ❤️ Wishlist      →  Simpan produk favorit untuk nanti
```

### Health Check API

Untuk memastikan backend berjalan:

```bash
curl http://localhost:5003/api/health
```

Response:
```json
{
  "status": "ok",
  "database": "supabase",
  "timestamp": "2026-04-12T...",
  "env": "development"
}
```

---

## 📁 Struktur Proyek

```
KaryaNusa/
├── backend/
│   ├── contracts/                 # Smart contract Solidity + ABI
│   │   ├── KaryaNusaNFT.sol
│   │   └── KaryaNusaNFT.json
│   ├── src/
│   │   ├── config/
│   │   │   ├── loadEnv.js         # Environment variable loader
│   │   │   └── supabaseClient.js  # Supabase client (anon + admin + auth)
│   │   ├── controller/
│   │   │   ├── authController.js      # Register, Login, Wallet Auth, Profile
│   │   │   ├── productController.js   # CRUD produk + NFT minting
│   │   │   ├── orderController.js     # Checkout, order management, ETH payment
│   │   │   ├── cartController.js      # Keranjang belanja
│   │   │   ├── wishlistController.js  # Wishlist / favorit
│   │   │   ├── chatController.js      # Real-time messaging
│   │   │   ├── socialController.js    # Follow/unfollow, user search
│   │   │   ├── threadController.js    # Social feed threads
│   │   │   ├── shopController.js      # Halaman toko publik
│   │   │   └── statsController.js     # Dashboard statistik
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  # JWT token verification
│   │   ├── routes/                # Express route definitions
│   │   ├── services/
│   │   │   └── nftService.js      # NFT mint & transfer logic
│   │   └── server.js              # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js           # Axios instance + auth interceptor
│   │   │   └── supabaseClient.js  # Frontend Supabase client
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Navigation bar + search + notification
│   │   │   ├── ProductCard.jsx    # Card produk (wishlist, add to cart)
│   │   │   ├── ProductModal.jsx   # Detail produk modal
│   │   │   ├── CartDrawer.jsx     # Side drawer keranjang belanja
│   │   │   ├── FollowListModal.jsx
│   │   │   ├── ThemeToggle.jsx    # Toggle dark/light mode
│   │   │   └── icons/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Authentication state management
│   │   │   ├── CartContext.jsx    # Shopping cart state
│   │   │   ├── ThemeContext.jsx   # Dark/light theme
│   │   │   └── WalletContext.jsx  # MetaMask wallet connection
│   │   ├── hooks/
│   │   │   └── useScrollReveal.js # Scroll animation hook
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx    # Landing / hero page
│   │   │   ├── LoginPage.jsx      # Login (email + wallet)
│   │   │   ├── RegisterPage.jsx   # Registrasi akun baru
│   │   │   ├── HomePage.jsx       # Homepage produk + filter
│   │   │   ├── ProfilePage.jsx    # Profil & pengaturan toko
│   │   │   ├── ShopPage.jsx       # Halaman toko publik
│   │   │   ├── CreateProductPage.jsx
│   │   │   ├── EditProductPage.jsx
│   │   │   ├── CheckoutPage.jsx   # Checkout + pembayaran ETH
│   │   │   ├── OrdersPage.jsx     # Riwayat pesanan
│   │   │   ├── OrderSuccessPage.jsx
│   │   │   ├── ChatPage.jsx       # Real-time chat
│   │   │   ├── FeedPage.jsx       # Social feed
│   │   │   ├── ThreadDetailPage.jsx
│   │   │   └── QuotePage.jsx
│   │   ├── utils/
│   │   │   ├── evmProvider.js     # MetaMask provider detector
│   │   │   └── format.js          # Price/date formatting
│   │   ├── App.jsx                # Route definitions + providers
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── localchain/
│   ├── hardhat.config.js          # Hardhat network config (chainId: 31337)
│   └── package.json
│
├── vercel.json                    # Vercel deployment config
├── .gitignore
└── README.md
```

---

## 🔑 API Endpoints

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/register` | Registrasi user baru | ❌ |
| `POST` | `/api/auth/login` | Login (email/username/wallet) | ❌ |
| `POST` | `/api/auth/wallet-login` | Login via MetaMask signature | ❌ |
| `POST` | `/api/auth/link-wallet` | Hubungkan wallet ke akun | ✅ |
| `GET` | `/api/auth/profile` | Ambil data profil user | ✅ |
| `PUT` | `/api/auth/profile` | Update profil + upload avatar | ✅ |
| `PUT` | `/api/auth/set-password` | Set password untuk akun wallet | ✅ |
| `GET` | `/api/products` | Daftar semua produk | ❌ |
| `POST` | `/api/products` | Buat produk baru | ✅ |
| `PUT` | `/api/products/:id` | Edit produk | ✅ |
| `DELETE` | `/api/products/:id` | Hapus produk | ✅ |
| `POST` | `/api/orders` | Buat pesanan baru | ✅ |
| `GET` | `/api/orders` | Riwayat pesanan | ✅ |
| `GET` | `/api/cart` | Isi keranjang | ✅ |
| `POST` | `/api/cart` | Tambah ke keranjang | ✅ |
| `GET` | `/api/wishlist` | Daftar wishlist | ✅ |
| `POST` | `/api/wishlist/toggle` | Toggle wishlist | ✅ |
| `GET` | `/api/chat/conversations` | Daftar percakapan | ✅ |
| `GET` | `/api/chat/:userId` | Pesan dengan user tertentu | ✅ |
| `POST` | `/api/chat/send` | Kirim pesan | ✅ |
| `GET` | `/api/threads` | Social feed threads | ✅ |
| `POST` | `/api/threads` | Buat thread baru | ✅ |
| `GET` | `/api/social/search` | Cari user | ✅ |
| `POST` | `/api/social/follow` | Follow user | ✅ |
| `GET` | `/api/shop/:username` | Halaman toko publik | ❌ |
| `GET` | `/api/health` | Health check | ❌ |

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b fitur/FiturBaru`
3. Commit perubahan: `git commit -m 'Tambah fitur baru'`
4. Push ke branch: `git push origin fitur/FiturBaru`
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  Dibuat dengan ❤️ untuk Nusantara
</p>