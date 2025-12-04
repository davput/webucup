import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Invoice from '../components/Invoice'
import CurrencyInput from '../components/CurrencyInput'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS
} from '../lib/constants'
import { useToast } from '../hooks/useToast'

export default function OrderDetail() {
  const { id: orderId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentNotes, setPaymentNotes] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  async function fetchOrder() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores (*),
          order_items (
            *,
            products (*)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error

      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('payment_date', { ascending: false })

      // Fetch invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .single()

      // Fetch delivery info
      const { data: deliveryInfo } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          deliveries (
            *,
            employees:driver_id (name, phone)
          )
        `)
        .eq('order_id', orderId)
        .single()

      setOrder({
        ...data,
        payments: payments || [],
        invoice: invoice,
        delivery_info: deliveryInfo
      })
    } catch (error) {
      console.error('Error:', error)
      showToast('Gagal memuat data order', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelOrder() {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)

      if (error) throw error

      showToast('Order berhasil dibatalkan', 'success')
      setShowCancelModal(false)
      fetchOrder()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  async function handleAddPayment() {
    if (!paymentAmount || paymentAmount <= 0) {
      showToast('Masukkan jumlah pembayaran yang valid', 'error')
      return
    }

    try {
      const totalPaid = order.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      const newTotalPaid = totalPaid + parseFloat(paymentAmount)
      const remaining = parseFloat(order.total_amount) - newTotalPaid

      const paymentData = {
        order_id: orderId,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes || null
      }

      console.log('Sending payment data:', paymentData)

      // Add payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData)

      if (paymentError) {
        console.error('Payment error:', paymentError)
        throw paymentError
      }

      // Update order payment status
      let newPaymentStatus = 'paid'
      if (remaining > 0) {
        newPaymentStatus = 'partial'
      }

      await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId)

      // Update invoice
      if (order.invoice) {
        await supabase
          .from('invoices')
          .update({
            paid_amount: newTotalPaid,
            status: remaining > 0 ? 'partial' : 'paid'
          })
          .eq('id', order.invoice.id)
      }

      // Update store debt if payment method was tempo
      if (order.payment_method === 'tempo') {
        const { data: store } = await supabase
          .from('stores')
          .select('debt')
          .eq('id', order.store_id)
          .single()

        const newDebt = Math.max(0, (store.debt || 0) - paymentAmount)
        await supabase
          .from('stores')
          .update({ debt: newDebt })
          .eq('id', order.store_id)
      }

      showToast('Pembayaran berhasil ditambahkan', 'success')
      setShowPaymentModal(false)
      setPaymentAmount(0)
      setPaymentNotes('')
      fetchOrder()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  function printInvoice() {
    setShowInvoice(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Memuat data...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Order tidak ditemukan</p>
          <Button onClick={() => navigate('/order-management')} className="mt-4">
            Kembali ke Daftar Order
          </Button>
        </div>
      </div>
    )
  }

  const totalPaid = order.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const remaining = parseFloat(order.total_amount) - totalPaid

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Detail Order #{order.order_number}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dibuat pada {format(new Date(order.order_date), 'dd MMMM yyyy HH:mm', { locale: id })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/order-management')}>
            Kembali
          </Button>
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Button variant="danger" onClick={() => setShowCancelModal(true)}>
              Batalkan Order
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status Order</div>
          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Status Pembayaran</div>
          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Metode Pembayaran</div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {PAYMENT_METHOD_LABELS[order.payment_method]}
          </div>
          {order.payment_method === 'tempo' && order.due_date && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Jatuh tempo: {format(new Date(order.due_date), 'dd MMM yyyy', { locale: id })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informasi Toko</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nama Toko:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{order.stores.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pemilik:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{order.stores.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Telepon:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{order.stores.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Wilayah:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{order.stores.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Alamat:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-right">{order.stores.address}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Daftar Produk</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Harga</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.products.name}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                        {item.quantity} {item.products.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.subtotal)}
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
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Delivery Info */}
          {order.delivery_info && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informasi Pengiriman</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">No. Pengiriman:</span>
                  <Link
                    to={`/deliveries/${order.delivery_info.delivery_id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {order.delivery_info.deliveries.delivery_number}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tanggal Kirim:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(order.delivery_info.deliveries.delivery_date), 'dd MMM yyyy', { locale: id })}
                  </span>
                </div>
                {order.delivery_info.deliveries.employees && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sopir:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {order.delivery_info.deliveries.employees.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Telepon Sopir:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {order.delivery_info.deliveries.employees.phone}
                      </span>
                    </div>
                  </>
                )}
                {order.delivery_info.deliveries.truck_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">No. Truk:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {order.delivery_info.deliveries.truck_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Catatan</h2>
              <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ringkasan Pembayaran</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Order:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Terbayar:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Sisa:</span>
                <span className="font-bold text-lg text-red-600 dark:text-red-400">
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>

            {remaining > 0 && order.status !== 'cancelled' && (
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-4"
              >
                Tambah Pembayaran
              </Button>
            )}
          </div>

          {/* Payment History */}
          {order.payments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Riwayat Pembayaran</h2>
              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="border-l-4 border-green-500 pl-3 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(payment.payment_date), 'dd MMM yyyy HH:mm', { locale: id })}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {PAYMENT_METHOD_LABELS[payment.payment_method]}
                        </div>
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {payment.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Aksi</h2>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={printInvoice}>
                Cetak Invoice
              </Button>
              {order.status === 'pending_delivery' && (
                <Link to={`/deliveries/schedule?order=${order.id}`} className="block">
                  <Button className="w-full">
                    Jadwalkan Pengiriman
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Batalkan Order"
      >
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Apakah Anda yakin ingin membatalkan order ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleCancelOrder}>
              Ya, Batalkan Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Tambah Pembayaran"
      >
        <div className="p-6">
          <div className="mb-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Total Order:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Sudah Dibayar:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Sisa:</span>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jumlah Pembayaran
                </label>
                <CurrencyInput
                  value={paymentAmount}
                  onChange={(value) => setPaymentAmount(value)}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setPaymentAmount(remaining)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-2 font-medium"
                >
                  💰 Bayar Penuh ({formatCurrency(remaining)})
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="cash">Tunai</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleAddPayment}
              disabled={!paymentAmount || paymentAmount <= 0}
            >
              Simpan Pembayaran
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invoice Modal */}
      {showInvoice && (
        <Invoice 
          order={order} 
          onClose={() => setShowInvoice(false)} 
        />
      )}
    </div>
  )
}
