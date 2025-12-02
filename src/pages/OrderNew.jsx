import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import CurrencyInput from '../components/CurrencyInput'
import { formatCurrency } from '../lib/utils'
import { PAYMENT_METHOD_LABELS } from '../lib/constants'
import { useToast } from '../hooks/useToast'

export default function OrderNew() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  
  const [formData, setFormData] = useState({
    store_id: '',
    payment_method: 'cash',
    due_date: '',
    notes: ''
  })

  const [orderItems, setOrderItems] = useState([])
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    quantity: 1,
    price: 0,
    manual_price: false
  })

  // Search states
  const [storeSearch, setStoreSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  useEffect(() => {
    fetchStores()
    fetchProducts()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('.relative')) {
        setShowStoreDropdown(false)
        setShowProductDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (formData.store_id) {
      const store = stores.find(s => s.id === formData.store_id)
      setSelectedStore(store)
    }
  }, [formData.store_id, stores])

  useEffect(() => {
    if (currentItem.product_id && !currentItem.manual_price) {
      fetchProductPrice()
    }
  }, [currentItem.product_id, formData.store_id])

  async function fetchStores() {
    const { data } = await supabase
      .from('stores')
      .select('*')
      .order('name')
    setStores(data || [])
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')
    setProducts(data || [])
  }

  async function fetchProductPrice() {
    if (!currentItem.product_id || !formData.store_id) return

    // Check custom pricing first
    const { data: customPrice } = await supabase
      .from('custom_pricing')
      .select('custom_price')
      .eq('product_id', currentItem.product_id)
      .eq('store_id', formData.store_id)
      .single()

    if (customPrice) {
      setCurrentItem(prev => ({ ...prev, price: customPrice.custom_price }))
      return
    }

    // Use default selling price
    const product = products.find(p => p.id === currentItem.product_id)
    if (product) {
      setCurrentItem(prev => ({ ...prev, price: product.selling_price }))
    }
  }

  function addItem() {
    if (!currentItem.product_id || currentItem.quantity <= 0 || currentItem.price <= 0) {
      showToast('Lengkapi data produk', 'error')
      return
    }

    const product = products.find(p => p.id === currentItem.product_id)
    
    // Check if product already in list
    const existingIndex = orderItems.findIndex(item => item.product_id === currentItem.product_id)
    if (existingIndex >= 0) {
      const updated = [...orderItems]
      updated[existingIndex].quantity += currentItem.quantity
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].price
      setOrderItems(updated)
    } else {
      setOrderItems([...orderItems, {
        product_id: currentItem.product_id,
        product_name: product.name,
        product_unit: product.unit,
        quantity: currentItem.quantity,
        price: currentItem.price,
        subtotal: currentItem.quantity * currentItem.price
      }])
    }

    // Reset current item
    setCurrentItem({
      product_id: '',
      quantity: 1,
      price: 0,
      manual_price: false
    })
  }

  function removeItem(index) {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  async function checkStock() {
    for (const item of orderItems) {
      const { data: product } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', item.product_id)
        .single()

      if (product && product.stock < item.quantity) {
        return {
          sufficient: false,
          message: `Stok ${product.name} tidak mencukupi. Tersedia: ${product.stock}, Dibutuhkan: ${item.quantity}`
        }
      }
    }
    return { sufficient: true }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!formData.store_id) {
      showToast('Pilih toko terlebih dahulu', 'error')
      return
    }

    if (orderItems.length === 0) {
      showToast('Tambahkan minimal 1 produk', 'error')
      return
    }

    setLoading(true)

    try {
      // Check stock
      const stockCheck = await checkStock()
      if (!stockCheck.sufficient) {
        showToast(stockCheck.message, 'error')
        setLoading(false)
        return
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`
      const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0)

      // Create order with minimal fields first
      const orderData = {
        order_number: orderNumber,
        store_id: formData.store_id,
        total_amount: totalAmount,
        status: 'pending_delivery'
      }

      // Try to add new fields (will be ignored if columns don't exist)
      try {
        if (formData.payment_method) {
          orderData.payment_method = formData.payment_method
          orderData.payment_status = 'unpaid'
        }
        if (formData.payment_method === 'tempo' && formData.due_date) {
          orderData.due_date = formData.due_date
        }
        if (formData.notes) {
          orderData.notes = formData.notes
        }
      } catch (e) {
        console.log('Some fields not available in database')
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('Order insert error:', orderError)
        throw orderError
      }

      // Create order items
      const itemsToInsert = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Create invoice (if table exists)
      try {
        const invoiceNumber = `INV-${Date.now()}`
        await supabase.from('invoices').insert({
          order_id: order.id,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          paid_amount: 0,
          status: 'unpaid',
          due_date: formData.payment_method === 'tempo' ? formData.due_date : null
        })
      } catch (invoiceError) {
        console.log('Invoice table not found, skipping invoice creation')
      }

      // Update store debt if payment method is tempo
      if (formData.payment_method === 'tempo') {
        const { data: store } = await supabase
          .from('stores')
          .select('debt')
          .eq('id', formData.store_id)
          .single()

        const newDebt = (store?.debt || 0) + totalAmount
        await supabase
          .from('stores')
          .update({ debt: newDebt })
          .eq('id', formData.store_id)
      }

      showToast('Order berhasil dibuat', 'success')
      navigate(`/orders/${order.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      
      // Show more detailed error message
      let errorMessage = error.message
      
      if (error.code === 'PGRST204' || error.message.includes('column')) {
        errorMessage = '⚠️ Kolom database tidak lengkap. Jalankan script: add-order-columns.sql di Supabase SQL Editor.'
      } else if (error.message.includes('violates foreign key')) {
        errorMessage = 'Data toko atau produk tidak valid. Pastikan toko dan produk yang dipilih ada di database.'
      } else if (error.code === '406' || error.code === '400') {
        errorMessage = '⚠️ Struktur tabel orders belum sesuai. Jalankan: add-order-columns.sql'
      }
      
      showToast(errorMessage, 'error')
      
      // Show alert with instructions
      if (error.code === 'PGRST204' || error.code === '406' || error.code === '400') {
        setTimeout(() => {
          alert(`SOLUSI CEPAT:

1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file: add-order-columns.sql
3. Paste dan Run
4. Refresh halaman ini dan coba lagi

File add-order-columns.sql ada di root project Anda.`)
        }, 1000)
      }
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  const selectedProduct = products.find(p => p.id === currentItem.product_id)

  // Filtered stores based on search
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.owner.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.region.toLowerCase().includes(storeSearch.toLowerCase())
  )

  // Filtered products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.type?.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Buat Order Baru</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Buat order distribusi pupuk ke toko
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informasi Toko</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cari Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required={!formData.store_id}
                value={selectedStore ? selectedStore.name : storeSearch}
                onChange={(e) => {
                  setStoreSearch(e.target.value)
                  setShowStoreDropdown(true)
                  if (!e.target.value) {
                    setFormData({ ...formData, store_id: '' })
                  }
                }}
                onFocus={() => setShowStoreDropdown(true)}
                placeholder="Ketik nama toko, pemilik, atau wilayah..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              
              {showStoreDropdown && storeSearch && !selectedStore && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredStores.length > 0 ? (
                    filteredStores.map(store => (
                      <div
                        key={store.id}
                        onClick={() => {
                          setFormData({ ...formData, store_id: store.id })
                          setStoreSearch('')
                          setShowStoreDropdown(false)
                        }}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{store.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {store.owner} • {store.region}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                      Toko tidak ditemukan
                    </div>
                  )}
                </div>
              )}
              
              {selectedStore && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, store_id: '' })
                    setStoreSearch('')
                  }}
                  className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>

            {selectedStore && (
              <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Pemilik:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{selectedStore.owner}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Telepon:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{selectedStore.phone}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Alamat:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{selectedStore.address}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hutang Saat Ini:</span>
                    <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(selectedStore.debt || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tambah Produk</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-4 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cari Produk
              </label>
              <input
                type="text"
                value={selectedProduct ? selectedProduct.name : productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value)
                  setShowProductDropdown(true)
                  if (!e.target.value) {
                    setCurrentItem({ ...currentItem, product_id: '', manual_price: false })
                  }
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Ketik nama produk atau jenis..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              
              {showProductDropdown && productSearch && !selectedProduct && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setCurrentItem({ ...currentItem, product_id: product.id, manual_price: false })
                          setProductSearch('')
                          setShowProductDropdown(false)
                        }}
                        className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {product.type} • {product.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              Stok: {product.stock}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatCurrency(product.selling_price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                      Produk tidak ditemukan
                    </div>
                  )}
                </div>
              )}
              
              {selectedProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentItem({ ...currentItem, product_id: '', manual_price: false })
                    setProductSearch('')
                  }}
                  className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah
              </label>
              <input
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Harga Satuan
              </label>
              <CurrencyInput
                value={currentItem.price}
                onChange={(value) => setCurrentItem({ ...currentItem, price: value, manual_price: true })}
                className="w-full"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtotal
              </label>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-semibold">
                {formatCurrency(currentItem.quantity * currentItem.price)}
              </div>
            </div>

            <div className="md:col-span-1 flex items-end">
              <Button type="button" onClick={addItem} className="w-full">
                Tambah
              </Button>
            </div>
          </div>

          {selectedProduct && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Stok tersedia: <span className="font-semibold">{selectedProduct.stock} {selectedProduct.unit}</span>
            </div>
          )}

          {/* Order Items List */}
          {orderItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Daftar Produk</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Harga</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Subtotal</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.product_name}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                          {item.quantity} {item.product_unit}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-lg text-gray-900 dark:text-gray-100">
                        {formatCurrency(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informasi Pembayaran</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Metode Pembayaran <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {formData.payment_method === 'tempo' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tanggal Jatuh Tempo <span className="text-gray-400">(Opsional)</span>
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kosongkan jika tidak ada jatuh tempo spesifik
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Tambahkan catatan untuk order ini..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/order-management')}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading || orderItems.length === 0}
          >
            {loading ? 'Menyimpan...' : 'Simpan Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
