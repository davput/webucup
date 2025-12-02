# Sistem Manajemen ORDER - Aplikasi Distribusi Pupuk

## 📋 Deskripsi Sistem

Sistem manajemen order yang komprehensif untuk aplikasi distribusi pupuk dengan alur lengkap dari pembuatan order hingga pengiriman dan pembayaran. Admin yang membuat order, bukan toko.

## 🎯 Fitur Utama

### 1. **Membuat Order (oleh Admin)**

**Halaman:** `/orders/new` (OrderNew.jsx)

**Fitur:**
- ✅ Admin memilih toko dari dropdown
- ✅ Menampilkan informasi lengkap toko (pemilik, alamat, telepon, hutang)
- ✅ Admin memilih produk pupuk dari dropdown
- ✅ Harga muncul otomatis (cek custom pricing dulu, jika tidak ada pakai selling_price)
- ✅ Admin bisa override harga manual
- ✅ Sistem cek stok otomatis sebelum menyimpan
- ✅ Jika stok cukup → simpan order dengan status `pending_delivery`
- ✅ Jika stok kurang → tampilkan peringatan dan tidak bisa simpan
- ✅ Metode pembayaran: Cash / Transfer / Tempo
- ✅ Jika Tempo → wajib isi tanggal jatuh tempo
- ✅ Catatan opsional
- ✅ Otomatis generate order number (ORD-timestamp)
- ✅ Otomatis generate invoice

**Validasi:**
- Minimal 1 produk harus ditambahkan
- Stok harus mencukupi untuk semua produk
- Jika metode tempo, tanggal jatuh tempo wajib diisi

---

### 2. **Manajemen Order List**

**Halaman:** `/order-management` (OrderManagement.jsx)

**Fitur:**
- ✅ Tabel daftar order dengan kolom:
  - ID order (clickable ke detail)
  - Toko (nama, pemilik, wilayah)
  - Produk & jumlah (ringkasan)
  - Total harga
  - Metode pembayaran & status pembayaran
  - Status order
  - Tanggal order
- ✅ Filter berdasarkan:
  - Status order (pending_delivery, scheduled, on_delivery, delivered, cancelled)
  - Status pembayaran (unpaid, partial, paid)
  - Toko
  - Tanggal (dari - sampai)
  - Pencarian (no. order, nama toko, pemilik)
- ✅ Summary cards:
  - Total order
  - Menunggu pengiriman
  - Dalam pengiriman
  - Total nilai order

**Status Order:**
- `pending_delivery` - Menunggu Pengiriman (order baru dibuat)
- `scheduled` - Terjadwal (sudah dijadwalkan pengiriman)
- `on_delivery` - Dalam Pengiriman (sopir sudah mulai kirim)
- `delivered` - Terkirim (sudah sampai ke toko)
- `cancelled` - Dibatalkan

**Status Pembayaran:**
- `unpaid` - Belum Dibayar
- `partial` - Dibayar Sebagian
- `paid` - Lunas

---

### 3. **Detail Order**

**Halaman:** `/orders/:id` (OrderDetail.jsx)

**Fitur:**
- ✅ Informasi lengkap order
- ✅ Informasi toko (nama, pemilik, alamat, telepon, wilayah)
- ✅ Daftar produk dengan harga dan subtotal
- ✅ Status order dan status pembayaran
- ✅ Metode pembayaran dan jatuh tempo (jika tempo)
- ✅ Ringkasan pembayaran (total, terbayar, sisa)
- ✅ Riwayat pembayaran
- ✅ Tombol "Tambah Pembayaran" (jika belum lunas)
- ✅ Tombol "Batalkan Order" (jika belum delivered)
- ✅ Tombol "Cetak Invoice"
- ✅ Tombol "Jadwalkan Pengiriman" (jika status pending_delivery)
- ✅ Informasi pengiriman (jika sudah dijadwalkan)

**Fitur Pembayaran:**
- Admin bisa menambah pembayaran (cash/transfer)
- Sistem otomatis update status pembayaran (unpaid → partial → paid)
- Jika order tempo, pembayaran akan mengurangi hutang toko
- Otomatis update invoice

---

### 4. **Penjadwalan Pengiriman**

**Halaman:** `/deliveries/schedule` (DeliverySchedule.jsx)

**Fitur:**
- ✅ Admin mengatur:
  - Tanggal kirim
  - No. Truk / Armada
  - Sopir (pilih dari employee dengan role 'driver')
  - Catatan rute
