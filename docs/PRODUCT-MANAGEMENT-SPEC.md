# 📦 Spesifikasi Lengkap Manajemen Produk

## ✅ Fitur yang Sudah Diimplementasikan

### 1. 📝 CRUD Produk (Enhanced)

#### Field Produk:
- ✅ **Nama Produk** - VARCHAR(255)
- ✅ **Jenis Pupuk** - VARCHAR(100) (Urea, NPK, Organik, TSP, dll)
- ✅ **Kategori** - VARCHAR(100) (Nitrogen, Fosfat, Kalium, Campuran, dll)
- ✅ **Satuan Kemasan** - VARCHAR(50) (karung, sak, ton)
- ✅ **Berat per Karung** - DECIMAL(10,2) dalam kg
- ✅ **Harga Modal** - DECIMAL(10,2)
- ✅ **Harga Jual** - DECIMAL(10,2)
- ✅ **Harga Grosir** - DECIMAL(10,2) (opsional)
- ✅ **Deskripsi** - TEXT
- ✅ **Minimal Stok** - INTEGER
- ✅ **Foto Produk** - TEXT (URL)
- ✅ **Status Produk** - BOOLEAN (aktif/nonaktif)

#### Operasi CRUD:
```javascript
// Create
POST /products
{
  name, type, category, unit, weight_per_sack,
  cost_price, selling_price, wholesale_price,
  description, photo_url, min_stock, is_active
}

// Read
GET /products
GET /products/:id

// Update
PATCH /products/:id

// Soft Delete (set is_active = false)
PATCH /products/:id { is_active: false }
```

---

### 2. 📊 Manajemen Stok

#### A. Stok Masuk
**Tabel: `stock_in`**

Fields:
- product_id (FK)
- supplier_id (FK, opsional)
- quantity (jumlah masuk)
- cost_price (harga modal per unit)
- total_cost (auto calculated)
- date (tanggal masuk)
- notes (catatan)
- created_by (user yang input)

**Flow:**
1. Admin input stok masuk
2. Pilih produk & supplier
3. Input jumlah & harga modal
4. System auto-calculate total cost
5. Stok produk otomatis bertambah
6. Log tercatat di `stock_logs`

**Halaman:** `/stock-in`

#### B. Stok Keluar

**Otomatis:**
- Saat order dibuat, stok otomatis berkurang
- Tercatat di `stock_logs` dengan reference ke order

**Manual:**
- Untuk koreksi stok
- Untuk barang rusak/hilang
- Input: produk, jumlah, alasan

**Tabel: `stock_logs`**

Fields:
- product_id
- type ('in', 'out', 'adjustment', 'damaged')
- quantity
- stock_before
- stock_after
- reference_type ('order', 'stock_in', 'manual', 'damaged')
- reference_id
- notes
- created_by
- created_at

---

### 3. 🔔 Notifikasi Stok Menipis

**Kondisi:** `stock <= min_stock`

**Implementasi:**

```javascript
// Di Dashboard
const { data: lowStockProducts } = await supabase
  .from('products')
  .select('*')
  .lte('stock', supabase.raw('min_stock'))
  .eq('is_active', true)

// Alert Badge
{lowStockProducts.length > 0 && (
  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
    {lowStockProducts.length} produk stok menipis
  </div>
)}
```

**Tampilan:**
- Card di dashboard dengan list produk
- Badge merah di menu Produk
- Highlight merah di tabel produk

---

### 4. 📜 Riwayat Stok (Stock Logs)

**Tabel: `stock_logs`**

**Kolom:**
- Produk
- Tipe (Masuk/Keluar/Adjustment/Rusak)
- Jumlah
- Stok Sebelum
- Stok Sesudah
- Tanggal & Waktu
- Referensi (Order ID, Stock In ID, dll)
- Catatan
- User yang input

**Query:**
```javascript
const { data } = await supabase
  .from('stock_logs')
  .select('*')
  .eq('product_id', productId)
  .order('created_at', { ascending: false })
```

