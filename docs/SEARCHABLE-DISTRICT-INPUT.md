# Searchable District Input

## Overview
Input kecamatan di form toko diubah dari dropdown menjadi searchable input dengan autocomplete untuk UX yang lebih baik.

## Perubahan

### Sebelumnya
- Dropdown select biasa
- Harus scroll untuk cari kecamatan
- Tidak ada search functionality

### Sekarang
- Input text dengan autocomplete
- Real-time search saat mengetik
- Dropdown results yang filtered
- Click to select

## Fitur

### 1. **Search Input**
- Input text biasa
- Placeholder: "Ketik untuk mencari kecamatan..."
- Required field
- Dark mode support

### 2. **Real-time Filtering**
- Filter saat user mengetik
- Case-insensitive search
- Partial match (contains)
- Instant results

### 3. **Dropdown Results**
- Muncul saat focus atau ketik
- Max height 60 (scrollable)
- Hover effect per item
- Click to select

### 4. **No Results State**
- Tampil jika tidak ada hasil
- Link ke Settings untuk tambah kecamatan
- Helpful message

### 5. **Click Outside to Close**
- Dropdown otomatis tutup saat klik di luar
- Event listener cleanup
- Smooth UX

## Implementasi

### State Management
```javascript
const [searchTerm, setSearchTerm] = useState('')
const [showDropdown, setShowDropdown] = useState(false)
const [filteredDistricts, setFilteredDistricts] = useState([])
```

### Search Function
```javascript
const handleSearchChange = (value) => {
  setSearchTerm(value)
  setShowDropdown(true)
  
  if (value.trim() === '') {
    setFilteredDistricts(districts)
  } else {
    const filtered = districts.filter(district =>
      district.name.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredDistricts(filtered)
  }
}
```

### Select Function
```javascript
const handleSelectDistrict = (district) => {
  setFormData({ ...formData, region: district.name })
  setSearchTerm(district.name)
  setShowDropdown(false)
}
```

## UI Components

### Input Field
- Standard text input
- Focus trigger dropdown
- Value bound to searchTerm

### Dropdown Container
- Absolute positioning
- z-index 10
- Full width
- Shadow and border

### Result Items
- Button elements
- Full width
- Left aligned text
- Hover background

### No Results
- Centered message
- Link to Settings
- Helpful text

## User Flow

1. **User clicks input** → Dropdown shows all kecamatan
2. **User types** → Results filtered real-time
3. **User sees results** → Hover to highlight
4. **User clicks item** → Selected, dropdown closes
5. **User clicks outside** → Dropdown closes

## Keyboard Support

### Current
- Type to search
- Click to select

### Future Enhancement
- Arrow keys to navigate
- Enter to select
- Escape to close
- Tab to close

## Styling

### Light Mode
- White background
- Gray border
- Gray hover

### Dark Mode
- Dark gray background
- Dark border
- Lighter hover

### Transitions
- Smooth hover effect
- Instant show/hide

## Performance

### Optimization
- Filter on client side (fast)
- No API calls per keystroke
- Minimal re-renders
- Event listener cleanup

### Scalability
- Works well with 24 kecamatan
- Can handle 100+ items
- Scrollable dropdown

## Accessibility

### Current
- Required field validation
- Error messages
- Placeholder text

### Future Enhancement
- ARIA labels
- Screen reader support
- Keyboard navigation
- Focus management

## Mobile Support

- Touch-friendly
- Scrollable dropdown
- Full width
- Responsive

## Error Handling

### Validation
- Required field check
- Error message display
- Red border on error

### Edge Cases
- Empty search → Show all
- No results → Show message
- Click outside → Close dropdown

## Integration

### With Form
- Part of formData.region
- Validation included
- Submit with form

### With Database
- Load districts from Supabase
- Real-time data
- Sync with Settings

## Best Practices

### Do's ✅
- Filter case-insensitive
- Show all on focus
- Close on select
- Close on outside click

### Don'ts ❌
- Don't API call per keystroke
- Don't block UI
- Don't forget cleanup
- Don't ignore mobile

## Future Enhancements

1. **Keyboard Navigation**
   - Arrow up/down
   - Enter to select
   - Escape to close

2. **Fuzzy Search**
   - Typo tolerance
   - Better matching

3. **Recent Selections**
   - Show recent picks
   - Quick access

4. **Grouped Results**
   - Group by region
   - Better organization

5. **Virtual Scrolling**
   - For large datasets
   - Better performance

## Code Example

```jsx
<div className="relative">
  <input
    type="text"
    value={searchTerm}
    onChange={(e) => handleSearchChange(e.target.value)}
    onFocus={() => setShowDropdown(true)}
    placeholder="Ketik untuk mencari..."
  />
  
  {showDropdown && filteredDistricts.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {filteredDistricts.map((district) => (
        <button
          key={district.id}
          onClick={() => handleSelectDistrict(district)}
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
        >
          {district.name}
        </button>
      ))}
    </div>
  )}
</div>
```

## Testing

### Manual Testing
1. Click input → Dropdown shows
2. Type "ban" → Shows Banyuwangi, Bangorejo
3. Click item → Selected, dropdown closes
4. Click outside → Dropdown closes
5. Clear input → Shows all again

### Edge Cases
- Empty database → Show message
- Single result → Still show dropdown
- Exact match → Show in dropdown
- Special characters → Handle properly

## Browser Support

- Chrome: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support
- Mobile browsers: ✅ Full support

## Conclusion

Searchable input memberikan UX yang lebih baik:
- ✅ Faster to find
- ✅ Better for many options
- ✅ More intuitive
- ✅ Mobile-friendly
- ✅ Professional look
