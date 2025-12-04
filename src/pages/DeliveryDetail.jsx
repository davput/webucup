import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '../lib/constants'
import { useToast } from '../context/ToastContext'

export default function DeliveryDetail() {
  const { id: deliveryId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Confirm dialogs
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showMarkDeliveredConfirm, setShowMarkDeliveredConfirm] = useState(false)
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null)

  useEffect(() => {
    fetchDelivery()
  }, [deliveryId])

  async function fetchDelivery() {
    try {
      setLoading(true)
      
      if (!deliveryId) {
        throw new Error('ID pengiriman tidak valid')
      }

      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          employees:driver_id (name, phone),
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
          ),
          delivery_workers (
            *,
            employees:employee_id (name, phone)
          )
        `)
        .eq('id', deliveryId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Pengiriman tidak ditemukan')
        }
        throw error
      }

      if (!data) {
        throw new Error('Data pengiriman tidak ditemukan')
      }

      // Sort delivery_orders by route_order
      if (data.delivery_orders) {
        data.delivery_orders.sort((a, b) => a.route_order - b.route_order)
      }

      setDelivery(data)
    } catch (error) {
      showToast(error.message || 'Gagal memuat data pengiriman', 'error')
      setDelivery(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartDelivery() {
    if (actionLoading) return
    
    try {
      setActionLoading(true)

      // Validasi status
      if (delivery.status !== 'scheduled') {
        throw new Error('Pengiriman hanya bisa dimulai dari status terjadwal')
      }

      // Validasi ada order
      if (!delivery.delivery_orders || delivery.delivery_orders.length === 0) {
        throw new Error('Tidak ada order dalam pengiriman ini')
      }

      // Validasi driver
      if (!delivery.driver_id) {
        throw new Error('Pengiriman harus memiliki sopir')
      }

      // Update delivery status
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({ 
          status: 'on_delivery',
          started_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (deliveryError) throw deliveryError

      // Update all orders status
      const orderIds = delivery.delivery_orders.map(d => d.order_id)
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ status: 'on_delivery' })
        .in('id', orderIds)

      if (ordersError) throw ordersError

      // Update delivery_orders status
      const { error: deliveryOrdersError } = await supabase
        .from('delivery_orders')
        .update({ delivery_status: 'on_delivery' })
        .eq('delivery_id', deliveryId)

      if (deliveryOrdersError) throw deliveryOrdersError

      // Reduce stock for all products
      for (const deliveryOrder of delivery.delivery_orders) {
        for (const item of deliveryOrder.orders.order_items) {
          // Get current stock
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()

          if (productError) throw productError

          const stockBefore = product.stock
          const stockAfter = stockBefore - item.quantity

          // Validasi stok cukup
          if (stockAfter < 0) {
            throw new Error(`Stok ${item.products.name} tidak mencukupi`)
          }

          // Update stock
          const { error: updateStockError } = await supabase
            .from('products')
            .update({ stock: stockAfter })
            .eq('id', item.product_id)

          if (updateStockError) throw updateStockError

          // Create stock log
          const { error: logError } = await supabase
            .from('stock_logs')
            .insert({
              product_id: item.product_id,
              type: 'out',
              quantity: -item.quantity,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_type: 'delivery',
              reference_id: deliveryId,
              notes: `Pengiriman ${delivery.delivery_number}`
            })

          if (logError) throw logError
        }
      }

      showToast('Pengiriman berhasil dimulai', 'success')
      setShowStartConfirm(false)
      fetchDelivery()
    } catch (error) {
      showToast(error.message || 'Gagal memulai pengiriman', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  function confirmMarkAsDelivered(deliveryOrderId, orderId) {
    setSelectedDeliveryOrder({ deliveryOrderId, orderId })
    setShowMarkDeliveredConfirm(true)
  }

  async function handleMarkAsDelivered() {
    if (actionLoading || !selectedDeliveryOrder) return
    
    try {
      setActionLoading(true)

      const { deliveryOrderId, orderId } = selectedDeliveryOrder

      // Validasi status pengiriman
      if (delivery.status !== 'on_delivery') {
        throw new Error('Order hanya bisa ditandai terkirim saat pengiriman sedang berlangsung')
      }

      // Update delivery_order status
      const { error: deliveryOrderError } = await supabase
        .from('delivery_orders')
        .update({ 
          delivery_status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', deliveryOrderId)

      if (deliveryOrderError) throw deliveryOrderError

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId)

      if (orderError) throw orderError

      showToast('Order berhasil ditandai terkirim', 'success')
      setShowMarkDeliveredConfirm(false)
      setSelectedDeliveryOrder(null)
      fetchDelivery()
    } catch (error) {
      showToast(error.message || 'Gagal menandai order terkirim', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCompleteDelivery() {
    if (actionLoading) return
    
    try {
      setActionLoading(true)

      // Validasi status
      if (delivery.status !== 'on_delivery') {
        throw new Error('Pengiriman hanya bisa diselesaikan dari status sedang dikirim')
      }

      // Check if all orders are delivered
      const allDelivered = delivery.delivery_orders.every(d => d.delivery_status === 'delivered')
      
      if (!allDelivered) {
        const pendingCount = delivery.delivery_orders.filter(d => d.delivery_status !== 'delivered').length
        throw new Error(`Masih ada ${pendingCount} order yang belum terkirim`)
      }

      // Update delivery status
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          status: 'delivered',
          completed_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (error) throw error

      showToast('Pengiriman berhasil diselesaikan', 'success')
      setShowCompleteConfirm(false)
      fetchDelivery()
    } catch (error) {
      showToast(error.message || 'Gagal menyelesaikan pengiriman', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelDelivery() {
    if (actionLoading) return
    
    try {
      setActionLoading(true)

      // Validasi status
      if (delivery.status !== 'scheduled') {
        throw new Error('Hanya pengiriman terjadwal yang bisa dibatalkan')
      }

      // Update delivery status
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', deliveryId)

      if (deliveryError) throw deliveryError

      // Update orders back to pending_delivery
      const orderIds = delivery.delivery_orders.map(d => d.order_id)
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ status: 'pending_delivery' })
        .in('id', orderIds)

      if (ordersError) throw ordersError

      // Update delivery_orders status
      const { error: deliveryOrdersError } = await supabase
        .from('delivery_orders')
        .update({ delivery_status: 'cancelled' })
        .eq('delivery_id', deliveryId)

      if (deliveryOrdersError) throw deliveryOrdersError

      showToast('Pengiriman berhasil dibatalkan', 'success')
      setShowCancelConfirm(false)
      fetchDelivery()
    } catch (error) {
      showToast(error.message || 'Gagal membatalkan pengiriman', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  function printDeliveryNote() {
    try {
      window.print()
    } catch (error) {
      showToast('Gagal mencetak surat jalan', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500 dark:text-gray-400">Memuat data pengiriman...</div>
        </div>
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Pengiriman tidak ditemukan</p>
          <Button onClick={() => navigate('/delivery-management')} className="mt-4">
            Kembali ke Daftar Pengiriman
          </Button>
        </div>
      </div>
    )
  }

  const totalAmount = delivery.delivery_orders.reduce((sum, d) => 
    sum + parseFloat(d.orders.total_amount), 0
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Pengiriman #{delivery.delivery_number}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tanggal kirim: {format(new Date(delivery.delivery_date), 'dd MMMM yyyy', { locale: id })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/delivery-management')}>
            Kembali
          </Button>
          {delivery.status === 'scheduled' && (
            <>
              <Button 
                onClick={() => setShowStartConfirm(true)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Memproses...' : 'Mulai Pengiriman'}
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setShowCancelConfirm(true)}
                disabled={actionLoading}
              >
                Batalkan
              </Button>
            </>
          )}
          {delivery.status === 'on_delivery' && (
            <Button 
              onClick={() => setShowCompleteConfirm(true)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Memproses...' : 'Selesaikan Pengiriman'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status Pengiriman</div>
            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${DELIVERY_STATUS_COLORS[delivery.status]}`}>
              {DELIVERY_STATUS_LABELS[delivery.status]}
            </span>
          </div>
          <Button variant="secondary" onClick={printDeliveryNote}>
            Cetak Surat Jalan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Driver & Truck Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Informasi Pengiriman
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Sopir:</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {delivery.employees?.name || '-'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {delivery.employees?.phone}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">No. Truk:</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {delivery.truck_number || '-'}
                </div>
              </div>
            </div>
            {delivery.route_notes && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Catatan Rute:</span>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{delivery.route_notes}</p>
              </div>
            )}
          </div>

          {/* Delivery Workers */}
          {delivery.delivery_workers && delivery.delivery_workers.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Pegawai Bongkar Muat
              </h2>
              <div className="space-y-2">
                {delivery.delivery_workers.map(worker => (
                  <div key={worker.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {worker.employees.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {worker.employees.phone}
                      </div>
                    </div>
                    {worker.sacks_loaded > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {worker.sacks_loaded} karung
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(worker.wage_earned)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Daftar Pengiriman ({delivery.delivery_orders.length} order)
            </h2>

            <div className="space-y-4">
              {delivery.delivery_orders.map((deliveryOrder, index) => {
                const order = deliveryOrder.orders
                const totalQty = order.order_items.reduce((sum, item) => sum + item.quantity, 0)

                return (
                  <div
                    key={deliveryOrder.id}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {order.order_number}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.stores.name} - {order.stores.owner}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${DELIVERY_STATUS_COLORS[deliveryOrder.delivery_status]}`}>
                            {DELIVERY_STATUS_LABELS[deliveryOrder.delivery_status]}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div>📍 {order.stores.address}</div>
                          <div>📞 {order.stores.phone}</div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-2">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Produk:
                          </div>
                          {order.order_items.map(item => (
                            <div key={item.id} className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                              <span>{item.products.name}</span>
                              <span>{item.quantity} {item.products.unit}</span>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                            <span>Total: {totalQty} karung</span>
                            <span>{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>

                        {deliveryOrder.delivered_at && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            ✓ Terkirim pada {format(new Date(deliveryOrder.delivered_at), 'dd MMM yyyy HH:mm', { locale: id })}
                            {deliveryOrder.recipient_name && ` - Diterima oleh: ${deliveryOrder.recipient_name}`}
                          </div>
                        )}

                        {delivery.status === 'on_delivery' && deliveryOrder.delivery_status !== 'delivered' && (
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              onClick={() => confirmMarkAsDelivered(deliveryOrder.id, order.id)}
                              disabled={actionLoading}
                            >
                              ✓ Tandai Terkirim
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ringkasan</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Order:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {delivery.total_orders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Karung:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {delivery.total_sacks}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Total Nilai:</span>
                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Progress</h2>
            <div className="space-y-2">
              {delivery.delivery_orders.map((d, index) => (
                <div key={d.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    d.delivery_status === 'delivered'
                      ? 'bg-green-500 text-white'
                      : d.delivery_status === 'on_delivery'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {d.delivery_status === 'delivered' ? '✓' : index + 1}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {d.orders.stores.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showStartConfirm}
        onClose={() => !actionLoading && setShowStartConfirm(false)}
        onConfirm={handleStartDelivery}
        title="Mulai Pengiriman"
        message="Apakah Anda yakin ingin memulai pengiriman ini? Stok produk akan dikurangi dan status order akan diubah."
        confirmText="Ya, Mulai Pengiriman"
        cancelText="Batal"
        type="info"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={showMarkDeliveredConfirm}
        onClose={() => !actionLoading && setShowMarkDeliveredConfirm(false)}
        onConfirm={handleMarkAsDelivered}
        title="Tandai Terkirim"
        message="Apakah Anda yakin order ini sudah terkirim ke toko?"
        confirmText="Ya, Sudah Terkirim"
        cancelText="Belum"
        type="success"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={showCompleteConfirm}
        onClose={() => !actionLoading && setShowCompleteConfirm(false)}
        onConfirm={handleCompleteDelivery}
        title="Selesaikan Pengiriman"
        message="Apakah Anda yakin ingin menyelesaikan pengiriman ini? Pastikan semua order sudah terkirim."
        confirmText="Ya, Selesaikan"
        cancelText="Batal"
        type="success"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => !actionLoading && setShowCancelConfirm(false)}
        onConfirm={handleCancelDelivery}
        title="Batalkan Pengiriman"
        message="Apakah Anda yakin ingin membatalkan pengiriman ini? Semua order akan dikembalikan ke status menunggu pengiriman."
        confirmText="Ya, Batalkan"
        cancelText="Tidak"
        type="danger"
        loading={actionLoading}
      />
    </div>
  )
}
