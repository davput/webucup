# Quick Start Guide

## ⚠️ PENTING: Setup Database Dulu!

Sebelum menjalankan aplikasi, Anda HARUS setup database di Supabase terlebih dahulu.

### Langkah 1: Setup Database Supabase

1. Buka dashboard Supabase Anda di: https://supabase.com/dashboard/project/plbgexhgmpyvomjdvhem
2. Klik menu **SQL Editor** di sidebar kiri
3. Klik **New Query**
4. Copy SELURUH isi file `supabase-schema.sql` (ada di root folder project ini)
5. Paste ke SQL Editor
6. Klik tombol **Run** atau tekan Ctrl+Enter
7. Tunggu hingga muncul pesan "Success. No rows returned"

### Langkah 2: Verifikasi Tabel Sudah Dibuat

1. Klik menu **Table Editor** di sidebar
2. Pastikan tabel-tabel berikut sudah ada:
   - products
   - stores
   - employees
   - orders
   - order_items
   - deliveries
   - delivery_workers
   - payments
   - stock_history

### Langkah 3: Install Dependencies

```bash
npm install
```

### Langkah 4: Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di: http://localhost:3000

## Troubleshooting

### Error: "supabaseUrl is required"
- **Solusi**: Stop dev server (Ctrl+C) dan jalankan ulang `npm run dev`
- Vite perlu restart untuk membaca file .env

### Error: "relation does not exist" atau "table not found"
- **Solusi**: Anda belum menjalankan `supabase-schema.sql`
- Ikuti Langkah 1 di atas

### Error: "Failed to fetch" atau "Network error"
- **Solusi**: Cek koneksi internet Anda
- Pastikan project Supabase aktif (tidak di-pause)

## Data Sample (Optional)

Setelah database setup, Anda bisa menambahkan data sample:

1. Buka SQL Editor lagi
2. Jalankan query berikut:

```sql
-- Sample Products
INSERT INTO products (name, type, price, unit, stock, min_stock) VALUES
('Pupuk Urea 50kg', 'Nitrogen', 150000, 'karung', 100, 10),
('Pupuk NPK 50kg', 'Campuran', 200000, 'karung', 80, 10),
('Pupuk Organik 40kg', 'Organik', 100000, 'karung', 50, 5),
('Pupuk TSP 50kg', 'Fosfat', 180000, 'karung', 60, 10);

-- Sample Stores
INSERT INTO stores (name, owner, phone, address, region, debt) VALUES
('Toko Tani Makmur', 'Budi Santoso', '081234567890', 'Jl. Raya Bogor No. 123', 'Jakarta Timur', 0),
('Toko Subur Jaya', 'Siti Aminah', '081234567891', 'Jl. Merdeka No. 45', 'Jakarta Barat', 0),
('Toko Berkah Tani', 'Ahmad Yani', '081234567892', 'Jl. Sudirman No. 78', 'Jakarta Selatan', 0),
('Toko Sejahtera', 'Dewi Lestari', '081234567893', 'Jl. Gatot Subroto No. 90', 'Jakarta Pusat', 0);

-- Sample Employees
INSERT INTO employees (name, phone, role, wage_per_sack, wage_per_delivery) VALUES
('Joko Susilo', '081234567894', 'driver', 0, 100000),
('Andi Wijaya', '081234567895', 'driver', 0, 100000),
('Budi Hartono', '081234567896', 'loader', 5000, 0),
('Rudi Setiawan', '081234567897', 'loader', 5000, 0),
('Agus Prasetyo', '081234567898', 'loader', 5000, 0);
```

## Selamat Mencoba! 🚀

Setelah semua setup selesai, Anda bisa mulai:
1. Tambah produk di menu **Produk**
2. Tambah toko di menu **Toko**
3. Buat order di menu **Order** → **Buat Order**
4. Jadwalkan pengiriman di menu **Pengiriman**
5. Catat pembayaran di menu **Keuangan**
6. Lihat laporan di menu **Laporan**