- ✅ Pilih pegawai bongkar muat (loader)
- ✅ Bisa menggabungkan beberapa order ke 1 truk
- ✅ Atur urutan pengiriman (route order)
- ✅ Tombol naik/turun untuk mengatur urutan
- ✅ Tampilkan daftar order yang menunggu pengiriman
- ✅ Filter order berdasarkan wilayah untuk efisiensi rute
- ✅ Summary: total order, total karung, jumlah loader
- ✅ Otomatis generate delivery number (DEL-timestamp)
- ✅ Otomatis generate surat jalan (delivery note)
- ✅ Update status order menjadi `scheduled`

**Validasi:**
- Minimal 1 order harus dipilih
- Sopir wajib dipilih
- Tanggal kirim wajib diisi

---

### 5. **Manajemen Pengiriman**

**Halaman:** `/delivery-management` (DeliveryManagement.jsx)

**Fitur:**
- ✅ Tabel daftar pengiriman dengan kolom:
  - No. pengiriman (clickable ke detail)
  - Tanggal kirim
  - Sopir & No. Truk
  - Jumlah order
  - Total karung
  - Status pengiriman
- ✅ Filter berdasarkan:
  - Status (scheduled, on_delivery, delivered, cancelled)
  - Sopir
  - Tanggal (dari - sampai)
  - Pencarian (no. pengiriman, no. truk)
- ✅ Summary cards:
  - Total pengiriman
  - Terjadwal
  - Dalam pengiriman
  - Selesai

---

### 6. **Detail Pengiriman**

**Halaman:** `/deliveries/:id` (DeliveryDetail.jsx)

**Fitur:**
- ✅ Informasi pengiriman (no. pengiriman, tanggal, sopir, truk)
- ✅ Daftar pegawai bongkar muat
- ✅ Daftar order dengan urutan pengiriman
- ✅ Untuk setiap order tampilkan:
  - Urutan (1, 2, 3, ...)
  - Nama toko & pemilik
  - Alamat & telepon
  - Daftar produk & jumlah
  - Total nilai
  - Status pengiriman
- ✅ Progress bar pengiriman
- ✅ Tombol "Mulai Pengiriman" (jika status scheduled)
- ✅ Tombol "Selesaikan Pengiriman" (jika status on_delivery dan semua order delivered)
- ✅ Tombol "Batalkan" (jika status scheduled)
- ✅ Tombol "Cetak Surat Jalan"

**Aksi "Mulai Pengiriman":**
- Update status delivery menjadi `on_delivery`
- Update semua order menjadi `on_delivery`
- **KURANGI STOK OTOMATIS** untuk semua produk
- Buat stock_logs untuk tracking

---

### 7. **Mode Sopir (Driver Mode)**

**Halaman:** `/driver-mode` (DriverMode.jsx)

**Fitur:**
- ✅ Pilih nama sopir di awal
- ✅ Tampilkan daftar pengiriman sopir tersebut
- ✅ Filter: hanya tampilkan status `scheduled` dan `on_delivery`
- ✅ Untuk setiap pengiriman tampilkan:
  - No. pengiriman
  - Tanggal kirim
  - No. truk
  - Daftar order dengan urutan
- ✅ Tombol "Mulai Pengiriman" (jika scheduled)
- ✅ Untuk setiap order:
  - Tampilkan urutan, nama toko, alamat, telepon
  - Daftar produk & jumlah
  - Tombol "Tandai Terkirim" (jika on_delivery)
- ✅ Modal konfirmasi pengiriman:
  - Input nama penerima (wajib)
  - Input catatan (opsional)
  - Input URL foto bukti (opsional)
- ✅ Update status order menjadi `delivered`
- ✅ Simpan waktu terkirim, nama penerima, foto bukti
- ✅ Jika semua order terkirim → otomatis update delivery menjadi `delivered`

**UI Mobile-Friendly:**
- Desain sederhana dan mudah digunakan sopir
- Tombol besar dan jelas
- Informasi penting ditampilkan prominent

---

### 8. **Surat Jalan & Invoice**

**Fitur:**
- ✅ Sistem membuat otomatis saat pengiriman dijadwalkan
- ✅ Surat jalan (delivery_notes):
  - No. surat jalan
  - Tanggal terbit
  - Daftar order
  - Daftar produk & jumlah
  - Nama & alamat toko
  - Sopir & truk
- ✅ Invoice (invoices):
  - No. invoice
  - Tanggal terbit
  - Tanggal jatuh tempo (jika tempo)
  - Daftar produk & harga
  - Total harga
  - Status pembayaran
- ✅ Bisa dicetak (window.print())
- ✅ Bisa dikirim ke WhatsApp sopir (future: integrasi WhatsApp API)

