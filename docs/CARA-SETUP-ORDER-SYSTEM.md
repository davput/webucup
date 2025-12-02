# 🚀 Cara Setup Sistem Order Management

## ⚠️ PENTING: Jalankan Migration Database Dulu!

Sebelum menggunakan sistem order management, Anda **HARUS** menjalankan migration database terlebih dahulu.

---

## 📝 Langkah-Langkah Setup

### 1. Buka Supabase Dashboard

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik menu **SQL Editor** di sidebar kiri

### 2. Jalankan Migration SQL

1. Klik tombol **"+ New query"**
2. Copy seluruh isi file `order-management-migration.sql`
3. Paste ke SQL Editor
4. Klik tombol **"Run"** atau tekan `Ctrl+Enter`
5. Tunggu sampai selesai (akan muncul "Success" di bawah)

### 3. Verifikasi Tabel Sudah Dibuat

Jalankan query ini untuk memastikan tabel sudah dibuat:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'orders', 
    'order_items', 
    'deliveries', 
    'delivery_orders', 
    'delivery_workers',
    'payments',
    'delivery_notes',
    'invoices'
  )
ORDER BY table_name;
```

Harusnya muncul 8 tabel:
- ✅ delivery_notes
- ✅ delivery_orders
- ✅ delivery_workers
- ✅ deliveries
- ✅ invoices
- ✅ order_items
- ✅ orders
- ✅ payments

### 4. Cek Struktur Tabel Orders

Jalankan query ini untuk memastikan kolom sudah benar:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

Harusnya ada kolom:
- id
- order_number
- store_id
- total_amount
- status
- payment_method
- payment_status
- due_date
- notes
- order_date
- created_by
- created_at
- updated_at

### 5. Test Aplikasi

1. Jalankan aplikasi: `npm run dev`
2. Buka browser: `http://localhost:5173`
3. Klik menu **Order** → **Manajemen Order**
4. Harusnya halaman terbuka tanpa error

---

## 🐛 Troubleshooting

### Error: "relation 'orders' does not exist"

**Penyebab:** Tabel orders belum dibuat atau masih struktur lama

**Solusi:**
1. Jalankan migration SQL di atas
2. Atau drop tabel lama dulu:
```sql
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
```
3. Lalu jalankan migration SQL lengkap

### Error: "column 'payment_method' does not exist"

**Penyebab:** Struktur tabel orders masih lama

**Solusi:**
1. Drop tabel orders lama
2. Jalankan migration SQL untuk membuat tabel baru

### Error: "permission denied for table orders"

**Penyebab:** RLS (Row Level Security) aktif tapi belum ada policy

**Solusi:**
```sql
-- Disable RLS untuk development (HATI-HATI di production!)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_workers DISABLE ROW LEVEL SECURITY;
```

Atau buat policy yang sesuai untuk production.

---

## 📊 Buat Data Sample (Opsional)

Setelah migration berhasil, Anda bisa buat data sample untuk testing:

### 1. Pastikan Ada Toko

```sql
SELECT id, name FROM stores LIMIT 5;
```

Jika belum ada, buat toko sample:
```sql
INSERT INTO stores (name, owner, phone, address, region)
VALUES 
  ('Toko Tani Makmur', 'Pak Budi', '081234567890', 'Jl. Raya No. 123', 'Banyuwangi'),
  ('Toko Subur Jaya', 'Bu Siti', '081234567891', 'Jl. Merdeka No. 45', 'Giri');
```

### 2. Pastikan Ada Produk

```sql
SELECT id, name, stock, selling_price FROM products WHERE is_active = true LIMIT 5;
```

Jika belum ada, buat produk sample:
```sql
INSERT INTO products (name, type, category, unit, cost_price, selling_price, stock, is_active)
VALUES 
  ('Urea 50kg', 'Urea', 'Nitrogen', 'Karung', 150000, 180000, 100, true),
  ('NPK Phonska 50kg', 'NPK', 'Majemuk', 'Karung', 200000, 240000, 80, true);
```

### 3. Pastikan Ada Pegawai (Sopir & Loader)

```sql
SELECT id, name, role FROM employees;
```

Jika belum ada, buat pegawai sample:
```sql
INSERT INTO employees (name, phone, role, wage_per_sack, wage_per_delivery)
VALUES 
  ('Pak Joko', '081234567892', 'driver', 0, 100000),
  ('Pak Andi', '081234567893', 'driver', 0, 100000),
  ('Mas Rudi', '081234567894', 'loader', 2000, 0),
  ('Mas Dedi', '081234567895', 'loader', 2000, 0);
```

---

## ✅ Checklist Setup

- [ ] Migration SQL sudah dijalankan
- [ ] 8 tabel baru sudah dibuat
- [ ] Struktur tabel orders sudah benar (ada kolom payment_method, payment_status, dll)
- [ ] RLS sudah di-disable atau policy sudah dibuat
- [ ] Ada minimal 1 toko di database
- [ ] Ada minimal 1 produk aktif di database
- [ ] Ada minimal 1 sopir (employee dengan role 'driver')
- [ ] Aplikasi bisa dibuka tanpa error
- [ ] Halaman Manajemen Order bisa dibuka

---

## 🎉 Selesai!

Jika semua checklist sudah ✅, sistem order management siap digunakan!

Silakan baca panduan penggunaan di: **PANDUAN-ORDER-MANAGEMENT.md**

---

## 📞 Butuh Bantuan?

Jika masih ada error:
1. Cek console browser (F12) untuk melihat error detail
2. Cek Supabase logs untuk error database
3. Pastikan semua langkah di atas sudah dijalankan dengan benar
