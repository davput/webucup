# Master Data di Pengaturan

## Overview
Master Data dipindahkan dari menu Produk ke tab Master Data di Pengaturan untuk centralized management. Ditambahkan juga master data baru seperti Wilayah dan Satuan.

## Perubahan

### Sebelumnya
- Master Data ada di menu Produk → Master Data
- Hanya untuk jenis produk
- Terpisah dari pengaturan lain

### Sekarang
- Master Data ada di Pengaturan → Tab Master Data
- Mencakup 3 jenis master data
- Terpusat dengan pengaturan lain

## 3 Jenis Master Data

### 1. **Jenis Produk** 📦
Master data untuk tipe/jenis produk pupuk.

**Default Values:**
- Urea
- NPK
- TSP
- ZA
- Organik

**Kegunaan:**
- Dropdown di form tambah/edit produk
- Filter di laporan produk
- Kategorisasi produk
- Statistik per jenis

**Operasi:**
- ✅ Tambah jenis baru
- ✅ Edit jenis existing
- ✅ Hapus jenis (dengan konfirmasi)

### 2. **Wilayah** 📍
Master data untuk wilayah/region distribusi.

**Default Values:**
- Jakarta
- Bogor
- Depok
- Tangerang
- Bekasi
- Bandung
- Surabaya

**Kegunaan:**
- Dropdown di form tambah/edit toko
- Filter laporan per wilayah
- Analisis distribusi geografis
- Routing pengiriman

**Operasi:**
- ✅ Tambah wilayah baru
- ✅ Edit wilayah existing
- ✅ Hapus wilayah (dengan konfirmasi)

### 3. **Satuan** ⚖️
Master data untuk unit/satuan produk.

**Default Values:**
- Karung
- Kg
- Ton
- Liter

**Kegunaan:**
- Dropdown di form produk
- Konversi satuan
- Laporan stok
- Invoice dan dokumen

**Operasi:**
- ✅ Tambah satuan baru
- ✅ Edit satuan existing
- ✅ Hapus satuan (dengan konfirmasi)

## Fitur

### CRUD Operations

#### Create (Tambah)
1. Klik tombol "Tambah" di section yang diinginkan
2. Modal terbuka
3. Input nama item
4. Klik "Tambah"
5. Item ditambahkan dan disimpan

#### Read (Lihat)
- Semua item ditampilkan dalam grid
- 3 kolom di desktop
- 2 kolom di tablet
- 1 kolom di mobile

#### Update (Edit)
1. Klik icon Edit (pensil) pada item
2. Modal terbuka dengan value existing
3. Ubah value
4. Klik "Update"
5. Item diupdate dan disimpan

#### Delete (Hapus)
1. Klik icon Delete (trash) pada item
2. Konfirmasi dialog muncul
3. Klik OK untuk hapus
4. Item dihapus dan disimpan

### Modal Form

**Fitur Modal:**
- Dynamic title berdasarkan operasi (Tambah/Edit)
- Dynamic placeholder berdasarkan jenis
- Enter key untuk submit
- Validation: tidak boleh kosong
- Cancel button
- Submit button dengan label dynamic

**Validasi:**
- Input tidak boleh kosong
- Toast error jika kosong
- Toast success setelah berhasil

### Penyimpanan Data

**LocalStorage:**
- Key: `productTypes`, `regions`, `units`
- Format: JSON array
- Auto-save setelah setiap operasi
- Persistent setelah refresh

**Struktur Data:**
```javascript
productTypes: ["Urea", "NPK", "TSP", ...]
regions: ["Jakarta", "Bogor", ...]
units: ["Karung", "Kg", ...]
```

## UI/UX

### Layout
- Grid responsive (1/2/3 kolom)
- Card untuk setiap item
- Icon untuk setiap section
- Tombol Tambah di header section

### Item Card
- Background: gray-50 (light) / gray-800 (dark)
- Border: gray-200 (light) / gray-700 (dark)
- Padding: 3
- Rounded: lg

### Actions
- Edit button: blue color
- Delete button: red color
- Icon size: 4x4
- Hover effect

### Info Box
- Blue background
- Border blue
- Info icon
- Helpful text

## Integration

### Dengan Form Produk
```javascript
// Load product types dari localStorage
const productTypes = JSON.parse(localStorage.getItem('productTypes'))

// Gunakan di dropdown
<select>
  {productTypes.map(type => (
    <option value={type}>{type}</option>
  ))}
</select>
```

### Dengan Form Toko
```javascript
// Load regions dari localStorage
const regions = JSON.parse(localStorage.getItem('regions'))

// Gunakan di dropdown
<select>
  {regions.map(region => (
    <option value={region}>{region}</option>
  ))}
</select>
```

