import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import Table from '../components/Table'
import Button from '../components/Button'
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

export default function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    store_id: '',
    search: '',
    date_from: '',
    date_to: ''
  })
  const [stores, setStores] = useState([])

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    if (stores.length > 0 || filters.status || filters.payment_status || filters.store_id || filters.date_from || filters.date_to || filters.search) {
      fetchOrders()
    } else {
      fetchOrders()
    }
  }, [filters])

  async function fetchStores() {
    const { data } = await supabase
      .from('stores')
      .select('id, name')
      .order('name')
    setStores(data || [])
  }

  async function fetchOrders() {
    try {
      setLoading(true)
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          stores (id, name, owner, phone, address, region),
          order_items (
            id,
            quantity,
            price,
            subtotal,
            products (id, name, unit)
          )
        `)
        .order('order_date', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
      }
      if (filters.store_id) {
        query = query.eq('store_id', filters.store_id)
      }
      if (filters.date_from) {
        query = query.gte('order_date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('order_date', filters.date_to + 'T23:59:59')
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Apply search filter on client side
      let filteredData = data || []
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(order => 
          order.order_number?.toLowerCase().includes(searchLower) ||
          order.stores?.name?.toLowerCase().includes(searchLower) ||
          order.stores?.owner?.toLowerCase().includes(searchLower)
        )
      }

      setOrders(filteredData)
      setError(null)
    } catch (error) {
      console.error('Error fetching orders:', error.message)
      setOrders([])
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { 
      key: 'order_number', 
      label: 'No. Order',
      render: (row) => (
        <Link 
          to={`/orders/${row.id}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {row.order_number}
        </Link>
      )
    },
    { 
      key: 'store', 
      label: 'Toko',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{row.stores?.name || '-'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.stores?.owner}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{row.stores?.region}</div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Produk',
      render: (row) => {
        const items = row.order_items || []
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0)
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {items.length} item ({totalQty} karung)
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {items.slice(0, 2).map(item => 
                `${item.products?.name} (${item.quantity})`
              ).join(', ')}
              {items.length > 2 && '...'}
            </div>
          </div>
        )
      }
    },
    {
      key: 'total_amount',
      label: 'Total',
      render: (row) => (
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(row.total_amount)}
        </div>
      )
    },
    {
      key: 'payment',
      label: 'Pembayaran',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {PAYMENT_METHOD_LABELS[row.payment_method]}
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PAYMENT_STATUS_COLORS[row.payment_status]}`}>
            {PAYMENT_STATUS_LABELS[row.payment_status]}
          </span>
          {row.payment_method === 'tempo' && row.due_date && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Jatuh tempo: {format(new Date(row.due_date), 'dd MMM yyyy', { locale: id })}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${ORDER_STATUS_COLORS[row.status]}`}>
          {ORDER_STATUS_LABELS[row.status]}
        </span>
      )
    },
    {
      key: 'order_date',
      label: 'Tanggal',
      render: (row) => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {format(new Date(row.order_date), 'dd MMM yyyy', { locale: id })}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(row.order_date), 'HH:mm', { locale: id })}
          </div>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Memuat data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
            Error Memuat Data
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error}
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-4 mt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-400 font-semibold mb-2">
              ⚠️ Kemungkinan Penyebab:
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
              <li>Tabel database belum dibuat atau struktur belum sesuai</li>
              <li>Jalankan migration SQL: <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">order-management-migration.sql</code></li>
              <li>Atau update tabel orders di Supabase sesuai schema baru</li>
            </ul>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchOrders()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manajemen Order</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola order distribusi pupuk ke toko
          </p>
        </div>
        <Link to="/orders/new">
          <Button>+ Buat Order Baru</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cari
            </label>
            <input
              type="text"
              placeholder="No. order, toko..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status Order
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Status</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status Pembayaran
            </label>
            <select
              value={filters.payment_status}
              onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Toko
            </label>
            <select
              value={filters.store_id}
              onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Toko</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        {(filters.search || filters.status || filters.payment_status || filters.store_id || filters.date_from || filters.date_to) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {orders.length} order
            </div>
            <button
              onClick={() => setFilters({
                status: '',
                payment_status: '',
                store_id: '',
                search: '',
                date_from: '',
                date_to: ''
              })}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Order</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {orders.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Menunggu Pengiriman</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {orders.filter(o => o.status === 'pending_delivery').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Dalam Pengiriman</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {orders.filter(o => o.status === 'on_delivery').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Nilai</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Table 
          columns={columns}
          data={orders}
          emptyMessage="Belum ada order. Klik tombol 'Buat Order Baru' untuk membuat order pertama."
        />
      </div>
    </div>
  )
}
