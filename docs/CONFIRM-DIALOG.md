# Custom Confirm Dialog

## Overview
Custom modal konfirmasi dengan UI modern dan animasi smooth untuk menggantikan `window.confirm()` yang plain.

## Fitur

### 1. **Modern UI**
- Modal dengan backdrop blur
- Shadow dan rounded corners
- Icon dengan background
- Styled message box

### 2. **Animasi**
- Backdrop fade in
- Modal slide up
- Icon bounce
- Smooth transitions

### 3. **Dark Mode Support**
- Full dark mode support
- Proper contrast
- Readable text

### 4. **2 Tipe Dialog**

#### Warning (Yellow)
- Icon: AlertTriangle
- Color: Yellow/Orange
- Untuk peringatan yang perlu perhatian

#### Danger (Red)
- Icon: AlertTriangle
- Color: Red
- Untuk aksi berbahaya

## Komponen

### Props
```javascript
{
  isOpen: boolean,        // Show/hide dialog
  onClose: function,      // Close handler
  onConfirm: function,    // Confirm handler
  title: string,          // Dialog title
  message: string,        // Dialog message (support \n)
  type: 'warning'|'danger' // Dialog type
}
```

### Usage
```javascript
const [confirmDialog, setConfirmDialog] = useState({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: null
})

// Show dialog
setConfirmDialog({
  isOpen: true,
  title: '⚠️ Peringatan',
  message: 'Apakah Anda yakin?',
  onConfirm: () => doSomething()
})

// Render
<ConfirmDialog
  isOpen={confirmDialog.isOpen}
  onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
  onConfirm={confirmDialog.onConfirm}
  title={confirmDialog.title}
  message={confirmDialog.message}
  type="warning"
/>
```

## Animasi CSS

### fadeIn
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
- Duration: 0.2s
- Untuk backdrop

### slideUp
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
- Duration: 0.3s
- Untuk modal

### bounce
```css
.animate-bounce
```
- Tailwind built-in
- Untuk icon

## Styling

### Backdrop
- Black with 50% opacity
- Backdrop blur
- Full screen overlay
- Click to close

### Modal
- White/gray-800 background
- Rounded-xl
- Shadow-2xl
- Max width 28rem
- Centered

### Icon Container
- 12x12 size
- Rounded full
- Background sesuai type
- Bounce animation

### Message Box
- Background sesuai type
- Border sesuai type
- Padding 4
- Rounded-lg
- Whitespace pre-line (support \n)

### Buttons
- Flex gap 3
- Equal width (flex-1)
- Secondary untuk Cancel
- Yellow untuk Confirm

## Use Cases di OrderNew

### 1. Stok Habis (Stock = 0)
```javascript
setConfirmDialog({
  isOpen: true,
  title: '⚠️ Peringatan Stok Habis',
  message: `Produk "${product.name}" memiliki stok 0.\n\nApakah Anda yakin ingin menambahkan produk ini tanpa update stok terlebih dahulu?`,
  onConfirm: () => proceedAddItem(product)
})
```

### 2. Stok Tidak Cukup
```javascript
setConfirmDialog({
  isOpen: true,
  title: '⚠️ Peringatan Stok Tidak Cukup',
  message: `Produk: ${product.name}\nStok tersedia: ${product.stock} ${product.unit}\nJumlah order: ${currentItem.quantity} ${product.unit}\n\nKekurangan: ${currentItem.quantity - product.stock} ${product.unit}\n\nApakah Anda yakin ingin melanjutkan?`,
  onConfirm: () => proceedAddItem(product)
})
```

## Keuntungan vs window.confirm()

### window.confirm()
- ❌ UI browser default (jelek)
- ❌ Tidak bisa di-style
- ❌ Tidak ada animasi
- ❌ Tidak support dark mode
- ❌ Blocking (freeze UI)

### ConfirmDialog
- ✅ UI modern dan custom
- ✅ Full styling control
- ✅ Smooth animations
- ✅ Dark mode support
- ✅ Non-blocking
- ✅ Consistent dengan app design

## Responsive

- Mobile: Full width dengan padding
- Desktop: Max width 28rem
- Centered di semua ukuran
- Touch-friendly buttons

## Accessibility

### Current
- Close button
- Backdrop click to close
- Clear actions

### Future Enhancement
- Focus trap
- Escape key to close
- ARIA labels
- Keyboard navigation

## Browser Support

- Chrome: ✅
- Firefox: ✅
- Safari: ✅
- Edge: ✅
- Mobile: ✅

## Future Enhancements

1. **More Types**
   - Success (green)
   - Info (blue)
   - Error (red)

2. **Custom Actions**
   - 3 buttons
   - Custom button labels
   - Custom button colors

3. **Rich Content**
   - HTML content
   - Images
   - Lists

4. **Animations**
   - More animation options
   - Custom timing
   - Exit animations

## Conclusion

ConfirmDialog memberikan:
- ✅ Professional look
- ✅ Better UX
- ✅ Consistent design
- ✅ Smooth animations
- ✅ Dark mode support
- ✅ Reusable component
