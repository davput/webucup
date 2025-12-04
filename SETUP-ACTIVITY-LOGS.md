# Setup Activity Logs

## Langkah-langkah Setup

### 1. Jalankan SQL Migration

Buka Supabase Dashboard dan jalankan SQL berikut di SQL Editor:

```sql
-- File: create-activity-log-table.sql
-- Buat tabel activity_logs untuk mencatat semua aktivitas user

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- create, update, delete, view, export
  entity_type VARCHAR(50) NOT NULL, -- order, product, store, delivery, payment, etc
  entity_id VARCHAR(255),
  entity_name VARCHAR(255),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_name ON activity_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Comment
COMMENT ON TABLE activity_logs IS 'Log semua aktivitas user dalam sistem';
COMMENT ON COLUMN activity_logs.user_name IS 'Nama user yang melakukan aksi';
COMMENT ON COLUMN activity_logs.action IS 'Jenis aksi: create, update, delete, view, export';
COMMENT ON COLUMN activity_logs.entity_type IS 'Tipe entitas: order, product, store, delivery, payment';
COMMENT ON COLUMN activity_logs.entity_id IS 'ID entitas yang diakses';
COMMENT ON COLUMN activity_logs.entity_name IS 'Nama entitas untuk display';
COMMENT ON COLUMN activity_logs.description IS 'Deskripsi aktivitas yang mudah dibaca';
COMMENT ON COLUMN activity_logs.metadata IS 'Data tambahan dalam format JSON';
```

### 2. Verifikasi Tabel Sudah Dibuat

Jalankan query berikut untuk memastikan tabel sudah ada:

```sql
SELECT * FROM activity_logs LIMIT 10;
```

### 3. Test Activity Logger

Coba lakukan salah satu aksi berikut:
- Tambah produk baru
- Edit produk
- Hapus produk
- Buat order baru
- Tambah toko

Kemudian cek di halaman Settings > Activity Log atau jalankan:

```sql
SELECT 
  user_name,
  action,
  entity_type,
  entity_name,
  description,
  created_at
FROM activity_logs
ORDER BY created_at DESC
LIMIT 20;
```

## Troubleshooting

### Error: relation "activity_logs" does not exist

Solusi: Jalankan SQL migration di atas

### Activity log tidak muncul

1. Cek apakah tabel sudah dibuat
2. Cek console browser untuk error
3. Pastikan Supabase connection berfungsi

### Permission denied

Solusi: Tambahkan RLS policy:

```sql
-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk insert (semua user bisa log)
CREATE POLICY "Allow insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy untuk select (semua user bisa baca)
CREATE POLICY "Allow select activity logs" ON activity_logs
  FOR SELECT
  USING (true);
```

## Fitur Activity Logger

Activity logger akan otomatis mencatat:
- ✅ Tambah/Edit/Hapus Produk
- ✅ Tambah/Edit/Hapus Toko
- ✅ Buat/Update Order
- ✅ Buat Pengiriman
- ✅ Catat Pembayaran
- ✅ Stok Masuk
- ✅ Penyesuaian Stok
- ✅ Master Data (Jenis Produk, Satuan, Wilayah)

## Cara Melihat Activity Log

1. Buka menu **Settings**
2. Pilih tab **Activity Log**
3. Filter berdasarkan:
   - Tanggal
   - User
   - Tipe Aksi
   - Tipe Entitas
