# 🐛 Debug Dark Mode

## Langkah Debug

### 1. Buka Console Browser
1. Tekan F12
2. Klik tab Console
3. Klik toggle dark mode di aplikasi
4. Lihat log yang muncul

**Yang harus muncul:**
```
🔄 Toggle clicked! Current: false
🔄 New value will be: true
🌓 Theme changed to: dark
📋 HTML classes before: 
✅ Added dark class
📋 HTML classes after: dark
```

### 2. Cek HTML Element
1. Di DevTools, klik tab Elements
2. Lihat tag `<html>` paling atas
3. Seharusnya berubah:

**Light mode:**
```html
<html lang="id">
```

**Dark mode:**
```html
<html lang="id" class="dark">
```

### 3. Test Manual di Console
Ketik di console browser:

```javascript
// Cek current state
document.documentElement.classList.contains('dark')

// Force dark mode
document.documentElement.classList.add('dark')

// Force light mode
document.documentElement.classList.remove('dark')

// Cek localStorage
localStorage.getItem('theme')
```

### 4. Test dengan File HTML Sederhana
Buka: `http://localhost:3000/test-dark.html`

Klik "Toggle Dark Mode" dan lihat apakah:
- Background berubah
- Text berubah warna
- Status menunjukkan mode yang benar

### 5. Cek Tailwind Config
Pastikan `tailwind.config.js` punya:
```javascript
darkMode: 'class'
```

### 6. Restart Dev Server
Kadang Vite perlu restart untuk apply config changes:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Kemungkinan Masalah

### Masalah 1: Class tidak ditambahkan
**Gejala:** Console log muncul tapi UI tidak berubah

**Solusi:**
1. Cek apakah `<html>` benar-benar punya class `dark`
2. Inspect element dan lihat computed styles
3. Pastikan tidak ada CSS yang override

### Masalah 2: Toggle tidak trigger re-render
**Gejala:** Klik toggle tapi tidak ada log di console

**Solusi:**
1. Cek apakah `useTheme()` dipanggil dengan benar
2. Pastikan `ThemeProvider` membungkus `<App />`
3. Cek apakah ada error di console

### Masalah 3: Tailwind tidak compile dark: classes
**Gejala:** Class `dark` ada tapi warna tidak berubah

**Solusi:**
1. Stop dev server
2. Hapus cache: `rmdir /s /q node_modules\.vite`
3. Jalankan ulang: `npm run dev`

### Masalah 4: Component tidak punya dark: variants
**Gejala:** Beberapa element berubah, beberapa tidak

**Solusi:**
Pastikan semua element punya `dark:` classes:
```jsx
// ❌ Tidak akan berubah
<div className="bg-white">

// ✅ Akan berubah
<div className="bg-white dark:bg-gray-800">
```

## Quick Fix

Jika semua gagal, coba hardcode untuk test:

```javascript
// Di browser console
document.documentElement.classList.add('dark')
```

Jika ini bekerja (UI jadi dark), berarti masalahnya di toggle logic, bukan di Tailwind.

## Checklist

- [ ] Console log muncul saat toggle
- [ ] `<html>` dapat/kehilangan class `dark`
- [ ] `tailwind.config.js` punya `darkMode: 'class'`
- [ ] `ThemeProvider` membungkus `<App />`
- [ ] Semua komponen punya `dark:` variants
- [ ] Dev server sudah di-restart
- [ ] Tidak ada error di console
- [ ] `test-dark.html` bekerja dengan baik

## Beri Tahu Saya

Setelah coba langkah di atas, screenshot:
1. Console log saat toggle
2. Elements tab showing `<html>` tag
3. Hasil dari `test-dark.html`

Dengan info ini saya bisa bantu debug lebih lanjut!
