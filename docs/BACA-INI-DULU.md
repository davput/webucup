# ⚠️ BACA INI DULU - Cara Mengatasi Error

## Error yang Anda Alami

```
supabaseUrl is required
```

## 🔥 SOLUSI CEPAT (Ikuti Langkah Ini)

### Langkah 1: Stop Dev Server

Di terminal tempat Anda menjalankan `npm run dev`, tekan:
```
Ctrl + C
```

### Langkah 2: Verifikasi File .env

Buka file `.env` di root folder (sejajar dengan `package.json`).

Pastikan isinya **PERSIS** seperti ini (copy-paste jika perlu):

```
VITE_SUPABASE_URL=https://plbgexhgmpyvomjdvhem.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmdleGhnbXB5dm9tamR2aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk0OTMsImV4cCI6MjA4MDE3NTQ5M30.IbGTQ4q0QgfOMGEAKc2PiaSOOj1Z5wvEpjW_Xv_XgAs
```

**PENTING:**
- ❌ JANGAN ada spasi sebelum/sesudah tanda `=`
- ❌ JANGAN ada tanda kutip (`"` atau `'`)
- ❌ JANGAN ada baris kosong di tengah
- ✅ Harus ada 2 baris saja

### Langkah 3: Jalankan Ulang Dev Server

```bash
npm run dev
```

### Langkah 4: Test Environment Variables

Setelah dev server jalan, buka browser dan akses:

```
http://localhost:3000/test-env.html
```

Halaman ini akan menunjukkan apakah environment variables terdeteksi atau tidak.

---

## 🔍 Jika Masih Error

### Opsi A: Clear Cache & Reinstall

```bash
# Stop dev server dulu (Ctrl+C)

# Hapus node_modules dan package-lock.json
rmdir /s /q node_modules
del package-lock.json

# Install ulang
npm install

# Jalankan dev server
npm run dev
```

### Opsi B: Hardcode Sementara (Untuk Testing Cepat)

Jika Anda ingin langsung test aplikasi tanpa ribet dengan `.env`:

1. Buka file `src/lib/supabase.js`
2. Ganti seluruh isinya dengan:

```javascript
import { createClient } from '@supabase/supabase-js'

// Hardcode untuk testing
const supabaseUrl = 'https://plbgexhgmpyvomjdvhem.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmdleGhnbXB5dm9tamR2aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk0OTMsImV4cCI6MjA4MDE3NTQ5M30.IbGTQ4q0QgfOMGEAKc2PiaSOOj1Z5wvEpjW_Xv_XgAs'

console.log('✅ Using hardcoded Supabase credentials')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

3. Save file
4. Aplikasi akan otomatis reload dan seharusnya bisa jalan

**⚠️ CATATAN:** Ini hanya untuk testing. Nanti kembalikan ke versi `.env` untuk production.

---

## 📋 Checklist Debugging

Centang yang sudah Anda lakukan:

- [ ] File `.env` ada di root folder (sejajar dengan `package.json`)
- [ ] Isi `.env` sudah benar (tidak ada spasi atau kutip)
- [ ] Dev server sudah di-stop dan di-restart
- [ ] Sudah coba buka `http://localhost:3000/test-env.html`
- [ ] Sudah coba clear cache & reinstall (Opsi A)
- [ ] Sudah coba hardcode (Opsi B)

---

## 🆘 Masih Bermasalah?

Jika semua langkah di atas sudah dicoba tapi masih error:

1. **Screenshot error** yang muncul di browser console (tekan F12)
2. **Screenshot isi file** `.env` Anda
3. **Screenshot struktur folder** Anda (pastikan `.env` di root)
4. Cek versi Node.js: `node --version` (harus minimal v18)

Kemungkinan ada masalah spesifik dengan environment Anda.

---

## ✅ Setelah Berhasil

Setelah aplikasi bisa jalan, jangan lupa:

1. **Setup database** di Supabase (jalankan `supabase-schema.sql`)
2. **Tambah data sample** (lihat `QUICK-START.md`)
3. **Mulai gunakan aplikasi**

Selamat mencoba! 🚀
