# Keyboard Navigation untuk Searchable Input

## Fitur
User bisa menggunakan keyboard untuk navigasi dan memilih toko dari dropdown.

## Keyboard Shortcuts

### Arrow Down (↓)
- Pindah ke item berikutnya
- Highlight item yang dipilih
- Tidak bisa melewati item terakhir

### Arrow Up (↑)
- Pindah ke item sebelumnya
- Highlight item yang dipilih
- Kembali ke -1 jika di item pertama

### Enter (⏎)
- Pilih item yang di-highlight
- Close dropdown
- Set toko terpilih

### Escape (Esc)
- Close dropdown
- Reset selection index

## Visual Feedback

### Item Normal
- Background: white/gray-800
- Hover: gray-100/gray-700

### Item Selected (Keyboard)
- Background: blue-50/blue-900/30
- Lebih terang dari hover

## Implementasi

### State
```javascript
const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1)
```

### onKeyDown Handler
```javascript
onKeyDown={(e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    setSelectedStoreIndex(prev => 
      prev < filteredStores.length - 1 ? prev + 1 : prev
    )
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setSelectedStoreIndex(prev => prev > 0 ? prev - 1 : -1)
  } else if (e.key === 'Enter' && selectedStoreIndex >= 0) {
    e.preventDefault()
    const store = filteredStores[selectedStoreIndex]
    // Select store
  } else if (e.key === 'Escape') {
    setShowStoreDropdown(false)
  }
}
```

### Highlight Item
```javascript
className={`... ${
  index === selectedStoreIndex
    ? 'bg-blue-50 dark:bg-blue-900/30'
    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
}`}
```

## User Flow

1. User ketik di input → Dropdown muncul
2. User tekan ↓ → Item pertama di-highlight
3. User tekan ↓ lagi → Item kedua di-highlight
4. User tekan Enter → Item terpilih, dropdown tutup
5. Atau user klik item → Item terpilih

## Keuntungan

- ✅ Lebih cepat (tidak perlu mouse)
- ✅ Accessibility friendly
- ✅ Power user friendly
- ✅ Professional UX
- ✅ Keyboard-first workflow

## Accessibility

- Keyboard navigation support
- Visual feedback yang jelas
- Escape untuk cancel
- Enter untuk confirm

## Browser Support

- Chrome: ✅
- Firefox: ✅
- Safari: ✅
- Edge: ✅
