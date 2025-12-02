# Laporan Profesional - Enhanced Reports System

## Fitur Baru yang Ditambahkan

### 1. **4 Jenis Laporan Lengkap**

#### A. Laporan Penjualan 📊
- Total order dan pendapatan
- Jumlah karung terjual
- Rata-rata nilai order
- Filter berdasarkan wilayah dan status
- Breakdown per toko dengan detail tanggal

**Summary Cards:**
- Total Order (dengan breakdown selesai/pending)
- Total Pendapatan
- Total Karung Terjual
- Rata-rata Nilai Order

#### B. Laporan Pengiriman 🚚
- Total pengiriman
- Status pengiriman (selesai/dalam perjalanan)
- Completion rate
- Total nilai pengiriman
- Detail driver dan wilayah

**Summary Cards:**
- Total Pengiriman
- Pengiriman Selesai (dengan completion rate)
- Dalam Perjalanan
- Total Nilai Pengiriman

#### C. Laporan Stok 📦
- Produk dengan stok menipis
- Produk habis
- Nilai total stok
- Persentase produk kritis
- Detail harga dan nilai per produk

**Summary Cards:**
- Total Produk
- Stok Menipis (dengan persentase)
- Produk Habis
- Total Nilai Stok

#### D. Laporan Keuangan 💰 (BARU!)
- Total pendapatan
- Total terbayar
- Total piutang
- Collection rate
- Status pembayaran per order

**Summary Cards:**
- Total Pendapatan
- Terbayar (dengan collection rate)
- Piutang
- Breakdown Status Pembayaran

### 2. **Summary Cards dengan Gradient**
- Desain modern dengan gradient background
- Icon yang relevan untuk setiap metrik
- Warna yang berbeda untuk setiap jenis data
- Informasi tambahan di setiap card

### 3. **Filter Lanjutan**
- Filter berdasarkan tanggal (dari-sampai)
- Filter wilayah untuk laporan penjualan dan pengiriman
- Filter status untuk laporan penjualan
- Auto-reset saat ganti jenis laporan

### 4. **Tabel Data yang Lebih Informatif**
- Kolom tambahan dengan informasi lengkap
- Status badge dengan warna yang jelas
- Format currency yang konsisten
- Hover effect untuk better UX
- Dark mode support penuh

### 5. **Export PDF yang Lebih Profesional**
- Header dengan judul dan tanggal cetak
- Section ringkasan dengan metrik penting
- Tabel dengan styling yang rapi
- Footer dengan nomor halaman
- Font size yang optimal untuk print

### 6. **Loading State & Toast Notifications**
- Loading indicator saat generate laporan
- Success/error toast notifications
- Feedback yang jelas untuk setiap aksi

## Cara Menggunakan

### Generate Laporan Penjualan
1. Pilih "Laporan Penjualan" dari dropdown
2. Pilih tanggal mulai dan akhir
3. (Opsional) Filter berdasarkan wilayah
4. (Opsional) Filter berdasarkan status order
5. Klik "Generate Laporan"
6. Lihat summary cards dan tabel detail
7. Klik "Export PDF" untuk download

### Generate Laporan Pengiriman
1. Pilih "Laporan Pengiriman"
2. Pilih periode tanggal
3. (Opsional) Filter berdasarkan wilayah
4. Generate dan export

### Generate Laporan Stok
1. Pilih "Laporan Stok"
2. Tidak perlu pilih tanggal (real-time)
3. Generate untuk melihat produk yang stoknya menipis
4. Export PDF untuk dokumentasi

### Generate Laporan Keuangan
1. Pilih "Laporan Keuangan"
2. Pilih periode tanggal
3. Lihat summary piutang dan pembayaran
4. Export untuk rekonsiliasi

## Metrik yang Ditampilkan

### Laporan Penjualan
- Total order, pendapatan, karung terjual
- Rata-rata nilai order
- Breakdown per toko dengan tanggal
- Status order (pending/processing/completed/cancelled)

### Laporan Pengiriman
- Total pengiriman dan completion rate
- Pengiriman selesai vs dalam perjalanan
- Detail driver dan nilai order
- Breakdown per wilayah

### Laporan Stok
- Total produk dan produk kritis
- Nilai total stok
- Detail per produk: stok, min stok, harga, nilai
- Status: habis atau menipis

### Laporan Keuangan
- Total pendapatan vs terbayar
- Total piutang
- Collection rate (persentase pembayaran)
- Status: lunas, sebagian, belum bayar

## Keunggulan Sistem Baru

1. **Lebih Komprehensif**: 4 jenis laporan vs 3 sebelumnya
2. **Visual yang Menarik**: Summary cards dengan gradient dan icon
3. **Informasi Lebih Detail**: Kolom tambahan di setiap tabel
4. **Filter Lebih Fleksibel**: Multiple filter options
5. **PDF Lebih Profesional**: Header, summary, dan footer yang lengkap
6. **Better UX**: Loading state, toast, hover effects
7. **Dark Mode**: Full support untuk dark mode
8. **Responsive**: Optimal di desktop dan mobile

## Format PDF Export

PDF yang diexport mencakup:
- **Header**: Judul laporan dan periode
- **Tanggal Cetak**: Untuk tracking
- **Ringkasan**: Metrik penting dalam format text
- **Tabel Detail**: Semua data dengan kolom lengkap
- **Footer**: Nomor halaman
- **Styling**: Warna header biru profesional

## Tips Penggunaan

1. **Untuk Analisis Bulanan**: Gunakan laporan penjualan dan keuangan
2. **Untuk Monitoring Operasional**: Gunakan laporan pengiriman
3. **Untuk Inventory Management**: Gunakan laporan stok secara berkala
4. **Untuk Rekonsiliasi**: Export PDF laporan keuangan setiap akhir periode
5. **Untuk Presentasi**: Summary cards memberikan overview yang cepat

## Teknologi yang Digunakan

- React hooks untuk state management
- Supabase untuk query data
- jsPDF + autoTable untuk PDF generation
- Tailwind CSS untuk styling
- Lucide React untuk icons
- Custom toast notifications
