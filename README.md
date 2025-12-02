# Aplikasi Manajemen Distribusi Pupuk

Aplikasi web lengkap untuk mengelola distribusi pupuk dengan fitur CRUD, workflow order, pengiriman, dan keuangan.

## Fitur Utama

- **Dashboard**: Total stok, toko, order, pengiriman, grafik penjualan
- **Manajemen Produk & Stok**: CRUD produk, tracking stok, notifikasi stok menipis
- **Manajemen Toko**: CRUD toko, riwayat pembelian, piutang
- **Order Management**: Buat order, auto kalkulasi, status workflow, invoice PDF
- **Pengiriman & Rute**: Penjadwalan, penugasan driver, urutan rute
- **Pegawai Bongkar-Muat**: CRUD pegawai, penugasan, upah, riwayat
- **Keuangan**: Pembayaran, piutang, laporan pemasukan
- **Laporan**: Export PDF/Excel, berbagai jenis laporan

## Tech Stack

- React 18
- Tailwind CSS
- Supabase (Database & Auth)
- Recharts (Grafik)
- jsPDF (Export PDF)
- React Router

## Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` ke `.env` dan isi dengan kredensial Supabase
4. Setup database Supabase (lihat `supabase-schema.sql`)
5. Run development: `npm run dev`

## Database Setup

Jalankan script SQL di `supabase-schema.sql` di Supabase SQL Editor untuk membuat semua tabel yang diperlukan.

## Workflow

1. Toko membuat order
2. Sistem cek stok
3. Jadwal & rute dibuat
4. Driver & pegawai ditugaskan
5. Pengiriman dilakukan
6. Pembayaran dicatat
7. Upah pegawai dihitung
