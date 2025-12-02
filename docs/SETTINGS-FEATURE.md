# Fitur Pengaturan (Settings)

## Overview
Halaman pengaturan lengkap untuk mengkonfigurasi aplikasi sesuai kebutuhan bisnis.

## 5 Kategori Pengaturan

### 1. **Umum (General)** ⚙️
Informasi perusahaan dan konfigurasi dasar.

**Fitur:**
- Nama Perusahaan
- Alamat Lengkap
- Nomor Telepon
- Email Perusahaan

**Kegunaan:**
- Muncul di invoice dan dokumen
- Identitas perusahaan di sistem
- Kontak untuk komunikasi

### 2. **Tampilan (Appearance)** 🎨
Pengaturan tema dan tampilan aplikasi.

**Fitur:**
- **Mode Terang**: Tampilan terang untuk siang hari
- **Mode Gelap**: Tampilan gelap untuk kenyamanan mata
- **Mode Sistem**: Otomatis mengikuti preferensi sistem

**Cara Kerja:**
- Pilih salah satu dari 3 opsi tema
- Perubahan langsung diterapkan setelah save
- Preferensi disimpan di localStorage
- Tetap tersimpan setelah refresh

### 3. **Notifikasi (Notifications)** 🔔
Kontrol notifikasi yang diterima.

**Toggle Options:**
- ✉️ **Notifikasi Email**: Terima notifikasi via email
- 📦 **Order Baru**: Alert saat ada order baru masuk
- ⚠️ **Peringatan Stok**: Notifikasi saat stok menipis
- 🚚 **Update Pengiriman**: Info status pengiriman

**Kegunaan:**
- Kontrol jenis notifikasi yang diterima
- Hindari spam notifikasi yang tidak perlu
- Fokus pada alert yang penting

### 4. **Bisnis (Business)** 💼
Konfigurasi aturan bisnis dan operasional.

**Pengaturan:**

**a. Jangka Waktu Pembayaran Default**
- Default: 30 hari
- Otomatis diterapkan ke order baru
- Bisa diubah per order

**b. Threshold Stok Rendah**
- Default: 10 karung
- Trigger untuk peringatan stok menipis
- Muncul di laporan stok

**c. Auto-Generate Invoice**
- ON: Invoice dibuat otomatis saat order dibuat
- OFF: Invoice dibuat manual
- Menghemat waktu untuk order rutin

**d. Persetujuan Order**
- ON: Order perlu approval sebelum diproses
- OFF: Order langsung diproses
- Untuk kontrol tambahan

### 5. **Keamanan (Security)** 🔒
Pengaturan backup dan keamanan data.

**Fitur:**

**a. Frekuensi Backup**
- Harian: Backup setiap hari
- Mingguan: Backup setiap minggu
- Bulanan: Backup setiap bulan

**b. Retensi Data**
- Default: 365 hari (1 tahun)
- Data lama dihapus otomatis
- Menghemat storage

**c. Audit Log**
- ON: Catat semua aktivitas pengguna
- OFF: Tidak mencatat aktivitas
- Untuk tracking dan security

## Cara Menggunakan

### Mengubah Pengaturan
1. Buka menu "Pengaturan" di sidebar
2. Pilih kategori dari tab di kiri
3. Ubah pengaturan yang diinginkan
4. Klik "Simpan Pengaturan"
5. Toast notification akan muncul

### Mengubah Tema
1. Masuk ke tab "Tampilan"
2. Klik salah satu dari 3 opsi tema
3. Klik "Simpan Pengaturan"
4. Tema langsung berubah

### Mengatur Notifikasi
1. Masuk ke tab "Notifikasi"
2. Toggle ON/OFF untuk setiap jenis notifikasi
3. Simpan pengaturan

### Konfigurasi Bisnis
1. Masuk ke tab "Bisnis"
2. Atur payment terms dan threshold stok
3. Toggle fitur auto-generate dan approval
4. Simpan pengaturan

## Penyimpanan Data

### LocalStorage
Semua pengaturan disimpan di browser localStorage:
- Key: `appSettings`
- Format: JSON object
- Persistent setelah refresh
- Per browser/device

### Theme Preference
- Key: `theme`
- Values: `light`, `dark`, `system`
- Diterapkan ke `<html>` class

## UI/UX Features

### Sidebar Navigation
- Icon untuk setiap kategori
- Active state yang jelas
- Smooth transition

### Toggle Switches
- Modern toggle design
- Blue color saat active
- Smooth animation

### Theme Cards
- Visual preview dengan icon
- Border highlight saat dipilih
- Deskripsi singkat

### Form Inputs
- Consistent styling
- Dark mode support
- Helper text untuk guidance

### Save Button
- Fixed di bottom
- Icon save
- Toast feedback

## Responsive Design
- Desktop: Sidebar di kiri, content di kanan
- Mobile: Tabs di atas, content di bawah
- Smooth transitions
- Touch-friendly toggles

## Dark Mode Support
Semua elemen mendukung dark mode:
- Background colors
- Text colors
- Border colors
- Toggle switches
- Cards dan inputs

## Best Practices

### Untuk Admin
1. Set informasi perusahaan di awal
2. Pilih tema yang nyaman
3. Aktifkan notifikasi penting
4. Atur payment terms sesuai kebijakan
5. Enable audit log untuk security

### Untuk User
1. Pilih tema sesuai preferensi
2. Atur notifikasi yang relevan
3. Pahami aturan bisnis yang diterapkan

## Future Enhancements

Fitur yang bisa ditambahkan:
- User management & roles
- Email configuration (SMTP)
- Backup & restore manual
- Export/import settings
- Multi-language support
- Custom branding (logo, colors)
- Integration settings (API keys)
- Advanced security (2FA, session timeout)

## Technical Details

### State Management
- React useState untuk form state
- useEffect untuk load settings
- localStorage untuk persistence

### Theme Implementation
```javascript
// Apply theme
if (theme === 'dark') {
  document.documentElement.classList.add('dark')
} else if (theme === 'light') {
  document.documentElement.classList.remove('dark')
} else {
  // System preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
}
```

### Toggle Component
- Custom CSS toggle switch
- Peer classes untuk interaction
- Smooth transitions

## Keuntungan Fitur Settings

1. **Personalisasi**: User bisa customize sesuai preferensi
2. **Fleksibilitas**: Aturan bisnis bisa disesuaikan
3. **Kontrol**: Kontrol penuh atas notifikasi dan fitur
4. **Keamanan**: Backup dan audit log untuk data safety
5. **UX**: Tema yang nyaman meningkatkan produktivitas
6. **Efisiensi**: Auto-generate dan default values menghemat waktu

## Tips Penggunaan

1. **Review Berkala**: Cek pengaturan setiap bulan
2. **Backup**: Pastikan backup aktif
3. **Notifikasi**: Jangan disable semua notifikasi
4. **Tema**: Gunakan mode gelap di malam hari
5. **Payment Terms**: Sesuaikan dengan cash flow
6. **Threshold**: Set berdasarkan lead time supplier
