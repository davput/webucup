# Master Data dengan Supabase Database

## Perubahan dari LocalStorage ke Database

### Sebelumnya
- Master data disimpan di localStorage
- Data per browser/device
- Tidak sync antar user
- Terbatas kapasitas

### Sekarang
- Master data disimpan di Supabase
- Data terpusat di database
- Sync real-time antar user
- Unlimited capacity

## Tabel Database

### 1. product_types
```sql
CREATE TABLE product_types (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Default Data:**
- Urea, NPK, TSP, ZA, Organik, KCL, Phonska

### 2. districts (Kecamatan Banyuwangi)
```sql
CREATE TABLE districts (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Default Data (24 Kecamatan):**
- Banyuwangi, Giri, Kalipuro, Glagah, Licin
- Songgon, Singojuruh, Cluring, Gambiran, Tegaldlimo
- Purwoharjo, Muncar, Siliragung, Bangorejo, Pesanggaran
- Srono, Genteng, Glenmore, Kalibaru, Kabat
- Rogojampi, Wongsorejo, Sempu, Tegalsari

### 3. units
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Default Data:**
- Karung, Kg, Ton, Liter, Sak

## Setup Database

### 1. Jalankan SQL
Jalankan file `master-data-tables.sql` di Supabase SQL Editor

### 2. Verify Tables
```sql
SELECT * FROM product_types;
SELECT * FROM districts;
SELECT * FROM units;
```

## Integrasi

### Settings.jsx
- Load data dari Supabase saat mount
- CRUD operations langsung ke database
- Real-time update setelah operasi

### StoreForm.jsx
- Load districts dari database
- Dropdown kecamatan Banyuwangi

### ProductForm.jsx
- Load product_types dan units dari database
- Dropdown jenis produk dan satuan

## Keuntungan

1. **Centralized**: Satu sumber data untuk semua user
2. **Sync**: Perubahan langsung terlihat semua user
3. **Scalable**: Tidak terbatas kapasitas
4. **Reliable**: Backup otomatis oleh Supabase
5. **Multi-user**: Support banyak user bersamaan
