# Auto-Select Store di Order Form

## Fitur
Ketika user klik "Buat Order" dari halaman Store Detail, toko otomatis ter-select di form order.

## Implementasi

### 1. StoreDetail.jsx
Pass store ID via URL parameter:
```javascript
<Button onClick={() => navigate(`/orders/create?store=${id}`)}>
  Buat Order Baru
</Button>
```

### 2. OrderNew.jsx
Read URL parameter dan auto-select store:
```javascript
const [searchParams] = useSearchParams()

useEffect(() => {
  const storeId = searchParams.get('store')
  if (storeId && stores.length > 0) {
    const store = stores.find(s => s.id === storeId)
    if (store) {
      setFormData({ ...formData, store_id: storeId })
      setSelectedStore(store)
    }
  }
}, [searchParams, stores])
```

## User Flow

1. User buka Store Detail (contoh: Toko A)
2. User klik "Buat Order Baru"
3. Redirect ke `/orders/create?store=xxx`
4. Form order terbuka dengan Toko A sudah ter-select
5. User langsung bisa tambah produk

## Keuntungan

- ✅ Lebih cepat (skip pilih toko)
- ✅ Mengurangi error (toko sudah benar)
- ✅ UX lebih smooth
- ✅ Context-aware

## URL Format

```
/orders/create?store=<store_id>
```

Contoh:
```
/orders/create?store=123e4567-e89b-12d3-a456-426614174000
```

## Backward Compatibility

- Tanpa parameter → Form kosong (normal)
- Dengan parameter → Auto-select store
- Parameter invalid → Form kosong (fallback)
