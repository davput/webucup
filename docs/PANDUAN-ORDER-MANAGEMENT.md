# 📦 Panduan Sistem Manajemen Order

## 🚀 Quick Start

### 1. Setup Database

Jalankan migration SQL di Supabase:

```bash
# Buka Supabase SQL Editor
# Copy paste isi file: order-management-migration.sql
# Klik Run
```

### 2. Akses Menu

Sistem order management bisa diakses melalui menu:

- **Order** → **Manajemen Order** (`/order-management`)
- **Pengiriman** → **Manajemen Pengiriman** (`/delivery-management`)
- **Pengiriman** → **Mode Sopir** (`/driver-mode`)

---

## 📝 Alur Kerja Lengkap

### STEP 1: Buat Order Baru

1. Klik menu **Order** → **Manajemen Order**
2. Klik tombol **"+ Buat Order Baru"**
3. **Pilih Toko:**
   - Pilih toko dari dropdown
   - Sistem akan menampilkan info toko (pemilik, alamat, hutang)
4. **Tambah Produk:**
   - Pilih produk dari dropdown
   - Harga akan muncul otomatis (cek custom pricing dulu)
   - Bisa override harga manual jika perlu
   - Masukkan jumlah
   - Klik **"Tambah"**
   - Ulangi untuk produk lain
5. **Pilih Metode Pembayaran:**
   - **Tunai (Cash)** - Pembayaran langsung
   - **Transfer** - Pembayaran via transfer bank
   - **Tempo** - Pembayaran kredit (wajib isi tanggal jatuh tempo)
6. **Tambah Catatan** (opsional)
7. Klik **"Simpan Order"**

**Hasil:**
- ✅ Order tersimpan dengan status `Menunggu Pengiriman`
- ✅ Invoice otomatis dibuat
- ✅ Stok BELUM berkurang (hanya dicek ketersediaan)

---

### STEP 2: Jadwalkan Pengiriman

1. Klik menu **Pengiriman** → **Manajemen Pengiriman**
2. Klik tombol **"+ Jadwalkan Pengiriman"**
3. **Isi Informasi Pengiriman:**
   - Tanggal kirim
   - No. Truk (opsional)
   - Pilih Sopir (wajib)
   - Catatan rute (opsional)
4. **Pilih Pegawai Loader** (opsional):
   - Centang pegawai yang akan membantu bongkar muat
5. **Pilih Order yang Akan Dikirim:**
   - Centang order dari daftar "Order Menunggu Pengiriman"
   - Bisa pilih beberapa order sekaligus (untuk 1 truk)
6. **Atur Urutan Pengiriman:**
   - Gunakan tombol ▲▼ untuk mengatur urutan
   - Urutan 1 = tujuan pertama, dst
7. Klik **"Simpan Jadwal Pengiriman"**

**Hasil:**
- ✅ Pengiriman tersimpan dengan status `Terjadwal`
- ✅ Surat jalan otomatis dibuat
- ✅ Status order berubah menjadi `Terjadwal`
- ✅ Stok BELUM berkurang

---

### STEP 3: Mulai Pengiriman (Admin atau Sopir)

#### Opsi A: Admin Memulai Pengiriman

1. Buka **Detail Pengiriman** (`/deliveries/:id`)
2. Klik tombol **"Mulai Pengiriman"**

#### Opsi B: Sopir Memulai Pengiriman (Mode Sopir)

1. Buka menu **Pengiriman** → **Mode Sopir**
2. Pilih nama sopir
3. Klik tombol **"Mulai Pengiriman"** pada pengiriman yang dijadwalkan

**Hasil:**
- ✅ Status pengiriman berubah menjadi `Dalam Pengiriman`
- ✅ Status semua order berubah menjadi `Dalam Pengiriman`
- ✅ **STOK BERKURANG OTOMATIS** untuk semua produk
- ✅ Stock logs dibuat untuk tracking

---

### STEP 4: Update Status Pengiriman (Mode Sopir)

