# 🌓 Dark Mode Debugging Guide

## Cara Test Dark Mode

### 1. Test dengan File HTML Sederhana

Buka file `test-darkmode.html` di browser:
```
http://localhost:3000/test-darkmode.html
```

Klik tombol "Toggle Dark Mode" dan lihat apakah:
- Background berubah dari putih ke hitam
- Text berubah warna
- Status menunjukkan "Is Dark: ✅ Yes"

Jika ini bekerja, berarti Tailwind dark mode berfungsi.

### 2. Cek Console Browser

1. Buka aplikasi React
2. Buka DevTools (F12)
3. Klik tab Console
4. Klik toggle dark mode
5. Lihat log yang muncul:

```
🌓 Initial dark mode from localStorage: null
🌓 Using system preference: false
🌓 Dark mode changed to: false
✅ Removed dark class from html
💾 Saved to localStorage: false

// Setelah klik toggle:
Toggle clicked! Current: false New: true
🌓 Dark mode changed to: true
✅ Added dark class to html
💾 Saved to localStorage: true
```

### 3. Cek HTML Element

Di DevTools:
1. Klik tab Elements
2. Lihat tag `<html>`
3. Seharusnya ada/tidak ada class `dark`:

```html
<!-- Light mode -->
<html lang="id">

<!-- Dark mode -->
<html lang="id" class="dark">
```

### 4. Cek LocalStorage

Di DevTools Console, ketik:
```javascript
localStorage.getItem('darkMode')
```

Hasilnya harus:
- `"true"` jika dark mode aktif
- `"false"` jika light mode aktif
- `null` jika belum pernah toggle

## Troubleshooting

### Toggle tidak bekerja sama sekali

**Cek 1: Apakah button ter-klik?**
```javascript
// Di DarkModeToggle.jsx, tambahkan:
const handleToggle = () => {
  alert('Button clicked!')  // Tambahkan ini
  console.log('Toggle clicked! Current:', isDark, 'New:', !isDark)
  setIsDark(!isDark)
}
```

Jika alert tidak muncul, ada masalah dengan event handler.

**Cek 2: Apakah state berubah?**
```javascript
// Di DarkModeToggle.jsx, tambahkan:
console.log('Current isDark state:', isDark)
```

Jika state tidak berubah, ada masalah dengan useState.

**Cek 3: Apakah useEffect dipanggil?**
Lihat console, harus ada log dari useEffect setiap kali toggle.

### Toggle bekerja tapi UI tidak berubah

**Masalah 1: Tailwind config salah**

Cek `tailwind.config.js`:
```javascript
export default {
  darkMode: 'class',  // HARUS ada ini!
  // ...
}
```

**Masalah 2: Class dark tidak diterapkan**

Cek di DevTools Elements, apakah `<html>` punya class `dark`?

Jika tidak, cek `useDarkMode.js`:
```javascript
const root = window.document.documentElement
root.classList.add('dark')  // Pastikan ini dipanggil
```

**Masalah 3: CSS tidak punya dark: variants**

Cek komponen, pastikan ada `dark:` prefix:
```jsx
// ❌ Salah - tidak ada dark variant
<div className="bg-white text-gray-900">

// ✅ Benar - ada dark variant
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

### Toggle bekerja tapi tidak persistent

**Masalah: LocalStorage tidak tersimpan**

Cek console untuk error localStorage.

Coba manual:
```javascript
// Di console browser
localStorage.setItem('darkMode', 'true')
localStorage.getItem('darkMode')  // Harus return "true"
```

Jika error, mungkin browser blocking localStorage (private mode).

### Dark mode aktif tapi warna tidak berubah

**Masalah: Tailwind tidak di-rebuild**

1. Stop dev server (Ctrl+C)
2. Hapus cache: `rmdir /s /q node_modules\.vite`
3. Jalankan ulang: `npm run dev`

**Masalah: CSS specificity**

Cek apakah ada inline styles atau !important yang override:
```jsx
// ❌ Ini akan override dark mode
<div style={{ backgroundColor: 'white' }}>

// ✅ Gunakan className
<div className="bg-white dark:bg-gray-900">
```

## Manual Testing Steps

1. **Buka aplikasi** → Light mode (default)
2. **Klik toggle** → Harus berubah ke dark mode
3. **Refresh browser** → Harus tetap dark mode
4. **Klik toggle lagi** → Kembali ke light mode
5. **Buka tab baru** → Harus light mode (sesuai terakhir)

## Quick Fix

Jika semua gagal, coba hardcode untuk test:

```javascript
// Di src/main.jsx, tambahkan di paling atas:
document.documentElement.classList.add('dark')
```

Jika ini bekerja (UI jadi dark), berarti masalahnya di toggle logic.

## Verifikasi Komponen

### ✅ Checklist

- [ ] `tailwind.config.js` punya `darkMode: 'class'`
- [ ] `useDarkMode.js` ada dan export default
- [ ] `DarkModeToggle.jsx` ada dan import hook
- [ ] `Layout.jsx` import dan render `<DarkModeToggle />`
- [ ] Semua komponen punya `dark:` variants
- [ ] Console tidak ada error
- [ ] LocalStorage bisa diakses
- [ ] HTML element dapat class `dark`

## Debug Commands

```javascript
// Di browser console:

// 1. Cek current state
document.documentElement.classList.contains('dark')

// 2. Manual toggle
document.documentElement.classList.toggle('dark')

// 3. Cek localStorage
localStorage.getItem('darkMode')

// 4. Force dark mode
document.documentElement.classList.add('dark')
localStorage.setItem('darkMode', 'true')

// 5. Force light mode
document.documentElement.classList.remove('dark')
localStorage.setItem('darkMode', 'false')
```

## Masih Bermasalah?

1. Screenshot console dengan semua log
2. Screenshot Elements tab showing `<html>` tag
3. Screenshot localStorage
4. Coba `test-darkmode.html` dan screenshot hasilnya

Dengan info ini, kita bisa debug lebih lanjut!
