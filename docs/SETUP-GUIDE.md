# Setup Guide - Aplikasi Manajemen Distribusi Pupuk

## Prerequisites

- Node.js 18+ dan npm
- Akun Supabase (gratis di https://supabase.com)

## Langkah Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. Buat project baru di https://supabase.com
2. Buka SQL Editor di dashboard Supabase
3. Copy seluruh isi file `supabase-schema.sql`
4. Paste dan jalankan di SQL Editor
5. Tunggu hingga semua tabel berhasil dibuat

### 3. Konfigurasi Environment

1. Copy file `.env.example` menjadi `.env`:
```bash
copy .env.example .env
```

2. Buka dashboard Supabase, pergi ke Settings > API
3. Copy `Project URL` dan `anon public` key
4. Paste ke file `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

## Setup Data Awal (Optional)

Untuk testing, Anda bisa menambahkan data sample melalui SQL Editor:

```sql
-- Insert sample products
INSERT INTO products (name, type, price, unit, stock, min_stock) VALUES
('Pupuk Urea', 'Nitrogen', 150000, 'karung', 100, 10),
('Pupuk NPK', 'Campuran', 200000, 'karung', 80, 10),
('Pupuk Organik', 'Organik', 100000, 'karung', 50, 5);

-- Insert sample stores
INSERT INTO stores (name, owner, phone, address, region) VALUES
('Toko Tani Makmur', 'Budi Santoso', '081234567890', 'Jl. Raya No. 123', 'Jakarta Timur'),
('Toko Subur Jaya', 'Siti Aminah', '081234567891', 'Jl. Merdeka No. 45', 'Jakarta Barat'),
('Toko Berkah Tani', 'Ahmad Yani', '081234567892', 'Jl. Sudirman No. 78', 'Jakarta Selatan');

-- Insert sample employees
INSERT INTO employees (name, phone, role, wage_per_sack, wage_per_delivery) VALUES
('Joko Driver', '081234567893', 'driver', 0, 100000),
('Budi Loader', '081234567894', 'loader', 5000, 0),
('Andi Loader', '081234567895', 'loader', 5000, 0);
```

## Struktur Folder

```
pupuk-distribution-app/
├── src/
│   ├── components/       # Komponen reusable
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Layout.jsx
│   │   ├── Modal.jsx
│   │   └── StatCard.jsx
│   ├── pages/           # Halaman aplikasi
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── Stores.jsx
│   │   ├── Orders.jsx
│   │   ├── OrderCreate.jsx
│   │   ├── Deliveries.jsx
│   │   ├── Employees.jsx
│   │   ├── Finance.jsx
│   │   └── Reports.jsx
│   ├── lib/             # Utilities
│   │   └── supabase.js
│   ├── App.jsx          # Router utama
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── supabase-schema.sql  # Database schema
├── package.json
└── README.md
```

## Fitur Utama

### 1. Dashboard
- Statistik real-time (total stok, toko, order, pengiriman)
- Grafik penjualan bulanan
- Notifikasi stok menipis

### 2. Manajemen Produk
- CRUD produk pupuk
- Tracking stok otomatis
- Alert stok minimum

### 3. Manajemen Toko
- CRUD data toko
- Tracking piutang per toko
- Riwayat pembelian

### 4. Order Management
- Buat order dengan multiple produk
- Auto kalkulasi total
- Workflow status: Pending → Processing → Shipped → Completed
- Stok otomatis berkurang saat order dibuat

### 5. Pengiriman & Rute
- Penjadwalan pengiriman
- Penugasan driver
- Urutan rute berdasarkan wilayah
- Penugasan pegawai bongkar muat

### 6. Manajemen Pegawai
- CRUD pegawai (driver & loader)
- Setting upah per karung / per pengiriman
- Tracking penugasan

### 7. Keuangan
- Pencatatan pembayaran
- Tracking piutang toko
- Laporan pemasukan

### 8. Laporan
- Laporan penjualan per toko
- Laporan pengiriman per wilayah
- Laporan stok menipis
- Export ke PDF

## Workflow Bisnis

1. **Toko membuat order** → Pilih produk dan quantity
2. **Sistem cek stok** → Stok otomatis berkurang
3. **Order diproses** → Status berubah ke "Processing"
4. **Jadwal pengiriman dibuat** → Tentukan tanggal dan rute
5. **Driver & pegawai ditugaskan** → Assign ke pengiriman
6. **Pengiriman dilakukan** → Status "Shipped"
7. **Pembayaran dicatat** → Piutang berkurang
8. **Order selesai** → Status "Completed"

## Troubleshooting

### Error: Cannot connect to Supabase
- Pastikan URL dan API key sudah benar di `.env`
- Cek koneksi internet
- Pastikan project Supabase aktif

### Error: Table does not exist
- Jalankan ulang `supabase-schema.sql` di SQL Editor
- Pastikan semua tabel berhasil dibuat

### Stok tidak berkurang saat order
- Cek apakah product_id sudah benar
- Lihat console browser untuk error
- Pastikan trigger database berjalan

## Production Deployment

### Build untuk Production
```bash
npm run build
```

### Deploy ke Vercel
```bash
npm install -g vercel
vercel
```

### Deploy ke Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Jangan lupa set environment variables di platform hosting!

## Support

Untuk pertanyaan atau issue, silakan buka issue di repository atau hubungi tim development.
