import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'

export default function OrderCreate() {
  const navigate = useNavigate()
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState('')
  const [orderItems, setOrderItems] = useState([])
  const [paymentType, setPaymentType] = useState('cash') // cash or credit
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: storesData } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    setStores(storesData || [])
    setProducts(productsData || [])
  }

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, price: 0 }])
  }

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const updateItem = async (index, field, value) => {
    const newItems = [...orderItems]
    newItems[index][field] = value

    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        // Check if store has custom pricing
        let customPrice = null
        if (selectedStore) {
          const { data: customPricing } = await supabase
            .from('custom_pricing')
            .select('custom_price')
            .eq('product_id', value)
            .eq('store_id', selectedStore)
            .single()
          
          customPrice = customPricing?.custom_price
        }

        newItems[index].price = customPrice || product.selling_price
        newItems[index].default_price = product.selling_price
        newItems[index].custom_price = customPrice
        newItems[index].product_name = product.name
        newItems[index].available_stock = product.stock
      }
    }

    setOrderItems(newItems)
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.price)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedStore || orderItems.length === 0) {
      showError('Pilih toko dan tambahkan minimal 1 produk')
      return
    }

    // Validate stock
    for (const item of orderItems) {
      const product = products.find(p => p.id === item.product_id)
      if (item.quantity > product.stock) {
        showError(`Stok ${product.name} tidak mencukupi! Tersedia: ${product.stock}`)
        return
      }
    }

    setLoading(true)

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`
      const totalAmount = calculateTotal()

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          store_id: selectedStore,
          total_amount: totalAmount,
          status: 'pending'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      const items = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(items)
      if (itemsError) throw itemsError

      // Update stock and create logs
      for (const item of orderItems) {
        const product = products.find(p => p.id === item.product_id)
        const newStock = product.stock - item.quantity

        // Update stock
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id)

        // Record stock log
        await supabase.from('stock_logs').insert([{
          product_id: item.product_id,
          type: 'out',
          quantity: -item.quantity, // negative for out
          stock_before: product.stock,
          stock_after: newStock,
          reference_type: 'order',
          reference_id: order.id,
          notes: `Order ${orderNumber}`,
          created_by: 'Admin'
        }])
      }

      // If credit, add to store debt
      if (paymentType === 'credit') {
        const store = stores.find(s => s.id === selectedStore)
        await supabase
          .from('stores')
          .update({ debt: (store.debt || 0) + totalAmount })
          .eq('id', selectedStore)
      }

      showSuccess('Order berhasil dibuat!')
      setTimeout(() => {
        navigate('/orders')
      }, 1000)
    } catch (error) {
      showError('Gagal membuat order: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div>
        <div className="mb-6 lg:mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Daftar Order
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Buat Order Baru</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Tambahkan pesanan baru dari toko dengan multiple produk</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card title="Informasi Order">
            <div className="space-y-4">
              <div>
                <label>Pilih Toko *</label>
                <select
                  required
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                >
                  <option value="">-- Pilih Toko --</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.owner} ({store.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Jenis Pembayaran *</label>
                <select
                  required
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="cash">Tunai</option>
                  <option value="credit">Hutang</option>
                </select>
                {paymentType === 'credit' && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    ⚠️ Total order akan ditambahkan ke hutang toko
                  </p>
                )}
              </div>
            </div>
          </Card>

        <Card 
          title="Produk" 
          action={
            <Button type="button" onClick={addItem}>
              <Plus className="w-5 h-5 inline mr-2" />
              Tambah Produk
            </Button>
          }
        >
          {orderItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Belum ada produk. Klik "Tambah Produk" untuk menambahkan.
            </div>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-end p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <label>Produk *</label>
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    >
                      <option value="">-- Pilih Produk --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - Stok: {product.stock} {product.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label>Jumlah *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={item.available_stock || 999999}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    {item.available_stock && item.quantity > item.available_stock && (
                      <p className="text-xs text-red-500 mt-1">Melebihi stok!</p>
                    )}
                  </div>
                  <div className="w-48">
                    <label>
                      Harga
                      {item.custom_price && (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                          (Harga Khusus)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={item.price || 0}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      className="font-semibold"
                    />
                    {item.default_price && item.price !== item.default_price && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Normal: {formatCurrency(item.default_price)}
                      </p>
                    )}
                  </div>
                  <div className="w-40">
                    <label>Subtotal</label>
                    <input
                      type="text"
                      value={formatCurrency((item.quantity || 0) * (item.price || 0))}
                      readOnly
                      className="bg-gray-100 dark:bg-gray-600 font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Hapus"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-4 mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate('/orders')}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || orderItems.length === 0}>
            {loading ? 'Memproses...' : 'Buat Order'}
          </Button>
        </div>
      </form>
    </div>
    </>
  )
}
