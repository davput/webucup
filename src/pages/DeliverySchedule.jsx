import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useToast } from '../hooks/useToast'

export default function DeliverySchedule() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pendingOrders, setPendingOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loaders, setLoaders] = useState([])
  
  const [formData, setFormData] = useState({
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
    truck_number: '',
    driver_id: '',
    route_notes: ''
  })

  const [selectedOrders, setSelectedOrders] = useState([])
  const [selectedLoaders, setSelectedLoaders] = useState([])

  useEffect(() => {
    fetchPendingOrders()
    fetchDrivers()
    fetchLoaders()

    // Pre-select order if coming from order detail
    const orderId = searchParams.get('order')
    if (orderId) {
      setSelectedOrders([{ order_id: orderId, route_order: 1 }])
    }
  }, [])

  async function fetchPendingOrders() {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        stores (name, region, address),
        order_items (
          quantity,
          products (name, unit)
        )
      `)
      .eq('status', 'pending_delivery')
      .order('order_date', { ascending: false })

    setPendingOrders(data || [])
  }

  async function fetchDrivers() {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('role', 'driver')
      .order('name')
    setDrivers(data || [])
  }

  async function fetchLoaders() {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('role', 'loader')
      .order('name')
    setLoaders(data || [])
  }

  function toggleOrderSelection(orderId) {
    const exists = selectedOrders.find(o => o.order_id === orderId)
    if (exists) {
      setSelectedOrders(selectedOrders.filter(o => o.order_id !== orderId))
    } else {
      setSelectedOrders([
        ...selectedOrders,
        { order_id: orderId, route_order: selectedOrders.length + 1 }
      ])
    }
  }

  function moveOrderUp(index) {
    if (index === 0) return
    const newOrders = [...selectedOrders]
    ;[newOrders[index - 1], newOrders[index]] = [newOrders[index], newOrders[index - 1]]
    // Update route_order
    newOrders.forEach((order, i) => {
      order.route_order = i + 1
    })
    setSelectedOrders(newOrders)
  }

  function moveOrderDown(index) {
    if (index === selectedOrders.length - 1) return
    const newOrders = [...selectedOrders]
    ;[newOrders[index], newOrders[index + 1]] = [newOrders[index + 1], newOrders[index]]
    // Update route_order
    newOrders.forEach((order, i) => {
      order.route_order = i + 1
    })
    setSelectedOrders(newOrders)
  }

  function toggleLoaderSelection(loaderId) {
    if (selectedLoaders.includes(loaderId)) {
      setSelectedLoaders(selectedLoaders.filter(id => id !== loaderId))
    } else {
      setSelectedLoaders([...selectedLoaders, loaderId])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (selectedOrders.length === 0) {
      showToast('Pilih minimal 1 order untuk dikirim', 'error')
      return
    }

    if (!formData.driver_id) {
      showToast('Pilih sopir untuk pengiriman', 'error')
      return
    }

    setLoading(true)

    try {
      // Generate delivery number
      const deliveryNumber = `DEL-${Date.now()}`

      // Calculate total sacks
      const orderDetails = selectedOrders.map(so => {
        const order = pendingOrders.find(o => o.id === so.order_id)
        return order
      })

      const totalSacks = orderDetails.reduce((sum, order) => {
        return sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      }, 0)

      // Create delivery
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          delivery_number: deliveryNumber,
          delivery_date: formData.delivery_date,
          truck_number: formData.truck_number,
          driver_id: formData.driver_id,
          status: 'scheduled',
          total_orders: selectedOrders.length,
          total_sacks: totalSacks,
          route_notes: formData.route_notes
        })
        .select()
        .single()

      if (deliveryError) throw deliveryError

      // Create delivery_orders (link orders to delivery)
      const deliveryOrders = selectedOrders.map(so => ({
        delivery_id: delivery.id,
        order_id: so.order_id,
        route_order: so.route_order,
        delivery_status: 'scheduled'
      }))

      const { error: deliveryOrdersError } = await supabase
        .from('delivery_orders')
        .insert(deliveryOrders)

      if (deliveryOrdersError) throw deliveryOrdersError

      // Update order status to 'scheduled'
      const orderIds = selectedOrders.map(so => so.order_id)
      const { error: updateOrdersError } = await supabase
        .from('orders')
        .update({ status: 'scheduled' })
        .in('id', orderIds)

      if (updateOrdersError) throw updateOrdersError

      // Add delivery workers (loaders)
      if (selectedLoaders.length > 0) {
        const deliveryWorkers = selectedLoaders.map(loaderId => ({
          delivery_id: delivery.id,
          employee_id: loaderId,
          sacks_loaded: 0,
          wage_earned: 0
        }))

        await supabase
          .from('delivery_workers')
          .insert(deliveryWorkers)
      }

      // Create delivery note
      // Create delivery note (if table exists)
      try {
        const noteNumber = `DN-${Date.now()}`
        await supabase.from('delivery_notes').insert({
          delivery_id: delivery.id,
          note_number: noteNumber
        })
      } catch (err) {
        console.log('Delivery notes table not found, skipping')
      }

      showToast('Pengiriman berhasil dijadwalkan', 'success')
      navigate(`/deliveries/${delivery.id}`)
    } catch (error) {
      console.error('Error:', error)
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedOrderDetails = selectedOrders.map(so => {
    const order = pendingOrders.find(o => o.id === so.order_id)
    return { ...so, order }
  })

  const totalSacks = selectedOrderDetails.reduce((sum, item) => {
    return sum + (item.order?.order_items.reduce((itemSum, oi) => itemSum + oi.quantity, 0) || 0)
  }, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Jadwalkan Pengiriman</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Atur jadwal pengiriman dan gabungkan beberapa order dalam satu truk
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Delivery Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Informasi Pengiriman
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Kirim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    No. Truk / Armada
                  </label>
                  <input
                    type="text"
                    value={formData.truck_number}
                    onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })}
                    placeholder="Contoh: B 1234 XYZ"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sopir <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">-- Pilih Sopir --</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan Rute (Opsional)
                  </label>
                  <textarea
                    value={formData.route_notes}
                    onChange={(e) => setFormData({ ...formData, route_notes: e.target.value })}
                    rows="2"
                    placeholder="Catatan khusus untuk rute pengiriman..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Loaders Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Pegawai Bongkar Muat (Opsional)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loaders.map(loader => (
                  <label
                    key={loader.id}
                    className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLoaders.includes(loader.id)}
                      onChange={() => toggleLoaderSelection(loader.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{loader.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{loader.phone}</div>
                    </div>
                  </label>
                ))}
              </div>

              {loaders.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Belum ada pegawai loader. Tambahkan di menu Pegawai.
                </p>
              )}
            </div>

            {/* Selected Orders */}
            {selectedOrders.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Urutan Pengiriman ({selectedOrders.length} order)
                </h2>

                <div className="space-y-3">
                  {selectedOrderDetails.map((item, index) => (
                    <div
                      key={item.order_id}
                      className="flex items-center gap-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveOrderUp(index)}
                          disabled={index === 0}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveOrderDown(index)}
                          disabled={index === selectedOrders.length - 1}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {item.order?.order_number} - {item.order?.stores.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.order?.stores.region} • {item.order?.order_items.reduce((sum, oi) => sum + oi.quantity, 0)} karung
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleOrderSelection(item.order_id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Selection */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ringkasan</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Order:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedOrders.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Karung:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {totalSacks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pegawai Loader:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedLoaders.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Pending Orders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Order Menunggu Pengiriman
              </h2>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pendingOrders.map(order => {
                  const isSelected = selectedOrders.some(so => so.order_id === order.id)
                  const totalQty = order.order_items.reduce((sum, item) => sum + item.quantity, 0)

                  return (
                    <label
                      key={order.id}
                      className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="mr-3"
                      />
                      <div className="inline-block">
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {order.order_number}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {order.stores.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {order.stores.region} • {totalQty} karung
                        </div>
                      </div>
                    </label>
                  )
                })}

                {pendingOrders.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    Tidak ada order yang menunggu pengiriman
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading || selectedOrders.length === 0}
                className="w-full"
              >
                {loading ? 'Menyimpan...' : 'Simpan Jadwal Pengiriman'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/delivery-management')}
                className="w-full"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