1. Di **Mode Sopir**, sopir akan melihat daftar order dengan urutan
2. Untuk setiap toko yang sudah dikunjungi:
   - Klik tombol **"Tandai Terkirim"**
   - Isi nama penerima (wajib)
   - Tambah catatan (opsional)
   - Upload foto bukti (opsional)
   - Klik **"Konfirmasi Terkirim"**

**Hasil:**
- ✅ Status order berubah menjadi `Terkirim`
- ✅ Waktu terkirim & nama penerima tersimpan
- ✅ Jika semua order terkirim → status pengiriman otomatis `Selesai`

---

### STEP 5: Kelola Pembayaran

#### Untuk Pembayaran Cash/Transfer:

1. Buka **Detail Order** (`/orders/:id`)
2. Klik tombol **"Tambah Pembayaran"**
3. Masukkan jumlah pembayaran
4. Pilih metode (Cash/Transfer)
5. Tambah catatan (opsional)
6. Klik **"Simpan Pembayaran"**

**Hasil:**
- ✅ Pembayaran tercatat
- ✅ Status pembayaran update otomatis:
  - Belum Dibayar → Dibayar Sebagian → Lunas
- ✅ Invoice update otomatis

#### Untuk Pembayaran Tempo:

1. Order dengan metode tempo akan masuk daftar piutang
2. Saat toko bayar, admin tambah pembayaran seperti di atas
3. **Hutang toko akan berkurang otomatis**

---

## 🎯 Fitur Penting

### 1. Cek Stok Otomatis

Saat membuat order, sistem akan:
- ✅ Cek stok setiap produk
- ✅ Jika stok cukup → order bisa disimpan
- ✅ Jika stok kurang → tampilkan peringatan, order tidak bisa disimpan

### 2. Custom Pricing

Sistem akan cek harga dengan urutan:
1. Cek custom pricing untuk toko tersebut
2. Jika tidak ada, pakai harga jual normal (selling_price)
3. Admin bisa override harga manual

### 3. Gabung Beberapa Order

Saat jadwalkan pengiriman:
- Bisa pilih beberapa order sekaligus
- Cocok untuk order yang searah/satu wilayah
- Hemat biaya pengiriman

### 4. Tracking Lengkap

Sistem tracking:
- ✅ Status order real-time
- ✅ Status pembayaran
- ✅ Riwayat pembayaran
- ✅ Stock logs (kapan stok berkurang)
- ✅ Waktu terkirim & nama penerima

---

## 📊 Status & Artinya

### Status Order:

| Status | Arti | Aksi Selanjutnya |
|--------|------|------------------|
| **Menunggu Pengiriman** | Order baru dibuat | Jadwalkan pengiriman |
| **Terjadwal** | Sudah dijadwalkan | Mulai pengiriman |
| **Dalam Pengiriman** | Sopir sedang kirim | Tandai terkirim |
| **Terkirim** | Sudah sampai toko | Kelola pembayaran |
| **Dibatalkan** | Order dibatalkan | - |

### Status Pembayaran:

| Status | Arti |
|--------|------|
| **Belum Dibayar** | Belum ada pembayaran |
| **Dibayar Sebagian** | Sudah bayar tapi belum lunas |
| **Lunas** | Sudah dibayar penuh |

### Status Pengiriman:

| Status | Arti |
|--------|------|
| **Terjadwal** | Sudah dijadwalkan |
| **Dalam Pengiriman** | Sopir sedang kirim |
| **Selesai** | Semua order terkirim |
| **Dibatalkan** | Pengiriman dibatalkan |

---

## 🔍 Filter & Pencarian

### Di Halaman Manajemen Order:

Filter berdasarkan:
- Status order
- Status pembayaran
- Toko
- Tanggal (dari - sampai)
- Pencarian (no. order, nama toko, pemilik)

### Di Halaman Manajemen Pengiriman:

Filter berdasarkan:
- Status pengiriman
- Sopir
- Tanggal (dari - sampai)
- Pencarian (no. pengiriman, no. truk)

---

## 📱 Mode Sopir

### Cara Pakai:

