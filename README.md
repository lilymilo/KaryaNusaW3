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
| **🛒 Marketplace** | Global unlimited availability model · Pencarian & filter · Keranjang belanja · Checkout |
| **🔐 Autentikasi** | One-click Wallet Connectivity · Register/Login email · Login via Google · Link wallet |
| **💰 Pembayaran** | Transfer ETH (Sepolia testnet / Hardhat local) · Status pembayaran real-time |
| **🎨 NFT** | Mint produk sebagai ERC-721 NFT · Transfer kepemilikan saat pembelian · Smart contract KaryaNusaNFT |
| **🌐 Sosial** | Social feed (threads) · Quote & reply · Follow/unfollow · Profil publik toko |
| **💬 Chat** | Real-time messaging antar pengguna · Attachment support |
| **❤️ Wishlist** | Simpan produk favorit · Sinkronisasi lintas halaman |
| **🌙 UI/UX** | High-density minimalist design · Dark/Light mode · Performa tinggi bebas lag & memory leaks |

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

## ⚙️ Petunjuk Setup & Instalasi (Step-by-Step)

> **📌 Panduan ini ditulis untuk pemula.** Ikuti setiap langkah secara berurutan. Jika Anda sudah berpengalaman, bisa langsung loncat ke [Quick Start](#-quick-start-untuk-yang-sudah-berpengalaman).

### Prasyarat (Prerequisites) — Software yang Harus Diinstall

Sebelum memulai, Anda perlu menginstall beberapa software berikut di komputer Anda:

#### 1. Node.js (WAJIB)

Node.js adalah runtime JavaScript yang dibutuhkan untuk menjalankan backend dan frontend.

- **Download:** [https://nodejs.org/](https://nodejs.org/)
- **Pilih versi:** `LTS` (Long Term Support) — versi ≥ 18.x
- **Cara install:**
  - **Windows:** Download `.msi` installer → double-click → ikuti wizard → Next → Next → Install
  - **Mac:** Download `.pkg` installer → double-click → ikuti wizard
  - **Linux (Ubuntu/Debian):**
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

- **Verifikasi instalasi:** Buka Terminal/Command Prompt, ketik:
  ```bash
  node --version
  # Output: v20.x.x (atau versi >= 18)

  npm --version
  # Output: 9.x.x atau lebih tinggi
  ```

#### 2. Git (WAJIB)

Git digunakan untuk mengunduh (clone) source code proyek ini.

- **Download:** [https://git-scm.com/downloads](https://git-scm.com/downloads)
- **Cara install:**
  - **Windows:** Download installer → jalankan → gunakan pengaturan default (Next → Next → Install)
  - **Mac:** Biasanya sudah terinstall. Jika belum: `xcode-select --install`
  - **Linux:** `sudo apt-get install git`

- **Verifikasi:**
  ```bash
  git --version
  # Output: git version 2.x.x
  ```

#### 3. MetaMask Browser Extension (WAJIB untuk fitur Wallet & Crypto)

MetaMask adalah extension browser untuk mengelola crypto wallet.

- **Install:** Buka [https://metamask.io/download/](https://metamask.io/download/) di browser Chrome/Firefox/Brave
- Klik **"Install MetaMask for Chrome"** (atau browser Anda)
- Ikuti proses setup: buat wallet baru → simpan **Secret Recovery Phrase** dengan aman
- Setelah install, ikon MetaMask (🦊) akan muncul di toolbar browser

> ⚠️ **PENTING:** MetaMask **wajib diinstall** untuk menguji fitur login wallet dan pembayaran ETH. Tanpa MetaMask, fitur Web3 tidak bisa digunakan.

#### 4. Code Editor (OPSIONAL tapi disarankan)

- **Visual Studio Code** (gratis): [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Berguna untuk membuka dan mengedit file proyek

---

### 🚀 Langkah 1 — Clone (Download) Repository

Buka **Terminal** (Mac/Linux) atau **Command Prompt / PowerShell** (Windows), lalu ketik:

```bash
git clone https://github.com/bagus155/Karyanusa.git
cd Karyanusa
```

> 💡 **Alternatif tanpa Git:** Anda juga bisa download sebagai ZIP dari GitHub → klik tombol hijau **"Code"** → **"Download ZIP"** → extract ke folder pilihan Anda.

Setelah berhasil, Anda akan memiliki folder `Karyanusa/` dengan struktur:
```
Karyanusa/
├── backend/       ← Server API
├── frontend/      ← Website React
├── localchain/    ← Blockchain lokal untuk testing
└── README.md      ← File ini
```

---

### 🚀 Langkah 2 — Konfigurasi Environment Variables

> **📌 Database sudah tersedia!** Proyek ini menggunakan database Supabase bersama (shared). Anda **TIDAK PERLU** membuat project Supabase sendiri. Semua kredensial sudah terisi otomatis di file `.env.example`.

Cukup **salin** file `.env.example` menjadi `.env`:

**Di Terminal (Mac/Linux):**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Di Command Prompt (Windows):**
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

**Di PowerShell (Windows):**
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

> ✅ **Tidak perlu mengedit apa-apa!** Semua konfigurasi sudah siap pakai. Langsung lanjut ke langkah berikutnya.

---

### 🚀 Langkah 3 — Install Dependencies (Library yang Dibutuhkan)

Masih di Terminal, jalankan perintah berikut **satu per satu**:

```bash
# 1. Masuk ke folder backend dan install dependencies-nya
cd backend
npm install

# 2. Masuk ke folder frontend dan install dependencies-nya
cd ../frontend
npm install

# 3. Masuk ke folder localchain dan install dependencies-nya
cd ../localchain
npm install

# 4. Kembali ke folder utama
cd ..
```

> ⏰ **Estimasi waktu:** Proses `npm install` bisa memakan waktu 1-3 menit per folder (tergantung koneksi internet). Tunggu sampai selesai tanpa error.

> ⚠️ **Jika ada error `EACCES permission denied` (Linux/Mac):**
> ```bash
> sudo npm install
> ```

> ⚠️ **Jika ada error `node-gyp` atau `python not found` (Windows):**
> Jalankan di Command Prompt sebagai Administrator:
> ```cmd
> npm install --global windows-build-tools
> ```

---

### 🚀 Langkah 4 — Jalankan Aplikasi

Anda perlu membuka **3 terminal terpisah** dan menjalankan perintah di masing-masing terminal:

#### Terminal 1 — Jalankan Local Blockchain (Hardhat)

```bash
cd localchain
npx hardhat node
```

**Output yang diharapkan:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
... (20 akun total)
```

> ⚡ **Biarkan terminal ini tetap terbuka!** Jangan ditutup selama Anda menggunakan aplikasi.

#### Terminal 2 — Jalankan Backend Server

Buka terminal **baru**, lalu:

```bash
cd backend
npm run dev
```

**Output yang diharapkan:**
```
========================================
 KaryaNusa Backend is RUNNING
 URL: http://localhost:5003
 Environment: development
========================================
```

#### Terminal 3 — Jalankan Frontend

Buka terminal **baru** lagi, lalu:

```bash
cd frontend
npm run dev
```

**Output yang diharapkan:**
```
  VITE v8.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

---

### 🚀 Langkah 5 — Buka di Browser

Buka browser (Chrome/Firefox/Brave) dan kunjungi:

### 👉 **[http://localhost:5173](http://localhost:5173)**

Anda akan melihat **Landing Page** KaryaNusa. 🎉

---

## ⚡ Quick Start (Untuk yang Sudah Berpengalaman)

```bash
# Clone & setup
git clone https://github.com/bagus155/Karyanusa.git
cd Karyanusa
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Install semua dependencies
cd backend && npm install && cd ../frontend && npm install && cd ../localchain && npm install && cd ..

# Jalankan (buka 3 terminal terpisah)
# Terminal 1: cd localchain && npx hardhat node
# Terminal 2: cd backend && npm run dev
# Terminal 3: cd frontend && npm run dev

# Buka http://localhost:5173
```

---

## 🦊 Panduan Setup MetaMask & Wallet Testing

MetaMask diperlukan untuk menguji fitur **login via wallet** dan **pembayaran menggunakan ETH**. Ikuti langkah-langkah berikut:

### Langkah 1 — Pastikan Hardhat Node Sudah Berjalan

Pastikan Terminal 1 dari [Langkah 4](#-langkah-4--jalankan-aplikasi) masih berjalan (`npx hardhat node`). Jika belum, jalankan kembali:

```bash
cd localchain
npx hardhat node
```

### Langkah 2 — Tambahkan Jaringan Hardhat ke MetaMask

MetaMask secara default terhubung ke Ethereum Mainnet. Anda perlu menambahkan jaringan lokal Hardhat:

1. Klik ikon MetaMask (🦊) di toolbar browser
2. Klik **dropdown jaringan** di bagian atas (biasanya tertulis "Ethereum Mainnet")
3. Klik **"Add Network"** atau **"Tambah Jaringan"**
4. Klik **"Add a network manually"** atau **"Tambahkan jaringan secara manual"**
5. Isi form dengan data berikut:

   | Field | Nilai yang Diisi |
   |---|---|
   | **Network Name** | `Hardhat Local` |
   | **New RPC URL** | `http://127.0.0.1:8545` |
   | **Chain ID** | `31337` |
   | **Currency Symbol** | `ETH` |
   | **Block Explorer URL** | *(kosongkan)* |

6. Klik **"Save"** / **"Simpan"**
7. **PASTIKAN** jaringan **"Hardhat Local"** yang aktif/terpilih (bukan Ethereum Mainnet!)

### Langkah 3 — Import Akun Test ke MetaMask

Hardhat menyediakan akun-akun test yang sudah terisi 10.000 ETH masing-masing. Anda perlu meng-import salah satu akun test ini ke MetaMask:

1. Klik ikon MetaMask → klik **ikon akun/avatar** (lingkaran di kanan atas)
2. Klik **"Import Account"** atau **"Impor Akun"**
3. Pada dropdown **"Select Type"**, pilih **"Private Key"**
4. **Copy-paste** salah satu private key di bawah ini ke field yang tersedia:

---

**🛒 Akun Pembeli Utama (Account #2) — DIREKOMENDASIKAN:**

```
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```
- Alamat: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Saldo: **10.000 ETH**
- Gunakan akun ini untuk: `Login wallet`, `Beli produk`, `Bayar ETH`

---

**🛒 Akun Pembeli Alternatif (Account #3):**

```
0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```
- Alamat: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Saldo: **10.000 ETH**

---

**🏪 Akun Penjual/Merchant (Account #1) — SUDAH DIKONFIGURASI:**

```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```
- Alamat: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Saldo: **10.000 ETH**
- ⚠️ Akun ini sudah di-set sebagai **Merchant Wallet** (penerima pembayaran). Import akun ini jika ingin menguji sebagai penjual.

---

5. Klik **"Import"**
6. Akun baru akan muncul di MetaMask dengan saldo **10.000 ETH** ✅

> 💡 **Tips:** Anda bisa import **beberapa akun sekaligus** untuk menguji skenario pembeli & penjual berbeda. Cukup ulangi langkah 1-6 dengan private key yang berbeda.

### Langkah 4 — Cara Login dengan Wallet

1. Buka **[http://localhost:5173](http://localhost:5173)** di browser
2. Klik **"Masuk"** / **"Mulai Sekarang"** untuk ke halaman Login
3. Scroll ke bawah sampai menemukan bagian **"Atau via Wallet"**
4. Klik **"Pilih Penyedia Wallet"**
5. Klik **"MetaMask"**
6. MetaMask akan pop-up meminta izin koneksi → klik **"Connect"** / **"Hubungkan"**
7. MetaMask akan pop-up lagi meminta tanda tangan (signature) → klik **"Sign"** / **"Tanda Tangan"**
8. ✅ Anda akan masuk ke aplikasi! Jika pertama kali, Anda akan diarahkan ke halaman **Profile** untuk melengkapi data.

### Langkah 5 — Cara Membeli Produk dengan ETH

Setelah login, ikuti alur berikut:

```
1. 🏠 Homepage     →  Browse produk yang tersedia
2. 🛒 Tambahkan    →  Klik tombol "Tambah ke Keranjang" pada produk
3. 🛍️ Keranjang    →  Klik ikon keranjang di navbar → klik "Checkout"
4. 📋 Checkout     →  Isi alamat pengiriman → pilih "Crypto (ETH)" sebagai metode pembayaran
5. 💰 Bayar        →  Klik "Bayar" → MetaMask akan pop-up → klik "Confirm"
6. ✅ Selesai      →  Tunggu transaksi selesai → halaman "Order Success" akan muncul
```

> ⏰ Transaksi di Hardhat local berjalan instan (< 1 detik). Di testnet atau mainnet, perlu menunggu beberapa detik hingga menit.

### Langkah 6 — Cara Login & Register dengan Email

Selain wallet, Anda juga bisa login dengan email:

#### Register (Daftar Baru):
1. Buka [http://localhost:5173/register](http://localhost:5173/register)
2. Isi semua field:
   - **Nama Toko** — nama toko Anda
   - **Nama Lengkap** — nama asli Anda
   - **Username** — username unik (huruf kecil, angka, tanpa spasi)
   - **WhatsApp** — nomor HP format `08xx` atau `+628xx`
   - **Email** — email aktif (untuk verifikasi)
   - **Password** — minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol
3. Klik **"Daftar Akun"**
4. Cek email, klik link verifikasi
5. Login dengan email & password yang sudah didaftarkan

#### Login:
1. Buka [http://localhost:5173/login](http://localhost:5173/login)
2. Masukkan **email/username** dan **password**
3. Klik **"Masuk Akun"**

---

## ⚠️ Troubleshooting (Solusi Masalah Umum)

### Masalah MetaMask

| Masalah | Solusi |
|---|---|
| **Saldo 0 ETH** padahal sudah import akun | Pastikan jaringan **Hardhat Local** yang aktif di MetaMask (bukan Ethereum Mainnet). Klik dropdown jaringan → pilih Hardhat Local |
| **Nonce too high** error | MetaMask → ikon titik tiga (⋮) → Settings → Advanced → **"Clear activity tab data"** → Confirm |
| **RPC Error** / tidak bisa konek ke jaringan | Pastikan `npx hardhat node` **masih berjalan** di terminal. Jika terminal sudah ditutup, buka kembali dan jalankan ulang |
| **Chain ID mismatch** | Pastikan Chain ID di MetaMask = `31337`. Hapus jaringan Hardhat yang salah, buat ulang |
| **Transaksi pending terus / stuck** | 1) Tutup `npx hardhat node` (Ctrl+C), jalankan ulang. 2) Di MetaMask → Settings → Advanced → Clear activity tab data |
| **MetaMask tidak muncul pop-up** | Pastikan MetaMask sudah ter-unlock (buka MetaMask, masukkan password jika diminta) |

### Masalah Backend

| Masalah | Solusi |
|---|---|
| **Port 5003 already in use** | Ada proses lain di port yang sama. Tutup proses tersebut, atau ubah `PORT` di `backend/.env` ke angka lain (misal: `5004`) |
| **Missing env variables** | Pastikan file `backend/.env` sudah dibuat (Langkah 2). Jalankan: `cp backend/.env.example backend/.env` |
| **npm install gagal** | Coba hapus `node_modules` dan install ulang: `rm -rf node_modules && npm install` |

### Masalah Frontend

| Masalah | Solusi |
|---|---|
| **Halaman blank / loading terus** | Pastikan backend sudah berjalan di Terminal 2. Cek browser console (F12 → Console) untuk error |
| **npm run dev gagal** | Pastikan `npm install` sudah berhasil di folder `frontend/`. Coba: `rm -rf node_modules && npm install` |
| **API request gagal (Network Error)** | Pastikan backend sudah running di `http://localhost:5003`. Test: buka `http://localhost:5003/api/health` di browser |

### Masalah Umum

| Masalah | Solusi |
|---|---|
| **`node --version` tidak dikenali** | Node.js belum terinstall. Download dan install dari [nodejs.org](https://nodejs.org/) |
| **`git` tidak dikenali** | Git belum terinstall. Download dari [git-scm.com](https://git-scm.com/) |
| **Halaman tidak update** | Hard refresh browser: `Ctrl + Shift + R` (Windows/Linux) atau `Cmd + Shift + R` (Mac) |

---

## 🔗 Smart Contract (Opsional)

### KaryaNusaNFT (ERC-721)

Proyek ini menggunakan smart contract Solidity untuk fitur NFT. File kontrak tersedia di:

| File | Deskripsi |
|---|---|
| [`backend/contracts/KaryaNusaNFT.sol`](backend/contracts/KaryaNusaNFT.sol) | Source code Solidity (ERC-721 + URIStorage + Ownable) |
| [`backend/contracts/KaryaNusaNFT.json`](backend/contracts/KaryaNusaNFT.json) | ABI hasil compile (digunakan oleh backend) |

#### Cara Deploy Smart Contract

Jika Anda ingin menggunakan fitur NFT minting:

1. Pastikan Hardhat node sudah berjalan (Terminal 1)
2. Buka terminal baru dan jalankan:
   ```bash
   cd backend
   node deploy.js
   ```
3. Output: `Contract deployed at: 0x...` — catat alamat ini
4. Tambahkan ke `backend/.env`:
   ```env
   NFT_CONTRACT_ADDRESS=0xALAMAT_DARI_LANGKAH_3
   ```

> **Catatan:** Fitur NFT bersifat **opsional**. Aplikasi tetap berjalan normal tanpa konfigurasi NFT.

---

## 📱 Halaman-Halaman Aplikasi

| Halaman | URL | Deskripsi |
|---|---|---|
| Landing Page | `/` | Halaman utama sebelum login |
| Login | `/login` | Login via email, Google, atau MetaMask wallet |
| Register | `/register` | Registrasi akun baru |
| Home | `/home` | Homepage — browse semua produk, filter, search |
| Profile | `/profile` | Profil & pengaturan toko |
| Create Product | `/create-product` | Buat listing produk baru |
| Edit Product | `/edit-product/:id` | Edit produk yang sudah ada |
| Checkout | `/checkout` | Halaman pembayaran |
| Orders | `/orders` | Riwayat pesanan (pembeli & penjual) |
| Order Success | `/order-success/:id` | Konfirmasi setelah pembelian berhasil |
| Shop | `/shop/:username` | Halaman toko publik seller |
| Feed | `/feed` | Social feed — buat thread, like, reply |
| Thread Detail | `/thread/:id` | Detail thread & kembaliannya |
| Quote | `/quote/:id` | Quote sebuah thread |
| Chat | `/chat` | Daftar percakapan |
| Chat Detail | `/chat/:username` | Chat dengan pengguna tertentu |

---

## 📁 Struktur Proyek (Detail)

```
KaryaNusa/
├── backend/
│   ├── contracts/                 # Smart contract Solidity + ABI
│   │   ├── KaryaNusaNFT.sol       # Source code Solidity (ERC-721)
│   │   └── KaryaNusaNFT.json      # ABI hasil compile
│   ├── deploy.js                  # Script deploy smart contract
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
│   ├── .env.example               # Template environment variables
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
│   │   ├── pages/                 # Semua halaman aplikasi (lihat tabel di atas)
│   │   ├── utils/
│   │   │   ├── evmProvider.js     # MetaMask provider detector
│   │   │   └── format.js          # Price/date formatting
│   │   ├── App.jsx                # Route definitions + providers
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── .env.example               # Template environment variables
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── localchain/
│   ├── hardhat.config.js          # Hardhat network config (chainId: 31337)
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔑 API Endpoints

### Autentikasi

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/register` | Registrasi user baru | ❌ |
| `POST` | `/api/auth/login` | Login (email/username/wallet) | ❌ |
| `POST` | `/api/auth/wallet-login` | Login via MetaMask signature | ❌ |
| `POST` | `/api/auth/link-wallet` | Hubungkan wallet ke akun | ✅ |
| `GET` | `/api/auth/profile` | Ambil data profil user | ✅ |
| `PUT` | `/api/auth/profile` | Update profil + upload avatar | ✅ |
| `PUT` | `/api/auth/set-password` | Set password untuk akun wallet | ✅ |

### Produk

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/products` | Daftar semua produk (+ pagination) | ❌ |
| `POST` | `/api/products` | Buat produk baru (+ upload gambar) | ✅ |
| `PUT` | `/api/products/:id` | Edit produk | ✅ |
| `DELETE` | `/api/products/:id` | Hapus produk | ✅ |

### Order & Pembayaran

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/orders` | Buat pesanan baru (+ pembayaran ETH) | ✅ |
| `GET` | `/api/orders` | Riwayat pesanan | ✅ |

### Keranjang & Wishlist

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/cart` | Isi keranjang | ✅ |
| `POST` | `/api/cart` | Tambah ke keranjang | ✅ |
| `GET` | `/api/wishlist` | Daftar wishlist | ✅ |
| `POST` | `/api/wishlist/toggle` | Toggle wishlist | ✅ |

### Chat

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/chat/conversations` | Daftar percakapan | ✅ |
| `GET` | `/api/chat/:userId` | Pesan dengan user tertentu | ✅ |
| `POST` | `/api/chat/send` | Kirim pesan (+ attachment) | ✅ |

### Sosial

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/threads` | Social feed threads | ✅ |
| `POST` | `/api/threads` | Buat thread baru | ✅ |
| `GET` | `/api/social/search` | Cari user | ✅ |
| `POST` | `/api/social/follow` | Follow/unfollow user | ✅ |

### Toko & Lainnya

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/shop/:username` | Halaman toko publik | ❌ |
| `GET` | `/api/health` | Health check server | ❌ |

### Health Check

Untuk memastikan backend berjalan:

```bash
curl http://localhost:5003/api/health
```

Response:
```json
{
  "status": "ok",
  "database": "supabase",
  "timestamp": "2026-04-13T...",
  "env": "development"
}
```

---

## 📋 Ringkasan Alur Penggunaan

```
┌──────────────────────────────────────────────────────────────┐
│  SETUP (Sekali saja)                                         │
│  1. Install Node.js, Git, MetaMask                           │
│  2. git clone ... → cp .env.example .env → npm install       │
├──────────────────────────────────────────────────────────────┤
│  JALANKAN (Setiap kali mau pakai)                            │
│  Terminal 1: cd localchain && npx hardhat node                │
│  Terminal 2: cd backend && npm run dev                        │
│  Terminal 3: cd frontend && npm run dev                       │
├──────────────────────────────────────────────────────────────┤
│  PAKAI (Di browser)                                          │
│  1. 📝 Register/Login → email ATAU MetaMask wallet           │
│  2. 👤 Setup Profil   → lengkapi username, nama toko, dll    │
│  3. 🛍️ Jelajahi       → browse produk, cari & filter         │
│  4. ➕ Jual Produk    → buat listing + upload gambar          │
│  5. 🛒 Beli Produk    → keranjang → checkout → bayar ETH     │
│  6. 💬 Chat           → messaging antar pengguna              │
│  7. 📢 Social Feed    → buat thread, like, reply, quote      │
│  8. ❤️ Wishlist       → simpan produk favorit                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment ke Vercel

KaryaNusa telah dikonfigurasi untuk siap di-deploy ke Vercel dengan cepat dan mudah.

1. **Frontend (`/frontend/vercel.json`)**
   - Framework Preset: `Vite`
   - Pastikan menambahkan Environment Variables di Vercel settings (Supabase URL & Key).

2. **Backend (`/backend/vercel.json`)**
   - Gunakan builder `@vercel/node`.
   - Pastikan menambahkan Environment Variables (Supabase credentials, dll).

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
