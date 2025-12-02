import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useToast } from '../hooks/useToast'

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
            stores (*)
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

  async function handleStartDelivery(deliveryId) {
    try {
      await supabase
        .from('deliveries')
        .update({ status: 'on_delivery' })
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

      showToast('Pengiriman dimulai', 'success')
      fetchDriverDeliveries()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  function openDeliveryModal(delivery, order) {
    setSelectedDelivery(delivery)
    setSelectedOrder(order)
    setDeliveryForm({
      recipient_name: '',
      notes: '',
      proof_photo_url: ''
    })
    setShowDeliveryModal(true)
  }

  async function handleMarkAsDelivered() {
    if (!deliveryForm.recipient_name) {
      showToast('Masukkan nama penerima', 'error')
      return
    }

    try {
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
        (d.order_id === selectedOrder.order_id) // Include the one we just updated
      )

      if (allDelivered) {
        await supabase
          .from('deliveries')
          .update({ status: 'delivered' })
          .eq('id', selectedDelivery.id)
      }

      showToast('Order berhasil ditandai terkirim', 'success')
      setShowDeliveryModal(false)
      fetchDriverDeliveries()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  if (!selectedDriver) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Mode Sopir
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            Pilih nama sopir untuk melihat jadwal pengiriman
          </p>

          <div className="space-y-3">
            {drivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => setSelectedDriver(driver.id)}
                className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {driver.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {driver.phone}
                </div>
              </button>
            ))}
          </div>

          {drivers.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Belum ada data sopir
            </p>
          )}
        </div>
      </div>
    )
  }

  const currentDriver = drivers.find(d => d.id === selectedDriver)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Mode Sopir
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sopir: {currentDriver?.name}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setSelectedDriver(null)}>
            Ganti Sopir
          </Button>
        </div>
      </div>

      {/* Deliveries */}
      {deliveries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Tidak ada pengiriman yang dijadwalkan
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {deliveries.map(delivery => (
            <div
              key={delivery.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              {/* Delivery Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {delivery.delivery_number}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(delivery.delivery_date), 'dd MMMM yyyy', { locale: id })}
                  </p>
                  {delivery.truck_number && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Truk: {delivery.truck_number}
                    </p>
                  )}
                </div>
                {delivery.status === 'scheduled' && (
                  <Button onClick={() => handleStartDelivery(delivery.id)}>
                    Mulai Pengiriman
                  </Button>
                )}
                {delivery.status === 'on_delivery' && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-sm font-medium">
                    Dalam Pengiriman
                  </span>
                )}
              </div>

              {/* Delivery Orders */}
              <div className="space-y-3">
                {delivery.delivery_orders.map((deliveryOrder, index) => {
                  const order = deliveryOrder.orders
                  const totalQty = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                  const isDelivered = deliveryOrder.delivery_status === 'delivered'

                  return (
                    <div
                      key={deliveryOrder.id}
                      className={`border rounded-lg p-4 ${
                        isDelivered
                          ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isDelivered
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {isDelivered ? '✓' : index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-gray-100">
                                {order.stores.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {order.stores.owner}
                              </div>
                            </div>
                            {isDelivered && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">
                                Terkirim
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <div>📍 {order.stores.address}</div>
                            <div>📞 {order.stores.phone}</div>
                          </div>

                          <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-3">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Produk: {totalQty} karung
                            </div>
                            {order.order_items?.map(item => (
                              <div key={item.id} className="text-sm text-gray-600 dark:text-gray-400">
                                • {item.products.name}: {item.quantity} {item.products.unit}
                              </div>
                            ))}
                          </div>

                          {isDelivered ? (
                            <div className="text-sm text-green-600 dark:text-green-400">
                              ✓ Diterima oleh: {deliveryOrder.recipient_name}
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(deliveryOrder.delivered_at), 'dd MMM yyyy HH:mm', { locale: id })}
                              </div>
                            </div>
                          ) : (
                            delivery.status === 'on_delivery' && (
                              <Button
                                size="sm"
                                onClick={() => openDeliveryModal(delivery, deliveryOrder)}
                              >
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

      {/* Delivery Confirmation Modal */}
      <Modal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        title="Konfirmasi Pengiriman"
      >
        <div className="p-6">
          {selectedOrder && (
            <>
              <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedOrder.orders.stores.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOrder.orders.order_number}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Penerima <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryForm.recipient_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, recipient_name: e.target.value })}
                    placeholder="Nama yang menerima barang"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    rows="3"
                    placeholder="Catatan tambahan..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Foto Bukti (Opsional)
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.proof_photo_url}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, proof_photo_url: e.target.value })}
                    placeholder="URL foto bukti pengiriman"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Upload foto ke cloud storage dan masukkan URL-nya
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button variant="secondary" onClick={() => setShowDeliveryModal(false)}>
                  Batal
                </Button>
                <Button onClick={handleMarkAsDelivered}>
                  Konfirmasi Terkirim
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
