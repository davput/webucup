import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useToast } from '../context/ToastContext'
import { Truck, MapPin, Phone, Package, CheckCircle, Clock, User } from 'lucide-react'

export default function DriverMode() {
  const { showToast } = useToast()
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [deliveryForm, setDeliveryForm] = useState({
    recipient_name: '',
    notes: '',
    proof_photo_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [deliveryToStart, setDeliveryToStart] = useState(null)

  useEffect(() => {
    fetchDrivers()
  }, [])

  useEffect(() => {
    if (selectedDriver) {
      fetchDriverDeliveries()
    }
  }, [selectedDriver])

  async function fetchDrivers() {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('role', 'driver')
      .order('name')
    setDrivers(data || [])
  }

  async function fetchDriverDeliveries() {
    const { data } = await supabase
      .from('deliveries')
      .select(`
        *,
        delivery_orders (
          *,
          orders (
            *,
            stores (*),
            order_items (
              *,
              products (*)
            )
          )
        )
      `)
      .eq('driver_id', selectedDriver)
      .in('status', ['scheduled', 'on_delivery'])
      .order('delivery_date', { ascending: true })

    // Sort delivery_orders by route_order
    if (data) {
      data.forEach(delivery => {
        if (delivery.delivery_orders) {
          delivery.delivery_orders.sort((a, b) => a.route_order - b.route_order)
        }
      })
    }

    setDeliveries(data || [])
  }

  function confirmStartDelivery(deliveryId) {
    setDeliveryToStart(deliveryId)
    setShowStartConfirm(true)
  }

  async function handleStartDelivery() {
    if (loading) return
    
    try {
      setLoading(true)
      const deliveryId = deliveryToStart

      await supabase
        .from('deliveries')
        .update({ 
          status: 'on_delivery',
          started_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      const delivery = deliveries.find(d => d.id === deliveryId)
      const orderIds = delivery.delivery_orders.map(d => d.order_id)

      await supabase
        .from('orders')
        .update({ status: 'on_delivery' })
        .in('id', orderIds)

      await supabase
        .from('delivery_orders')
        .update({ delivery_status: 'on_delivery' })
        .eq('delivery_id', deliveryId)

      // Reduce stock
      for (const deliveryOrder of delivery.delivery_orders) {
        for (const item of deliveryOrder.orders.order_items) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          const stockBefore = product.stock
          const stockAfter = stockBefore - item.quantity

          await supabase
            .from('products')
            .update({ stock: stockAfter })
            .eq('id', item.product_id)

          await supabase
            .from('stock_logs')
            .insert({
              product_id: item.product_id,
              type: 'out',
              quantity: -item.quantity,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_type: 'delivery',
              reference_id: deliveryId,
              notes: `Pengiriman dimulai`
            })
        }
      }

      showToast('Pengiriman berhasil dimulai', 'success')
      setShowStartConfirm(false)
      setDeliveryToStart(null)
      fetchDriverDeliveries()
    } catch (error) {
      showToast(error.message || 'Gagal memulai pengiriman', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openDeliveryModal(delivery, order) {
    setSelectedDelivery(delivery)
    setSelectedOrder(order)
    setDeliveryForm({
      recipient_name: order.orders.stores.owner || '',
      notes: '',
      proof_photo_url: ''
    })
    setShowDeliveryModal(true)
  }

  async function handleMarkAsDelivered() {
    if (!deliveryForm.recipient_name.trim()) {
      showToast('Masukkan nama penerima', 'error')
      return
    }

    if (loading) return

    try {
      setLoading(true)

      // Update delivery_order status
      await supabase
        .from('delivery_orders')
        .update({
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString(),
          recipient_name: deliveryForm.recipient_name,
          notes: deliveryForm.notes,
          proof_photo_url: deliveryForm.proof_photo_url
        })
        .eq('delivery_id', selectedDelivery.id)
        .eq('order_id', selectedOrder.order_id)

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', selectedOrder.order_id)

      // Check if all orders in this delivery are delivered
      const { data: deliveryOrders } = await supabase
        .from('delivery_orders')
        .select('delivery_status')
        .eq('delivery_id', selectedDelivery.id)

      const allDelivered = deliveryOrders.every(d => 
        d.delivery_status === 'delivered' || 
        (d.order_id === selectedOrder.order_id)
      )

      if (allDelivered) {
        await supabase
          .from('deliveries')
          .update({ 
            status: 'delivered',
            completed_at: new Date().toISOString()
          })
          .eq('id', selectedDelivery.id)
      }

      showToast('Order berhasil ditandai terkirim', 'success')
      setShowDeliveryModal(false)
      fetchDriverDeliveries()
    } catch (error) {
      showToast(error.message || 'Gagal menandai order terkirim', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!selectedDriver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Mode Sopir
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Pilih nama sopir untuk melihat jadwal pengiriman
            </p>
          </div>

          {/* Driver Selection */}
          <div className="space-y-3">
            {drivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => setSelectedDriver(driver.id)}
                className="w-full bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {driver.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {driver.phone}
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {drivers.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Belum ada data sopir
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentDriver = drivers.find(d => d.id === selectedDriver)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentDriver?.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {currentDriver?.phone}
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setSelectedDriver(null)}>
              Ganti Sopir
            </Button>
          </div>
        </div>

        {/* Deliveries */}
        {deliveries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Tidak ada pengiriman yang dijadwalkan
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map(delivery => (
              <div
                key={delivery.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Delivery Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        {delivery.delivery_number}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(delivery.delivery_date), 'dd MMMM yyyy', { locale: id })}
                      </p>
                      {delivery.truck_number && (
                        <p className="text-blue-100 text-sm mt-1">
                          🚛 {delivery.truck_number}
                        </p>
                      )}
                    </div>
                    {delivery.status === 'scheduled' && (
                      <Button 
                        onClick={() => confirmStartDelivery(delivery.id)}
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        disabled={loading}
                      >
                        Mulai Pengiriman
                      </Button>
                    )}
                    {delivery.status === 'on_delivery' && (
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Dalam Pengiriman
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Orders */}
                <div className="p-5 space-y-3">
                  {delivery.delivery_orders.map((deliveryOrder, index) => {
                    const order = deliveryOrder.orders
                    const totalQty = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                    const isDelivered = deliveryOrder.delivery_status === 'delivered'

                    return (
                      <div
                        key={deliveryOrder.id}
                        className={`rounded-xl p-4 border-2 transition-all ${
                          isDelivered
                            ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-750'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md ${
                            isDelivered
                              ? 'bg-green-500 text-white'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                          }`}>
                            {isDelivered ? <CheckCircle className="w-5 h-5" /> : index + 1}
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-bold text-lg text-gray-900 dark:text-white">
                                  {order.stores.name}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {order.stores.owner}
                                </div>
                              </div>
                              {isDelivered && (
                                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Terkirim
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 mb-3">
                              <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                                <span>{order.stores.address}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Phone className="w-4 h-4 flex-shrink-0 text-blue-600" />
                                <span>{order.stores.phone}</span>
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                <Package className="w-4 h-4" />
                                Produk ({totalQty} karung)
                              </div>
                              <div className="space-y-1">
                                {order.order_items?.map(item => (
                                  <div key={item.id} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                                    <span>• {item.products.name}</span>
                                    <span className="font-medium">{item.quantity} {item.products.unit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {isDelivered ? (
                              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Diterima oleh: {deliveryOrder.recipient_name}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(deliveryOrder.delivered_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                </div>
                              </div>
                            ) : (
                              delivery.status === 'on_delivery' && (
                                <Button
                                  className="w-full"
                                  onClick={() => openDeliveryModal(delivery, deliveryOrder)}
                                  disabled={loading}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Tandai Terkirim
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Delivery Confirm Dialog */}
      <ConfirmDialog
        isOpen={showStartConfirm}
        onClose={() => !loading && setShowStartConfirm(false)}
        onConfirm={handleStartDelivery}
        title="Mulai Pengiriman"
        message="Apakah Anda yakin ingin memulai pengiriman ini? Stok produk akan dikurangi."
        confirmText="Ya, Mulai"
        cancelText="Batal"
        type="info"
        loading={loading}
      />

      {/* Delivery Confirmation Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setShowDeliveryModal(false)}
          />
          
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Konfirmasi Pengiriman
              </h3>

              <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedOrder.orders.stores.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedOrder.orders.order_number}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nama Penerima <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryForm.recipient_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, recipient_name: e.target.value })}
                    placeholder="Nama yang menerima barang"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    rows="3"
                    placeholder="Catatan tambahan..."
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all resize-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowDeliveryModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleMarkAsDelivered}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Konfirmasi
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
