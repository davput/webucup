import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, MapPin, Phone, User, DollarSign, ShoppingCart, Package, Plus, Trash2, Calendar, CreditCard } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import CurrencyInput from '../components/CurrencyInput'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function StoreDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [store, setStore] = useState(null)
  const [orders, setOrders] = useState([])
  const [debtPayments, setDebtPayments] = useState([])
  const [customPrices, setCustomPrices] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  })
  const [priceForm, setPriceForm] = useState({
    product_id: '',
    custom_price: '',
    notes: ''
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    totalDebt: 0,
    completedOrders: 0,
    totalPaid: 0
  })
  const [activeTab, setActiveTab] = useState('orders') // orders, payments, pricing

  useEffect(() => {
    loadStoreData()
  }, [id])

  const loadStoreData = async () => {
    setLoading(true)

    // Load store info
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    if (storeError || !storeData) {
      navigate('/stores')
      return
    }

    setStore(storeData)

    // Load orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', id)
      .order('order_date', { ascending: false })

    setOrders(ordersData || [])

    // Load debt payments
    const { data: paymentsData } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('store_id', id)
      .order('payment_date', { ascending: false })

    setDebtPayments(paymentsData || [])

    // Load custom pricing
    const { data: customPricingData } = await supabase
      .from('custom_pricing')
      .select(`
        *,
        products (name, selling_price, unit)
      `)
      .eq('store_id', id)

    setCustomPrices(customPricingData || [])

    // Load all products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    setProducts(productsData || [])

    // Calculate stats
    const totalOrders = ordersData?.length || 0
    const totalSpent = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0
    const totalPaid = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

    setStats({
      totalOrders,
      totalSpent,
      totalDebt: storeData.debt || 0,
      completedOrders,
      totalPaid
    })

    setLoading(false)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showError('Jumlah pembayaran harus lebih dari 0')
      return
    }

    if (parseFloat(paymentForm.amount) > store.debt) {
      showError('Jumlah pembayaran melebihi total hutang')
      return
    }

    const { error } = await supabase
      .from('debt_payments')
      .insert([{
        store_id: id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
        created_by: 'Admin'
      }])

    if (error) {
      showError('Gagal mencatat pembayaran: ' + error.message)
      return
    }

    showSuccess('Pembayaran berhasil dicatat!')
    setIsPaymentModalOpen(false)
    setPaymentForm({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: ''
    })
    loadStoreData()
  }

  const handlePriceSubmit = async (e) => {
    e.preventDefault()

    const { error } = await supabase
      .from('custom_pricing')
      .upsert([{
        store_id: id,
        product_id: priceForm.product_id,
        custom_price: parseFloat(priceForm.custom_price),
        notes: priceForm.notes,
        effective_date: new Date().toISOString().split('T')[0]
      }], {
        onConflict: 'product_id,store_id'
      })

    if (error) {
      showError('Gagal menyimpan harga khusus: ' + error.message)
      return
    }

    showSuccess('Harga khusus berhasil disimpan!')
    setIsPriceModalOpen(false)
    setPriceForm({ product_id: '', custom_price: '', notes: '' })
    loadStoreData()
  }

  const handleDeleteCustomPrice = async (priceId) => {
    if (!confirm('Hapus harga khusus ini?')) return

    const { error } = await supabase
      .from('custom_pricing')
      .delete()
      .eq('id', priceId)

    if (error) {
      showError('Gagal menghapus: ' + error.message)
      return
    }

    showSuccess('Harga khusus berhasil dihapus!')
    loadStoreData()
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    }
    const labels = {
      pending: 'Pending',
      processing: 'Diproses',
      shipped: 'Dikirim',
      completed: 'Selesai'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || badges.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Toko tidak ditemukan</p>
        <Button onClick={() => navigate('/stores')} className="mt-4">
          Kembali ke Daftar Toko
        </Button>
      </div>
    )
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
          onClick={() => navigate('/stores')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali ke Daftar Toko
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Detail informasi dan riwayat transaksi toko</p>
          </div>
          <Button onClick={() => navigate(`/stores/edit/${id}`)}>
            <Edit className="w-5 h-5 inline mr-2" />
            Edit Toko
          </Button>
        </div>
      </div>

      {/* Financial Summary Box */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-white text-lg font-semibold mb-4">Ringkasan Keuangan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <p className="text-blue-100 text-sm font-medium">Total Pembelian</p>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalSpent)}</p>
            <p className="text-blue-200 text-xs mt-1">Sepanjang waktu</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <p className="text-blue-100 text-sm font-medium">Sudah Dibayar</p>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-blue-200 text-xs mt-1">Pembayaran hutang</p>
          </div>
          
          <div className={`backdrop-blur-sm rounded-lg p-4 ${
            stats.totalDebt > 0 
              ? 'bg-red-500/20 border-2 border-red-400/50' 
              : 'bg-green-500/20 border-2 border-green-400/50'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${
                stats.totalDebt > 0 ? 'bg-red-500/30' : 'bg-green-500/30'
              }`}>
                <span className="text-white font-bold text-lg">Rp</span>
              </div>
              <p className="text-white text-sm font-medium">Sisa Piutang</p>
            </div>
            <p className={`text-2xl font-bold ${
              stats.totalDebt > 0 ? 'text-red-100' : 'text-green-100'
            }`}>
              {formatCurrency(stats.totalDebt)}
            </p>
            <p className="text-white/80 text-xs mt-1">
              {stats.totalDebt > 0 ? 'Belum lunas' : 'Lunas'}
            </p>
          </div>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Order</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalOrders}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Order Selesai</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.completedOrders}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Order Pending</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalOrders - stats.completedOrders}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Rata-rata Order</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalOrders > 0 ? formatCurrency(stats.totalSpent / stats.totalOrders) : 'Rp 0'}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-bold text-xl">Rp</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store Info */}
        <div className="lg:col-span-1">
          <Card title="Informasi Toko">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pemilik</p>
                  <p className="font-medium text-gray-900 dark:text-white">{store.owner}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Telepon</p>
                  <p className="font-medium text-gray-900 dark:text-white">{store.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Alamat</p>
                  <p className="font-medium text-gray-900 dark:text-white">{store.address}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Kecamatan {store.region}
                  </p>
                </div>
              </div>

              {store.notes && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Catatan</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{store.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Custom Pricing */}
          <Card 
            title="Harga Khusus"
            className="mt-6"
            action={
              <Button onClick={() => setIsPriceModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 inline mr-2" />
                Tambah
              </Button>
            }
          >
            {customPrices.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                Belum ada harga khusus. Toko akan menggunakan harga normal.
              </div>
            ) : (
              <div className="space-y-2">
                {customPrices.map((cp) => (
                  <div key={cp.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {cp.products?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Normal: {formatCurrency(cp.products?.selling_price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm whitespace-nowrap">
                        {formatCurrency(cp.custom_price)}
                      </span>
                      <button
                        onClick={() => handleDeleteCustomPrice(cp.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Debt Management */}
        <div className="lg:col-span-2">
          {stats.totalDebt > 0 && (
            <Card 
              title="Manajemen Hutang"
              action={
                <Button onClick={() => setIsPaymentModalOpen(true)} size="sm">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Catat Pembayaran
                </Button>
              }
            >
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sisa Hutang</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(stats.totalDebt)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-red-300 dark:text-red-700" />
                </div>
              </div>

              {debtPayments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Riwayat Pembayaran</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Metode</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {debtPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {payment.payment_date ? format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: localeId }) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 capitalize">
                              {payment.payment_method}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                              {payment.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Order History */}
          <Card title="Riwayat Pembelian" className={stats.totalDebt > 0 ? 'mt-6' : ''}>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Belum ada riwayat pembelian</p>
                <Button onClick={() => navigate('/orders/create')} className="mt-4">
                  Buat Order Baru
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No. Order</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {order.order_date ? format(new Date(order.order_date), 'dd MMM yyyy', { locale: localeId }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Catat Pembayaran Hutang"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Sisa Hutang Saat Ini</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(store?.debt || 0)}
            </p>
          </div>

          <div>
            <CurrencyInput
              label="Jumlah Pembayaran *"
              required
              value={paymentForm.amount}
              onChange={(value) => setPaymentForm({ ...paymentForm, amount: value })}
            />
          </div>

          <div>
            <label>Tanggal Pembayaran *</label>
            <input
              type="date"
              required
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
            />
          </div>

          <div>
            <label>Metode Pembayaran *</label>
            <select
              required
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
            >
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer Bank</option>
              <option value="check">Cek/Giro</option>
            </select>
          </div>

          <div>
            <label>Keterangan (Opsional)</label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              rows="3"
              placeholder="Catatan pembayaran"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Pembayaran</Button>
          </div>
        </form>
      </Modal>
    </div>
    </>
  )
}
