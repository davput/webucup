# 🔄 Kompatibilitas Database

## 📊 Status Saat Ini

Sistem Order Management sekarang **kompatibel dengan struktur database lama dan baru**.

---

## ✅ Mode Kompatibilitas

### **Kolom Opsional yang Dihapus:**

Kolom-kolom berikut sudah dihapus dari code agar kompatibel dengan database lama:

1. ✅ `created_by` - Dihapus dari semua insert
2. ✅ `invoices` table - Dibuat opsional (skip jika tidak ada)
3. ✅ `delivery_notes` table - Dibuat opsional (skip jika tidak ada)

### **Kolom Wajib yang Harus Ada:**

Untuk sistem order management berfungsi, tabel `orders` minimal harus punya kolom:

```sql
- id (UUID)
- order_number (VARCHAR)
- store_id (UUID)
- total_amount (DECIMAL)
- status (VARCHAR)
- payment_method (VARCHAR)  -- BARU
- payment_status (VARCHAR)  -- BARU
- due_date (DATE)           -- BARU (nullable)
- notes (TEXT)              -- BARU (nullable)
- order_date (TIMESTAMP)
```

---

## 🔧 Cara Menggunakan

### **Opsi 1: Gunakan Database Lama (Tanpa Migration)**

Jika Anda tidak ingin menjalankan migration, sistem akan tetap berfungsi dengan keterbatasan:

**Yang Berfungsi:**
- ✅ Buat order baru
- ✅ Lihat daftar order
- ✅ Filter & pencarian
- ✅ Tambah pembayaran

**Yang Tidak Berfungsi:**
- ❌ Invoice otomatis (tabel tidak ada)
- ❌ Surat jalan otomatis (tabel tidak ada)
- ❌ Tracking created_by

**Cara Setup:**
1. Pastikan tabel `orders` punya kolom minimal di atas
2. Jika belum ada, tambahkan kolom baru:

```sql
-- Tambah kolom baru ke tabel orders yang sudah ada
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status lama ke format baru
UPDATE orders SET status = 'pending_delivery' WHERE status = 'pending';
UPDATE orders SET status = 'on_delivery' WHERE status = 'processing';
UPDATE orders SET status = 'delivered' WHERE status = 'completed';
```

---

### **Opsi 2: Gunakan Database Baru (Dengan Migration)** ⭐ RECOMMENDED

Jalankan migration lengkap untuk mendapatkan semua fitur:

**Yang Berfungsi:**
- ✅ Semua fitur order management
- ✅ Invoice otomatis
- ✅ Surat jalan otomatis
- ✅ Tracking lengkap
- ✅ Delivery management
- ✅ Driver mode

**Cara Setup:**
1. Jalankan `order-management-migration.sql` di Supabase
2. Semua tabel baru akan dibuat otomatis
3. Sistem langsung berfungsi penuh

---

## 🐛 Troubleshooting

### Error: "Could not find the 'created_by' column"

**Status:** ✅ SUDAH DIPERBAIKI

Kolom `created_by` sudah dihapus dari code. Refresh browser dan coba lagi.

---

### Error: "Could not find the 'payment_method' column"

**Penyebab:** Tabel orders masih struktur lama

**Solusi:**
```sql
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN due_date DATE;
```

---

### Error: "relation 'invoices' does not exist"

**Status:** ✅ SUDAH DIPERBAIKI

Invoice creation sekarang dibuat opsional. Jika tabel tidak ada, akan di-skip.

---

### Error: "relation 'delivery_notes' does not exist"

**Status:** ✅ SUDAH DIPERBAIKI

Delivery notes creation sekarang dibuat opsional. Jika tabel tidak ada, akan di-skip.

---

## 📋 Checklist Kompatibilitas

### Minimal Requirements (Database Lama):
- [ ] Tabel `orders` ada
- [ ] Kolom `payment_method` ada di orders
- [ ] Kolom `payment_status` ada di orders
- [ ] Tabel `order_items` ada
- [ ] Tabel `stores` ada
- [ ] Tabel `products` ada

### Full Features (Database Baru):
- [ ] Semua minimal requirements ✅
- [ ] Tabel `deliveries` ada (struktur baru)
- [ ] Tabel `delivery_orders` ada
- [ ] Tabel `invoices` ada
- [ ] Tabel `delivery_notes` ada
- [ ] Tabel `payments` ada (struktur baru)

---

## 🎯 Rekomendasi

**Untuk Development/Testing:**
- Gunakan Opsi 1 (database lama) jika ingin cepat testing
- Tambah kolom minimal yang diperlukan

**Untuk Production:**
- Gunakan Opsi 2 (migration lengkap) untuk fitur penuh
- Backup database sebelum migration
- Test di staging environment dulu

---

## 📞 Bantuan

Jika masih ada error:
1. Cek console browser untuk error detail
2. Cek struktur tabel di Supabase
3. Pastikan kolom minimal sudah ada
4. Refresh browser setelah perubahan database

---

**Update:** December 2024  
**Status:** Compatible with old and new database structure
