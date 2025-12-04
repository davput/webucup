# Skeleton Loading - Dashboard

## Overview
Menambahkan skeleton loading animation di Dashboard untuk memberikan feedback visual saat data sedang dimuat dari database.

## Fitur yang Ditambahkan

### 1. **Loading State**
- State `loading` untuk track status loading
- Default: `true` saat pertama kali load
- Berubah jadi `false` setelah data selesai dimuat

### 2. **Skeleton Components**

#### a. SkeletonCard
Skeleton untuk stat cards (Total Produk, Total Stok, dll)

**Fitur:**
- Animasi pulse
- Placeholder untuk title, value, dan subtitle
- Icon placeholder
- Ukuran dan layout sama dengan card asli

**Tampilan:**
- Gray background dengan animasi pulse
- Rounded rectangles untuk text
- Square untuk icon

#### b. SkeletonList
Skeleton untuk list items (Stok Menipis, Top Products, dll)

**Fitur:**
- 5 item placeholder
- Animasi pulse
- Layout flex untuk nama dan nilai
- Background gray dengan rounded corners

**Tampilan:**
- List dengan spacing yang sama
- Placeholder untuk nama produk dan nilai
- Responsive width

#### c. SkeletonChart
Skeleton untuk chart/grafik

**Fitur:**
- Full height sesuai chart asli
- Loading text di center
- Background gray dengan pulse

**Tampilan:**
- Simple placeholder dengan text "Loading chart..."
- Centered content

## Implementasi

### Loading Flow
```javascript
1. Component mount → loading = true
2. Tampilkan skeleton
3. Fetch data dari Supabase
4. Data loaded → loading = false
5. Tampilkan data asli
```

### Conditional Rendering
```jsx
{loading ? (
  <SkeletonComponents />
) : (
  <ActualData />
)}
```

## Animasi

### Tailwind Pulse
Menggunakan class `animate-pulse` dari Tailwind:
- Opacity berubah dari 1 → 0.5 → 1
- Duration: 2 detik
- Infinite loop
- Smooth transition

### Color Scheme
**Light Mode:**
- Background: `bg-gray-200`
- Container: `bg-gray-50`

**Dark Mode:**
- Background: `bg-gray-700`
- Container: `bg-gray-800`

## Struktur Skeleton

### Stats Cards (6 cards)
```
Row 1: 4 cards (Total Produk, Total Stok, Stok Rendah, Total Toko)
Row 2: 2 cards (Order Hari Ini, Pengiriman Hari Ini)
```

### Lists (3 sections)
```
- Stok Menipis (5 items)
- Stok Terbanyak (5 items)
- Distribusi Jenis (5 items)
```

### Chart (1 section)
```
- Penjualan Bulanan
```

## User Experience

### Benefits
1. **Visual Feedback**: User tahu data sedang dimuat
2. **Perceived Performance**: Terasa lebih cepat
3. **No Blank Screen**: Tidak ada layar kosong
4. **Layout Stability**: Tidak ada layout shift
5. **Professional Look**: Tampilan lebih modern

### Loading Time
- Fast connection: ~500ms (skeleton terlihat sebentar)
- Slow connection: 2-5s (skeleton memberikan feedback)
- No connection: Error handling (bisa ditambahkan)

## Responsive Design

### Desktop
- Grid 4 kolom untuk stats row 1
- Grid 2 kolom untuk stats row 2
- Grid 3 kolom untuk lists
- Full width untuk chart

### Mobile
- Grid 1 kolom untuk semua
- Stack vertically
- Same skeleton structure

## Dark Mode Support

Semua skeleton mendukung dark mode:
- `dark:bg-gray-700` untuk placeholder
- `dark:bg-gray-800` untuk container
- Smooth transition saat toggle theme

## Error Handling

### Try-Catch Block
```javascript
try {
  // Load data
} catch (error) {
  console.error('Error loading dashboard:', error)
} finally {
  setLoading(false) // Always stop loading
}
```

### Future Enhancement
- Error state dengan retry button
- Empty state untuk no data
- Partial loading (load sections independently)

## Performance

### Optimization
- Skeleton rendered once
- No re-renders during loading
- Minimal DOM elements
- CSS animations (GPU accelerated)

### Bundle Size
- No additional libraries
- Pure Tailwind CSS
- Inline components

## Best Practices

### Do's ✅
- Match skeleton size dengan actual content
- Use consistent animation timing
- Show skeleton untuk semua sections
- Stop loading di finally block

### Don'ts ❌
- Jangan terlalu banyak detail di skeleton
- Jangan animasi terlalu cepat/lambat
- Jangan skip skeleton untuk fast connections
- Jangan lupa dark mode

## Customization

### Animation Speed
Ubah di Tailwind config:
```javascript
animation: {
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
}
```

### Colors
Ubah background colors:
```jsx
className="bg-blue-100 dark:bg-blue-900" // Blue skeleton
className="bg-green-100 dark:bg-green-900" // Green skeleton
```

### Shape
Ubah rounded corners:
```jsx
className="rounded-full" // Circular
className="rounded-none" // Square
className="rounded-xl" // Extra rounded
```

## Testing

### Manual Testing
1. Refresh dashboard
2. Observe skeleton animation
3. Wait for data load
4. Check smooth transition
5. Test dark mode
6. Test responsive

### Slow Connection Simulation
Chrome DevTools:
1. Open Network tab
2. Select "Slow 3G"
3. Refresh page
4. Observe skeleton longer

## Future Enhancements

### Progressive Loading
- Load stats first
- Then lists
- Finally chart
- Show skeleton per section

### Shimmer Effect
- Add shimmer animation
- More dynamic look
- Better perceived performance

### Content Hints
- Show actual count in skeleton
- Preview data structure
- More informative loading

### Retry Mechanism
- Error state with retry button
- Automatic retry on failure
- Offline detection

## Code Example

```jsx
// Loading state
const [loading, setLoading] = useState(true)

// Skeleton component
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24"></div>
    <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
  </div>
)

// Conditional render
{loading ? <SkeletonCard /> : <ActualCard />}
```

## Browser Support

- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support
- Mobile browsers: ✅ Full support

## Accessibility

- Skeleton tidak mengganggu screen readers
- Loading state announced
- Smooth transition tidak trigger motion sickness
- Respects prefers-reduced-motion

## Conclusion

Skeleton loading meningkatkan UX dengan:
- Visual feedback yang jelas
- Perceived performance yang lebih baik
- Professional appearance
- Smooth loading experience
