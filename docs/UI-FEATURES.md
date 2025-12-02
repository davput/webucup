# 🎨 UI Features Documentation

## ✨ Fitur UI yang Tersedia

### 1. 🌓 Dark Mode
Aplikasi mendukung dark mode dengan toggle yang mudah diakses.

**Cara Menggunakan:**
- Klik icon bulan/matahari di header (pojok kanan atas)
- Preferensi dark mode akan tersimpan di localStorage
- Otomatis terapkan saat buka aplikasi lagi

**Implementasi:**
- Menggunakan Tailwind CSS dark mode dengan class strategy
- Custom hook `useDarkMode` untuk state management
- Smooth transition antar mode

### 2. 📱 Responsive Design

#### Mobile (< 640px)
- Sidebar tersembunyi, bisa dibuka dengan hamburger menu
- Layout 1 kolom untuk semua konten
- Card dan tabel dioptimalkan untuk layar kecil
- Touch-friendly button sizes
- Sticky header untuk navigasi mudah

#### Tablet (640px - 1024px)
- Layout 2 kolom untuk dashboard stats
- Sidebar tetap tersembunyi, bisa dibuka
- Tabel dengan horizontal scroll
- Optimized spacing

#### Desktop (> 1024px)
- Sidebar selalu terlihat
- Layout 4 kolom untuk dashboard stats
- Full table view tanpa scroll
- Spacious layout

### 3. 🎨 Design System

#### Colors
**Primary (Green):**
- Light: `#22c55e` (green-500)
- Dark: `#16a34a` (green-600)
- Digunakan untuk: Primary buttons, active states, success indicators

**Background:**
- Light mode: `#f9fafb` (gray-50)
- Dark mode: `#111827` (gray-900)

**Cards:**
- Light mode: `#ffffff` (white)
- Dark mode: `#1f2937` (gray-800)

#### Typography
- Heading: 2xl-3xl, font-bold
- Subheading: lg-xl, font-semibold
- Body: sm-base, font-normal
- Caption: xs-sm, font-medium

#### Spacing
- Mobile: p-4, gap-4
- Desktop: p-6-8, gap-6-8

#### Border Radius
- Small: rounded-lg (8px)
- Medium: rounded-xl (12px)
- Large: rounded-2xl (16px)

### 4. 🧩 Komponen UI

#### StatCard
Kartu statistik dengan icon dan gradient background.
```jsx
<StatCard 
  title="Total Stok" 
  value={100} 
  icon={Package} 
  color="blue" 
/>
```

#### Card
Container dengan border dan shadow.
```jsx
<Card title="Judul" action={<Button>Action</Button>}>
  Content here
</Card>
```

#### Button
Button dengan 3 variant: primary, secondary, danger.
```jsx
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

#### Modal
Modal dialog dengan backdrop dan smooth animation.
```jsx
<Modal isOpen={isOpen} onClose={handleClose} title="Title">
  Modal content
</Modal>
```

#### Table
Responsive table dengan dark mode support.
```jsx
<Table headers={['Name', 'Price', 'Stock']}>
  <TableRow>
    <TableCell>Product 1</TableCell>
    <TableCell>Rp 100,000</TableCell>
    <TableCell>50</TableCell>
  </TableRow>
</Table>
```

#### MobileCard
Card khusus untuk tampilan mobile dengan action buttons.
```jsx
<MobileCard
  title="Product Name"
  subtitle="Category"
  badge={{ text: 'Low Stock', className: 'bg-red-100 text-red-800' }}
  details={[
    { label: 'Price', value: 'Rp 100,000' },
    { label: 'Stock', value: '10' }
  ]}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

#### EmptyState
Tampilan ketika tidak ada data.
```jsx
<EmptyState
  icon={Package}
  title="Belum ada produk"
  description="Tambahkan produk pertama Anda"
  action={<Button>Tambah Produk</Button>}
/>
```

### 5. 🎭 Animations & Transitions

**Hover Effects:**
- Cards: shadow-sm → shadow-md
- Buttons: scale + brightness
- Links: color transition

**Page Transitions:**
- Smooth fade in
- Stagger animation untuk lists

**Modal:**
- Backdrop fade in
- Modal slide up + fade in

**Sidebar (Mobile):**
- Slide from left
- Backdrop fade in

### 6. ♿ Accessibility

**Keyboard Navigation:**
- Tab untuk navigasi
- Enter/Space untuk activate
- Escape untuk close modal

**Screen Reader:**
- Semantic HTML
- ARIA labels
- Alt text untuk images

**Color Contrast:**
- WCAG AA compliant
- High contrast di dark mode

### 7. 📊 Charts & Graphs

**Recharts Integration:**
- Responsive charts
- Dark mode support
- Custom tooltips
- Smooth animations

### 8. 🔍 Search & Filter

**Features:**
- Real-time search
- Filter by category
- Sort by multiple fields
- Pagination

### 9. 📤 Export Features

**PDF Export:**
- Custom styling
- Logo & branding
- Table formatting
- Dark mode compatible

**Excel Export:**
- Multiple sheets
- Formatted cells
- Auto-width columns

### 10. 🎯 Best Practices

**Performance:**
- Lazy loading untuk images
- Code splitting
- Memoization untuk expensive operations
- Debounce untuk search

**UX:**
- Loading states
- Error handling
- Success feedback
- Confirmation dialogs

**Code Quality:**
- Component reusability
- Consistent naming
- Proper prop types
- Clean code structure

## 🚀 Customization

### Mengubah Warna Primary

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#your-color',
        600: '#your-darker-color',
      }
    }
  }
}
```

### Mengubah Font

Edit `src/index.css`:
```css
body {
  font-family: 'Your Font', sans-serif;
}
```

### Menambah Breakpoint

Edit `tailwind.config.js`:
```javascript
theme: {
  screens: {
    'xs': '475px',
    // ... existing breakpoints
  }
}
```

## 📱 Testing Responsive

**Browser DevTools:**
1. Buka DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test berbagai ukuran layar

**Recommended Test Sizes:**
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1440px (Laptop)

## 🎨 Design Tokens

```javascript
// Spacing
spacing: {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
}

// Shadows
shadows: {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
}

// Transitions
transitions: {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
}
```

## 🔥 Tips & Tricks

1. **Gunakan `lg:` prefix** untuk styling desktop
2. **Mobile-first approach** - style mobile dulu, lalu tambah breakpoint
3. **Dark mode** - selalu test di kedua mode
4. **Touch targets** - minimal 44x44px untuk mobile
5. **Loading states** - selalu tampilkan feedback saat loading
6. **Error handling** - user-friendly error messages
7. **Confirmation** - konfirmasi untuk destructive actions

Selamat menggunakan! 🎉
