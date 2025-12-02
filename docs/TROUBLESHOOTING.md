# 🔧 Troubleshooting Guide

## Error: "supabaseUrl is required"

Ini adalah masalah umum dengan Vite yang tidak membaca file `.env` dengan benar.

### ✅ Solusi 1: Restart Dev Server (Paling Umum)

Vite **HARUS** di-restart setiap kali file `.env` dibuat atau diubah.

```bash
# 1. Stop dev server (tekan Ctrl+C di terminal)
# 2. Jalankan ulang
npm run dev
```

### ✅ Solusi 2: Verifikasi File .env

1. Pastikan file `.env` ada di **root folder** (sejajar dengan `package.json`)
2. Buka file `.env` dan pastikan isinya persis seperti ini (tanpa spasi ekstra):

```
VITE_SUPABASE_URL=https://plbgexhgmpyvomjdvhem.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmdleGhnbXB5dm9tamR2aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk0OTMsImV4cCI6MjA4MDE3NTQ5M30.IbGTQ4q0QgfOMGEAKc2PiaSOOj1Z5wvEpjW_Xv_XgAs
```

**PENTING:**
- Tidak ada spasi sebelum atau sesudah `=`
- Tidak ada tanda kutip (`"` atau `'`)
- Tidak ada komentar di baris yang sama

### ✅ Solusi 3: Test Environment Variables

1. Buka browser dan akses: `http://localhost:3000/test-env.html`
2. Halaman ini akan menunjukkan apakah environment variables terdeteksi atau tidak
3. Jika tidak terdeteksi, lanjut ke Solusi 4

### ✅ Solusi 4: Clear Cache & Reinstall

Kadang cache Vite atau node_modules bermasalah:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Hapus cache dan dependencies
rmdir /s /q node_modules
del package-lock.json

# 3. Install ulang
npm install

# 4. Jalankan dev server
npm run dev
```

### ✅ Solusi 5: Hardcode Sementara (Untuk Testing)

Jika semua solusi di atas gagal, Anda bisa hardcode sementara untuk testing:

Edit file `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

// Hardcode sementara untuk testing
const supabaseUrl = 'https://plbgexhgmpyvomjdvhem.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmdleGhnbXB5dm9tamR2aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTk0OTMsImV4cCI6MjA4MDE3NTQ5M30.IbGTQ4q0QgfOMGEAKc2PiaSOOj1Z5wvEpjW_Xv_XgAs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**⚠️ CATATAN:** Ini hanya untuk testing. Jangan commit hardcoded credentials ke Git!

---

## Error Lainnya

### "relation does not exist" atau "table not found"

**Penyebab:** Database schema belum dijalankan di Supabase

**Solusi:**
1. Buka https://supabase.com/dashboard/project/plbgexhgmpyvomjdvhem
2. Klik **SQL Editor**
3. Copy isi file `supabase-schema.sql`
4. Paste dan Run di SQL Editor
5. Refresh aplikasi

### "Failed to fetch" atau "Network error"

**Penyebab:** Koneksi ke Supabase gagal

**Solusi:**
1. Cek koneksi internet
2. Pastikan project Supabase tidak di-pause
3. Cek apakah URL Supabase benar

### Aplikasi blank / tidak muncul apa-apa

**Penyebab:** Error JavaScript yang tidak tertangkap

**Solusi:**
1. Buka Developer Tools (F12)
2. Lihat tab Console untuk error
3. Lihat tab Network untuk request yang gagal
4. Screenshot error dan cari solusinya

---

## Checklist Debugging

Gunakan checklist ini untuk memastikan semua sudah benar:

- [ ] File `.env` ada di root folder (sejajar dengan `package.json`)
- [ ] Isi `.env` sudah benar (tidak ada spasi, kutip, atau karakter aneh)
- [ ] Dev server sudah di-restart setelah membuat/mengubah `.env`
- [ ] Database schema sudah dijalankan di Supabase SQL Editor
- [ ] Semua tabel sudah ada di Supabase Table Editor
- [ ] `npm install` sudah dijalankan
- [ ] Tidak ada error di console browser (F12)
- [ ] Test page `test-env.html` menunjukkan environment variables terdeteksi

---

## Masih Bermasalah?

Jika semua solusi di atas sudah dicoba tapi masih error:

1. Screenshot error lengkap dari browser console (F12)
2. Screenshot isi file `.env`
3. Screenshot struktur folder (pastikan `.env` di root)
4. Cek versi Node.js: `node --version` (minimal v18)
5. Cek versi npm: `npm --version`

Kemungkinan ada masalah spesifik dengan environment Anda yang perlu investigasi lebih lanjut.