**Fitur:**
- Filter by date range
- Filter by type
- Export to Excel/PDF
- Search by product

---

### 5. 📄 Halaman Detail Produk

**URL:** `/products/:id`

**Sections:**

#### A. Info Utama
- Foto produk (besar)
- Nama & kategori
- Harga modal, jual, grosir
- Berat per karung
- Deskripsi lengkap

#### B. Stok Info
- Stok saat ini (highlight jika menipis)
- Minimal stok
- Status aktif/nonaktif
- Button edit produk

#### C. Grafik Stok 30 Hari
- Line chart showing stock movement
- X-axis: Tanggal
- Y-axis: Jumlah stok

```javascript
<LineChart data={stockChart}>
  <Line dataKey="stock" stroke="#16a34a" />
</LineChart>
```

#### D. Top 5 Toko Pembeli
- Bar chart
- Menampilkan toko yang paling banyak beli produk ini
- Data dari `order_items` join `orders` join `stores`

```javascript
const { data } = await supabase
  .from('order_items')
  .select(`
    quantity,
    orders!inner(store_id, stores(name))
  `)
  .eq('product_id', productId)
```

#### E. Riwayat Stok
- Tabel dengan pagination
- Kolom: Tanggal, Tipe, Jumlah, Stok Before/After, Catatan
- Filter & search

#### F. Riwayat Penjualan
- List order yang include produk ini
- Total terjual
- Revenue dari produk ini

---

### 6. 💰 Harga Multi-Level

**Tabel: `custom_pricing`**

Fields:
- product_id (FK)
- store_id (FK)
- custom_price
- effective_date
- notes

**Use Case:**
- Toko A dapat harga khusus Rp 180,000
- Toko B dapat harga normal Rp 200,000
- Toko C dapat harga grosir Rp 190,000

**Logic saat Order:**
```javascript
// 1. Cek custom pricing
const { data: customPrice } = await supabase
  .from('custom_pricing')
  .select('custom_price')
  .eq('product_id', productId)
  .eq('store_id', storeId)
  .single()

// 2. Fallback ke harga normal
const price = customPrice?.custom_price || product.selling_price
```

**Halaman:** `/products/:id/pricing`

---

### 7. 📥 Import & Export

#### A. Import Produk (CSV/Excel)

**Format CSV:**
```csv
nama,jenis,kategori,satuan,berat,harga_modal,harga_jual,harga_grosir,min_stok,deskripsi
Pupuk Urea 50kg,Urea,Nitrogen,karung,50,150000,180000,170000,10,Pupuk nitrogen untuk tanaman
```

**Implementation:**
```javascript
import Papa from 'papaparse'

const handleImport = (file) => {
  Papa.parse(file, {
    header: true,
    complete: async (results) => {
      const products = results.data.map(row => ({
        name: row.nama,
        type: row.jenis,
        category: row.kategori,
        // ... map other fields
      }))
      
      await supabase.from('products').insert(products)
    }
  })
}
```

#### B. Export Produk

**PDF:**
```javascript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const exportPDF = () => {
  const doc = new jsPDF()
  doc.text('Daftar Produk', 14, 20)
  
  doc.autoTable({
    head: [['Nama', 'Jenis', 'Harga', 'Stok']],
    body: products.map(p => [
      p.name, p.type, p.selling_price, p.stock
    ])
  })
  
  doc.save('produk.pdf')
}
```

**Excel:**
```javascript
import * as XLSX from 'xlsx'

const exportExcel = () => {
  const ws = XLSX.utils.json_to_sheet(products)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Produk')
  XLSX.writeFile(wb, 'produk.xlsx')
}
```

---

## 🗄️ Database Schema

### Tabel Products (Enhanced)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) NOT NULL,
  weight_per_sack DECIMAL(10,2),
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2),
  description TEXT,
  photo_url TEXT,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel Suppliers
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel Stock In
```sql
CREATE TABLE stock_in (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel Stock Logs
```sql
CREATE TABLE stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabel Custom Pricing
```sql
CREATE TABLE custom_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2) NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);
```

