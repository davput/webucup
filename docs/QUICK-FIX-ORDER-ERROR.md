# 🚨 Quick Fix: Error 406/400 Saat Buat Order

## ❌ Error yang Terjadi:

```
Failed to load resource: the server responded with a status of 406
Failed to load resource: the server responded with a status of 400
```

## 🔍 Penyebab:

Tabel `orders` di database Anda **belum punya kolom yang diperlukan**:
- `payment_method`
- `payment_status`
- `due_date`
- `notes`

## ✅ Solusi Cepat (5 Menit):

### **STEP 1: Buka Supabase Dashboard**

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### **STEP 2: Jalankan Script SQL**

1. Klik tombol **"+ New query"**
2. Copy script di bawah ini:

```sql
-- Add missing columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing orders
UPDATE orders 
SET payment_method = 'cash' 
WHERE payment_method IS NULL;

UPDATE orders 
SET payment_status = 'unpaid' 
WHERE payment_status IS NULL;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

3. Paste ke SQL Editor
4. Klik **"Run"** atau tekan `Ctrl+Enter`
5. Tunggu sampai muncul "Success"

### **STEP 3: Test Lagi**

1. Refresh browser (Ctrl+R)
2. Buka halaman Buat Order Baru
3. Coba buat order lagi
4. Seharusnya berhasil! ✅

---

## 📋 Verifikasi Kolom

Untuk memastikan kolom sudah ditambahkan, jalankan query ini:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

**Kolom yang harus ada:**
- ✅ id
- ✅ order_number
- ✅ store_id
- ✅ total_amount
- ✅ status
- ✅ **payment_method** ← BARU
- ✅ **payment_status** ← BARU
- ✅ **due_date** ← BARU
- ✅ **notes** ← BARU
- ✅ order_date
- ✅ created_at
- ✅ updated_at

---

## 🎯 Alternatif: Gunakan File SQL

Jika lebih mudah, gunakan file yang sudah disediakan:

1. Buka file: **`add-order-columns.sql`**
2. Copy seluruh isinya
3. Paste di Supabase SQL Editor
4. Run

---

## 🐛 Jika Masih Error:

### **Error: "permission denied"**

**Solusi:** Disable RLS sementara
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### **Error: "relation orders does not exist"**

**Solusi:** Tabel orders belum dibuat sama sekali
```sql
-- Buat tabel orders minimal
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  store_id UUID REFERENCES stores(id),
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'cash',
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  due_date DATE,
  notes TEXT,
  order_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Error: "column already exists"**

**Solusi:** Kolom sudah ada, skip error ini. Coba buat order lagi.

---

## 📞 Masih Butuh Bantuan?

1. Screenshot error di console browser (F12)
2. Screenshot struktur tabel orders di Supabase
3. Beritahu saya error message lengkapnya

---

## ✅ Checklist:

- [ ] Script SQL sudah dijalankan
- [ ] Kolom payment_method ada
- [ ] Kolom payment_status ada
- [ ] Kolom due_date ada
- [ ] Kolom notes ada
- [ ] Browser sudah di-refresh
- [ ] Coba buat order lagi

---

**Setelah menjalankan script SQL, order seharusnya bisa dibuat!** 🎉