1. Buka `/driver-mode` di browser mobile/tablet
2. Pilih nama sopir
3. Lihat daftar pengiriman hari ini
4. Mulai pengiriman
5. Update status setiap toko

### Tips untuk Sopir:

- ✅ Gunakan di HP/tablet untuk kemudahan
- ✅ Pastikan koneksi internet stabil
- ✅ Foto bukti pengiriman (opsional tapi recommended)
- ✅ Isi nama penerima dengan benar
- ✅ Update status segera setelah sampai toko

---

## 🖨️ Cetak Dokumen

### Cetak Invoice:

1. Buka detail order
2. Klik tombol **"Cetak Invoice"**
3. Browser akan buka print dialog
4. Pilih printer atau Save as PDF

### Cetak Surat Jalan:

1. Buka detail pengiriman
2. Klik tombol **"Cetak Surat Jalan"**
3. Browser akan buka print dialog
4. Pilih printer atau Save as PDF

---

## ⚠️ Hal Penting

### Kapan Stok Berkurang?

- ❌ **TIDAK** saat order dibuat
- ✅ **YA** saat pengiriman dimulai (status jadi "Dalam Pengiriman")

### Pembatalan Order:

- Order bisa dibatalkan jika status belum `Terkirim`
- Jika sudah mulai pengiriman (stok sudah berkurang), batalkan dengan hati-hati
- Stok TIDAK otomatis kembali saat order dibatalkan

### Pembayaran Tempo:

- Otomatis masuk daftar piutang
- Hutang toko akan bertambah
- Saat toko bayar, hutang akan berkurang otomatis

---

## 🐛 Troubleshooting

### Order tidak bisa disimpan

**Penyebab:**
- Stok tidak mencukupi
- Field wajib belum diisi
- Tanggal jatuh tempo kosong (untuk tempo)

**Solusi:**
- Cek stok produk
- Pastikan semua field terisi
- Isi tanggal jatuh tempo jika pilih metode tempo

### Stok tidak berkurang

**Penyebab:**
- Pengiriman belum dimulai
- Status masih "Terjadwal"

**Solusi:**
- Klik "Mulai Pengiriman" di detail pengiriman atau mode sopir
- Stok akan berkurang otomatis

### Pembayaran tidak mengurangi hutang

**Penyebab:**
- Metode pembayaran order bukan "Tempo"
- Store ID tidak cocok

**Solusi:**
- Cek metode pembayaran order
- Pastikan pembayaran untuk order yang benar

---

## 💡 Tips & Best Practices

### Untuk Admin:

1. **Cek stok sebelum buat order** - Pastikan stok mencukupi
2. **Gabungkan order searah** - Hemat biaya pengiriman
3. **Atur urutan pengiriman** - Mulai dari yang terdekat
4. **Update pembayaran segera** - Jangan tunda input pembayaran
5. **Cetak surat jalan** - Berikan ke sopir sebelum berangkat

### Untuk Sopir:

1. **Cek daftar pengiriman** - Sebelum berangkat
2. **Ikuti urutan** - Sesuai yang dijadwalkan
3. **Update status real-time** - Segera setelah sampai toko
4. **Foto bukti** - Ambil foto saat serah terima
5. **Isi nama penerima** - Dengan benar dan lengkap

---

## 📞 Bantuan

Jika ada pertanyaan atau kendala:
1. Cek dokumentasi lengkap di `ORDER-MANAGEMENT-SYSTEM.md`
2. Lihat troubleshooting di atas
3. Hubungi tim IT/development

---

## ✅ Checklist Harian

### Untuk Admin:

- [ ] Cek order baru yang masuk
- [ ] Jadwalkan pengiriman untuk order pending
- [ ] Monitor status pengiriman
- [ ] Update pembayaran yang masuk
- [ ] Cek piutang yang jatuh tempo

### Untuk Sopir:

- [ ] Cek jadwal pengiriman hari ini
- [ ] Cetak/download surat jalan
- [ ] Mulai pengiriman
- [ ] Update status setiap toko
- [ ] Konfirmasi semua order terkirim

---

**Selamat menggunakan Sistem Manajemen Order!** 🎉