---

### 9. **Update Status & Stok Otomatis**

**Alur Stok:**
1. **Saat order dibuat** → Stok TIDAK berkurang (hanya cek ketersediaan)
2. **Saat pengiriman disetujui/dimulai** → Stok berkurang otomatis
3. **Sistem membuat stock_logs** untuk tracking

**Alur Status Order:**
```
pending_delivery → scheduled → on_delivery → delivered
                              ↓
                          cancelled
```

**Alur Status Pembayaran:**
```
unpaid → partial → paid
```

---

### 10. **Pembayaran Toko**

**Fitur:**
- ✅ **Cash** → Admin tandai "Paid" langsung
- ✅ **Transfer** → Admin bisa upload bukti transfer (URL)
- ✅ **Tempo** → Masuk daftar piutang, tampilkan jatuh tempo
- ✅ Sistem tracking pembayaran:
  - Total order
  - Sudah dibayar
  - Sisa pembayaran
- ✅ Riwayat pembayaran dengan tanggal & metode
- ✅ Jika tempo → pembayaran mengurangi hutang toko otomatis
- ✅ Update invoice status otomatis

---

## 📊 Database Schema

### Tabel Baru/Updated:

#### **orders** (Enhanced)
```sql
- id (UUID)
- order_number (VARCHAR) - ORD-timestamp
- store_id (UUID) - FK ke stores
- total_amount (DECIMAL)
- status (VARCHAR) - pending_delivery, scheduled, on_delivery, delivered, cancelled
- payment_method (VARCHAR) - cash, transfer, tempo
- payment_status (VARCHAR) - unpaid, partial, paid
- due_date (DATE) - untuk tempo
- notes (TEXT)
- order_date (TIMESTAMP)
- created_by (VARCHAR)
```

#### **deliveries** (Enhanced)
```sql
- id (UUID)
- delivery_number (VARCHAR) - DEL-timestamp
- delivery_date (DATE)
- truck_number (VARCHAR)
- driver_id (UUID) - FK ke employees
- status (VARCHAR) - scheduled, on_delivery, delivered, cancelled
- total_orders (INTEGER)
- total_sacks (INTEGER)
- route_notes (TEXT)
- created_by (VARCHAR)
```

#### **delivery_orders** (NEW)
```sql
- id (UUID)
- delivery_id (UUID) - FK ke deliveries
- order_id (UUID) - FK ke orders
- route_order (INTEGER) - urutan pengiriman
- delivery_status (VARCHAR) - scheduled, on_delivery, delivered
- delivered_at (TIMESTAMP)
- proof_photo_url (TEXT)
- signature_data (TEXT) - base64 tanda tangan digital
- recipient_name (VARCHAR)
- notes (TEXT)
```

#### **payments** (Enhanced)
```sql
- id (UUID)
- order_id (UUID) - FK ke orders
- store_id (UUID) - FK ke stores
- amount (DECIMAL)
- payment_date (TIMESTAMP)
- payment_method (VARCHAR) - cash, transfer
- proof_url (TEXT) - URL bukti transfer
- notes (TEXT)
- created_by (VARCHAR)
```

#### **invoices** (NEW)
```sql
- id (UUID)
- order_id (UUID) - FK ke orders
- invoice_number (VARCHAR) - INV-timestamp
- issue_date (DATE)
- due_date (DATE)
- total_amount (DECIMAL)
- paid_amount (DECIMAL)
- status (VARCHAR) - unpaid, partial, paid, overdue
- notes (TEXT)
- created_by (VARCHAR)
```

#### **delivery_notes** (NEW)
```sql
- id (UUID)
- delivery_id (UUID) - FK ke deliveries
- note_number (VARCHAR) - DN-timestamp
- issue_date (DATE)
- notes (TEXT)
- created_by (VARCHAR)
```

---

## 🗂️ File Structure

```
src/
├── pages/
│   ├── OrderManagement.jsx      # Daftar order dengan filter
│   ├── OrderNew.jsx             # Form buat order baru
│   ├── OrderDetail.jsx          # Detail order & pembayaran
│   ├── DeliveryManagement.jsx   # Daftar pengiriman
│   ├── DeliverySchedule.jsx     # Jadwalkan pengiriman
│   ├── DeliveryDetail.jsx       # Detail pengiriman
│   └── DriverMode.jsx           # Mode sopir untuk update status
├── lib/
│   └── constants.js             # Konstanta status & labels
└── components/
    ├── CurrencyInput.jsx        # Input format rupiah
    └── Toast.jsx                # Notifikasi
```

