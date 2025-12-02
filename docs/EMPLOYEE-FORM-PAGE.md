# Halaman Tambah/Edit Pegawai

## Fitur Baru
Halaman form pegawai yang terpisah untuk menambah dan mengedit data pegawai.

## File yang Dibuat
- `src/pages/EmployeeForm.jsx` - Halaman form tambah/edit pegawai

## File yang Dimodifikasi
- `src/App.jsx` - Menambahkan routing untuk `/employees/new` dan `/employees/edit/:id`
- `src/pages/Employees.jsx` - Menghapus modal form dan menggunakan navigasi ke halaman terpisah

## Fitur Halaman Form

### 1. Informasi Dasar
- Nama lengkap pegawai (required)
- Nomor telepon dengan icon (required)
- Validasi format telepon

### 2. Posisi & Jabatan
- Pilihan role: Driver atau Bongkar Muat
- Dropdown dengan deskripsi

### 3. Informasi Upah
- Upah per karung (untuk loader)
- Upah per pengiriman (untuk driver)
- Preview format currency real-time
- Tips untuk mengisi kedua jenis upah

### 4. UI/UX
- Layout yang bersih dengan section terpisah
- Icon untuk setiap section
- Preview nilai upah dalam format Rupiah
- Tombol kembali ke halaman list
- Loading state saat menyimpan
- Dark mode support penuh

## Cara Menggunakan

### Tambah Pegawai Baru
1. Dari halaman Employees, klik tombol "Tambah Pegawai"
2. Akan diarahkan ke `/employees/new`
3. Isi form dan klik "Simpan Pegawai"
4. Otomatis kembali ke halaman list setelah berhasil

### Edit Pegawai
1. Dari halaman Employees, klik icon Edit pada pegawai
2. Akan diarahkan ke `/employees/edit/:id`
3. Form akan terisi dengan data pegawai
4. Update data dan klik "Update Pegawai"
5. Otomatis kembali ke halaman list setelah berhasil

## Keuntungan Halaman Terpisah
- Form lebih luas dan nyaman diisi
- Tidak perlu modal yang terbatas ruangnya
- URL yang jelas untuk setiap aksi
- Bisa bookmark atau share link form
- Lebih mudah untuk validasi kompleks di masa depan
- Better UX untuk mobile devices