### Dengan Form Produk (Unit)
```javascript
// Load units dari localStorage
const units = JSON.parse(localStorage.getItem('units'))

// Gunakan di dropdown
<select>
  {units.map(unit => (
    <option value={unit}>{unit}</option>
  ))}
</select>
```

## Keuntungan Centralized Master Data

### 1. **Single Source of Truth**
- Satu tempat untuk manage semua master data
- Konsisten di seluruh aplikasi
- Mudah maintenance

### 2. **Easy Management**
- CRUD operations dalam satu halaman
- Tidak perlu navigasi ke berbagai menu
- Quick access dari Settings

### 3. **Flexibility**
- User bisa customize sesuai kebutuhan
- Tambah/edit/hapus kapan saja
- Tidak hardcoded

### 4. **Scalability**
- Mudah tambah master data baru
- Struktur yang sama untuk semua jenis
- Reusable components

### 5. **User Control**
- User punya kontrol penuh
- Tidak tergantung developer
- Self-service management

## Best Practices

### Untuk Admin
1. **Setup Awal**: Isi semua master data di awal
2. **Konsistensi**: Gunakan naming yang konsisten
3. **Review Berkala**: Cek dan update master data
4. **Backup**: Export data secara berkala
5. **Training**: Latih user untuk manage master data

### Untuk Developer
1. **Always Load**: Load master data saat app init
2. **Fallback**: Provide default values
3. **Validation**: Validate before save
4. **Sync**: Sync dengan database jika perlu
5. **Migration**: Migrate old data ke new structure

## Future Enhancements

### Fitur yang Bisa Ditambahkan

1. **Import/Export**
   - Export master data ke CSV/JSON
   - Import dari file
   - Bulk operations

2. **Master Data Tambahan**
   - Status order custom
   - Payment methods
   - Delivery types
   - Customer categories

3. **Validation Rules**
   - Unique constraint
   - Format validation
   - Required fields

4. **Audit Trail**
   - Track changes
   - Who changed what
   - When changed

5. **Sync dengan Database**
   - Store di Supabase
   - Real-time sync
   - Multi-user support

6. **Sorting & Filtering**
   - Sort alphabetically
   - Search functionality
   - Filter by usage

7. **Usage Statistics**
   - Show usage count
   - Most used items
   - Unused items

8. **Bulk Operations**
   - Select multiple
   - Bulk delete
   - Bulk edit

## Migration Guide

### Dari ProductMaster ke Settings

**Step 1: Backup Data**
```javascript
const oldData = localStorage.getItem('productMasterData')
// Save to file
```

**Step 2: Load ke New Structure**
```javascript
const productTypes = JSON.parse(oldData).types
localStorage.setItem('productTypes', JSON.stringify(productTypes))
```

**Step 3: Update References**
- Update semua form yang menggunakan master data
- Update filter dan dropdown
- Test semua functionality

**Step 4: Remove Old Code**
- Hapus ProductMaster page
- Hapus route
- Hapus menu item

## Troubleshooting

### Data Tidak Muncul
- Cek localStorage di DevTools
- Verify key names
- Check JSON format

### Data Hilang Setelah Refresh
- Pastikan save function dipanggil
- Check localStorage quota
- Verify browser settings

### Dropdown Kosong
- Load master data di useEffect
- Check data structure
- Verify integration code

## Technical Details

### State Management
```javascript
const [productTypes, setProductTypes] = useState([])
const [regions, setRegions] = useState([])
const [units, setUnits] = useState([])
```

### Load Function
```javascript
const loadMasterData = async () => {
  const savedTypes = localStorage.getItem('productTypes')
  if (savedTypes) {
    setProductTypes(JSON.parse(savedTypes))
  } else {
    setProductTypes(['Urea', 'NPK', ...]) // defaults
  }
}
```

### Save Function
```javascript
const saveMasterData = () => {
  localStorage.setItem('productTypes', JSON.stringify(productTypes))
  localStorage.setItem('regions', JSON.stringify(regions))
  localStorage.setItem('units', JSON.stringify(units))
}
```

### CRUD Functions
```javascript
// Create
setProductTypes([...productTypes, newValue])

// Update
const updated = [...productTypes]
updated[index] = newValue
setProductTypes(updated)

// Delete
setProductTypes(productTypes.filter((_, i) => i !== index))
```

## Conclusion

Master Data di Settings memberikan:
- ✅ Centralized management
- ✅ Easy CRUD operations
- ✅ Flexible customization
- ✅ Better organization
- ✅ Scalable structure
- ✅ User-friendly interface