---

## 🚀 Cara Menggunakan

### 1. Setup Database
```sql
-- Jalankan script SQL di supabase-schema.sql
-- Pastikan semua tabel sudah dibuat
```

### 2. Buat Order Baru
1. Buka `/orders/new`
2. Pilih toko
3. Tambahkan produk (stok akan dicek otomatis)
4. Pilih metode pembayaran
5. Jika tempo, isi tanggal jatuh tempo
6. Klik "Simpan Order"

### 3. Jadwalkan Pengiriman
1. Buka `/deliveries/schedule`
2. Pilih tanggal kirim & sopir
3. Pilih order yang akan dikirim (bisa gabung beberapa order)
4. Atur urutan pengiriman
5. Pilih pegawai loader (opsional)
6. Klik "Simpan Jadwal Pengiriman"

### 4. Mode Sopir
1. Buka `/driver-mode`
2. Pilih nama sopir
3. Klik "Mulai Pengiriman" (stok akan berkurang otomatis)
4. Untuk setiap order, klik "Tandai Terkirim"
5. Isi nama penerima & upload foto bukti
6. Konfirmasi

### 5. Kelola Pembayaran
1. Buka detail order `/orders/:id`
2. Klik "Tambah Pembayaran"
3. Masukkan jumlah pembayaran
4. Pilih metode (cash/transfer)
5. Simpan

---

## ✨ Fitur Unggulan

1. **Cek Stok Real-time** - Sistem cek stok sebelum order disimpan
2. **Custom Pricing** - Harga bisa berbeda per toko
3. **Manual Price Override** - Admin bisa override harga manual
4. **Multi-Order Delivery** - Gabungkan beberapa order dalam 1 truk
5. **Route Optimization** - Atur urutan pengiriman dengan drag & drop
6. **Driver Mode** - Interface khusus untuk sopir
7. **Auto Stock Reduction** - Stok berkurang otomatis saat pengiriman dimulai
8. **Payment Tracking** - Tracking pembayaran lengkap dengan riwayat
9. **Invoice Auto-Generate** - Invoice dibuat otomatis
10. **Delivery Note** - Surat jalan dibuat otomatis

---

## 📱 Responsive Design

- ✅ Desktop: Layout 2-3 kolom dengan sidebar
- ✅ Tablet: Layout responsif dengan collapsible sidebar
- ✅ Mobile: Single column, touch-friendly buttons
- ✅ Driver Mode: Optimized untuk mobile

---

## 🎨 Dark Mode Support

Semua halaman mendukung dark mode dengan:
- Warna yang konsisten
- Kontras yang baik
- Smooth transition

---

## 🔐 Validasi & Error Handling

- ✅ Validasi input di frontend
- ✅ Validasi stok sebelum simpan order
- ✅ Error handling dengan toast notification
- ✅ Konfirmasi untuk aksi penting (batalkan order, dll)
- ✅ Loading state untuk semua async operation

---

## 📈 Future Enhancements

1. **WhatsApp Integration** - Kirim surat jalan & invoice via WhatsApp
2. **GPS Tracking** - Real-time tracking lokasi sopir
3. **Digital Signature** - Tanda tangan digital penerima
4. **Photo Upload** - Upload foto bukti langsung dari kamera
5. **Push Notification** - Notifikasi real-time untuk sopir
6. **Route Optimization Algorithm** - Algoritma untuk optimasi rute otomatis
7. **Barcode Scanning** - Scan barcode produk untuk input cepat
8. **Multi-Warehouse** - Support multiple warehouse
9. **Delivery Analytics** - Analisis performa pengiriman
10. **Customer Portal** - Portal untuk toko melihat order mereka

---

## 🐛 Troubleshooting

### Stok tidak berkurang
- Pastikan status delivery sudah `on_delivery`
- Cek stock_logs untuk tracking

### Order tidak bisa disimpan
- Cek stok produk
- Pastikan semua field required terisi
- Cek console untuk error message

### Pembayaran tidak update hutang
- Pastikan payment_method order adalah `tempo`
- Cek apakah store_id sudah benar

---

## 👨‍💻 Developer Notes

- Semua timestamp menggunakan ISO 8601 format
- Currency format: Indonesian Rupiah (Rp)
- Date format: dd MMM yyyy (locale: id)
- Auto-generate number format: PREFIX-timestamp
- Stock reduction happens on delivery start, not order creation
- Payment tracking supports partial payments

---

## 📞 Support

Jika ada pertanyaan atau issue, silakan hubungi tim development.

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Author:** Kiro AI Assistant