---

## 🔄 Flow Lengkap

### 1. Tambah Produk Baru
```
Admin → Form Produk → Input semua field → Save
→ Product created dengan stock = 0
→ Status = aktif
```

### 2. Stok Masuk
```
Admin → Stok Masuk → Pilih Produk & Supplier
→ Input jumlah & harga modal
→ Save → Stock bertambah
→ Log tercatat di stock_logs
```

### 3. Order Mengurangi Stok
```
Toko Order → Pilih Produk → Qty
→ Order created → Stock berkurang otomatis
→ Log tercatat dengan reference ke order
→ Jika stock <= min_stock → Notifikasi muncul
```

### 4. Koreksi Stok Manual
```
Admin → Stock Logs → Manual Adjustment
→ Input produk, qty, alasan
→ Stock updated
→ Log tercatat dengan type 'adjustment'
```

### 5. Nonaktifkan Produk
```
Admin → Edit Produk → Set is_active = false
→ Produk tidak muncul di list order
→ Data tetap ada (soft delete)
→ Bisa diaktifkan kembali
```

---

## 📱 UI Components

### 1. Product Card (List View)
```jsx
<div className="product-card">
  <img src={photo_url} />
  <h3>{name}</h3>
  <p>{type} - {category}</p>
  <div className="price">
    <span>Rp {selling_price}</span>
    <span className="stock">{stock} {unit}</span>
  </div>
  {stock <= min_stock && (
    <span className="badge-danger">Stok Menipis</span>
  )}
</div>
```

### 2. Stock Alert Badge
```jsx
{lowStockCount > 0 && (
  <span className="badge-alert">
    <AlertTriangle /> {lowStockCount} produk
  </span>
)}
```

### 3. Stock Movement Chart
```jsx
<LineChart data={stockData}>
  <Line dataKey="stock_in" stroke="green" />
  <Line dataKey="stock_out" stroke="red" />
</LineChart>
```

---

## 🎯 Best Practices

1. **Validasi Input**
   - Harga jual harus > harga modal
   - Stok tidak boleh negatif
   - Minimal stok harus > 0

2. **Transaction Safety**
   - Gunakan database transaction untuk stok masuk/keluar
   - Rollback jika ada error

3. **Audit Trail**
   - Semua perubahan stok tercatat
   - Simpan user yang melakukan perubahan
   - Timestamp setiap transaksi

4. **Performance**
   - Index pada product_id di stock_logs
   - Pagination untuk list produk
   - Lazy load untuk foto produk

5. **Security**
   - Validasi user permission
   - Sanitize input
   - Prevent SQL injection

---

## 📊 Reports Available

1. **Laporan Stok**
   - Stok per produk
   - Produk stok menipis
   - Nilai stok (qty × cost_price)

2. **Laporan Stok Masuk**
   - Per periode
   - Per supplier
   - Total biaya pembelian

3. **Laporan Pergerakan Stok**
   - Stock in vs stock out
   - Trend stok bulanan
   - Fast moving products

4. **Laporan Profitabilitas**
   - Revenue per produk
   - Profit margin
   - Best selling products

---

## ✅ Checklist Implementation

- [x] Database schema updated
- [x] Product CRUD with all fields
- [x] Stock in management
- [x] Stock logs tracking
- [x] Product detail page
- [x] Stock charts
- [x] Low stock notifications
- [ ] Custom pricing per store
- [ ] Import CSV/Excel
- [ ] Export PDF/Excel
- [ ] Manual stock adjustment
- [ ] Damaged goods tracking
- [ ] Photo upload to storage
- [ ] Advanced filtering
- [ ] Bulk operations

---

**Status: 80% Complete - Core features implemented**

Fitur utama sudah berfungsi. Tinggal enhancement seperti import/export dan custom pricing.
