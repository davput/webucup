# API Endpoints Documentation

Aplikasi ini menggunakan Supabase sebagai backend. Berikut adalah endpoint dan operasi yang tersedia:

## Products (Produk)

### Get All Products
```javascript
const { data } = await supabase.from('products').select('*')
```

### Create Product
```javascript
const { data } = await supabase.from('products').insert([{
  name: 'Pupuk Urea',
  type: 'Nitrogen',
  price: 150000,
  unit: 'karung',
  stock: 100,
  min_stock: 10
}])
```

### Update Product
```javascript
const { data } = await supabase
  .from('products')
  .update({ stock: 90 })
  .eq('id', productId)
```

### Delete Product
```javascript
const { data } = await supabase
  .from('products')
  .delete()
  .eq('id', productId)
```

## Stores (Toko)

### Get All Stores
```javascript
const { data } = await supabase.from('stores').select('*')
```

### Create Store
```javascript
const { data } = await supabase.from('stores').insert([{
  name: 'Toko Tani Makmur',
  owner: 'Budi Santoso',
  phone: '081234567890',
  address: 'Jl. Raya No. 123',
  region: 'Jakarta Timur'
}])
```

### Get Store with Purchase History
```javascript
const { data } = await supabase
  .from('stores')
  .select(`
    *,
    orders (*)
  `)
  .eq('id', storeId)
```

## Orders

### Get All Orders with Relations
```javascript
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    stores (name, region),
    order_items (
      *,
      products (name, unit)
    )
  `)
```

### Create Order
```javascript
// 1. Create order
const { data: order } = await supabase
  .from('orders')
  .insert([{
    order_number: 'ORD-123456',
    store_id: storeId,
    total_amount: 500000,
    status: 'pending'
  }])
  .select()
  .single()

// 2. Create order items
const items = [{
  order_id: order.id,
  product_id: productId,
  quantity: 10,
  price: 50000,
  subtotal: 500000
}]
await supabase.from('order_items').insert(items)

// 3. Update stock
await supabase
  .from('products')
  .update({ stock: newStock })
  .eq('id', productId)

// 4. Record stock history
await supabase.from('stock_history').insert([{
  product_id: productId,
  type: 'out',
  quantity: 10,
  reference_type: 'order',
  reference_id: order.id
}])
```

### Update Order Status
```javascript
const { data } = await supabase
  .from('orders')
  .update({ status: 'processing' })
  .eq('id', orderId)
```

## Deliveries (Pengiriman)

### Get Deliveries with Relations
```javascript
const { data } = await supabase
  .from('deliveries')
  .select(`
    *,
    orders (
      order_number,
      stores (name, region)
    ),
    employees:driver_id (name)
  `)
```

### Create Delivery
```javascript
const { data } = await supabase.from('deliveries').insert([{
  order_id: orderId,
  driver_id: driverId,
  delivery_date: '2024-01-15',
  route_order: 1,
  status: 'scheduled',
  notes: 'Pengiriman pagi'
}])
```

### Assign Workers to Delivery
```javascript
const workers = [
  { delivery_id: deliveryId, employee_id: workerId1, sacks_loaded: 0, wage_earned: 0 },
  { delivery_id: deliveryId, employee_id: workerId2, sacks_loaded: 0, wage_earned: 0 }
]
await supabase.from('delivery_workers').insert(workers)
```

## Employees (Pegawai)

### Get Employees by Role
```javascript
// Get drivers
const { data: drivers } = await supabase
  .from('employees')
  .select('*')
  .eq('role', 'driver')

// Get loaders
const { data: loaders } = await supabase
  .from('employees')
  .select('*')
  .eq('role', 'loader')
```

### Create Employee
```javascript
const { data } = await supabase.from('employees').insert([{
  name: 'Ahmad',
  phone: '081234567890',
  role: 'loader',
  wage_per_sack: 5000,
  wage_per_delivery: 0
}])
```

## Finance (Keuangan)

### Get Payments with Relations
```javascript
const { data } = await supabase
  .from('payments')
  .select(`
    *,
    orders (
      order_number,
      stores (name)
    )
  `)
```

### Create Payment
```javascript
const { data } = await supabase.from('payments').insert([{
  order_id: orderId,
  amount: 500000,
  payment_method: 'cash',
  notes: 'Pembayaran lunas'
}])

// Update store debt
await supabase
  .from('stores')
  .update({ debt: newDebtAmount })
  .eq('id', storeId)
```

## Reports (Laporan)

### Sales Report
```javascript
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    stores (name, region),
    order_items (quantity, subtotal, products (name))
  `)
  .gte('order_date', dateFrom)
  .lte('order_date', dateTo)
```

### Delivery Report
```javascript
const { data } = await supabase
  .from('deliveries')
  .select(`
    *,
    orders (order_number, stores (name, region)),
    employees (name)
  `)
  .gte('delivery_date', dateFrom)
  .lte('delivery_date', dateTo)
```

### Low Stock Report
```javascript
const { data } = await supabase
  .from('products')
  .select('*')

// Filter produk yang stoknya <= min_stock
const lowStockProducts = data?.filter(p => p.stock <= p.min_stock) || []
```

## Dashboard Statistics

### Get Dashboard Stats
```javascript
// Total stock
const { data: products } = await supabase.from('products').select('stock')
const totalStock = products.reduce((sum, p) => sum + p.stock, 0)

// Total stores
const { count: storeCount } = await supabase
  .from('stores')
  .select('*', { count: 'exact', head: true })

// Today's orders
const today = new Date().toISOString().split('T')[0]
const { count: orderCount } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .gte('order_date', today)

// Today's deliveries
const { count: deliveryCount } = await supabase
  .from('deliveries')
  .select('*', { count: 'exact', head: true })
  .eq('delivery_date', today)
```

## Real-time Subscriptions (Optional)

### Subscribe to Order Changes
```javascript
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order changed:', payload)
    }
  )
  .subscribe()
```

### Subscribe to Stock Changes
```javascript
const subscription = supabase
  .channel('products')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'products' },
    (payload) => {
      if (payload.new.stock <= payload.new.min_stock) {
        alert(`Stok ${payload.new.name} menipis!`)
      }
    }
  )
  .subscribe()
```
