import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import Table from '../components/Table'
import Button from '../components/Button'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from '../lib/constants'

export default function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    driver_id: '',
    date_from: '',
    date_to: '',
    search: ''
  })
  const [drivers, setDrivers] = useState([])

  useEffect(() => {
    fetchDrivers()
    fetchDeliveries()
  }, [])

  async function fetchDrivers() {
    const { data } = await supabase
      .from('employees')
      .select('id, name')
      .eq('role', 'driver')
      .order('name')
    setDrivers(data || [])
  }

  async function fetchDeliveries() {
    try {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          employees:driver_id (id, name, phone),
          delivery_orders (
            id,
            order_id,
            route_order,
            delivery_status,
            orders (
              order_number,
              stores (name, region)
            )
          )
        `)
        .order('delivery_date', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.driver_id) {
        query = query.eq('driver_id', filters.driver_id)
      }
      if (filters.date_from) {
        query = query.gte('delivery_date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('delivery_date', filters.date_to)
      }

      const { data, error } = await query

      if (error) throw error

      // Apply search filter
      let filteredData = data || []
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(delivery =>
          delivery.delivery_number.toLowerCase().includes(searchLower) ||
          delivery.truck_number?.toLowerCase().includes(searchLower) ||
          delivery.employees?.name.toLowerCase().includes(searchLower)
        )
      }

      setDeliveries(filteredData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveries()
  }, [filters])

  const columns = [
    {
      key: 'delivery_number',
      label: 'No. Pengiriman',
      render: (row) => (
        <Link
          to={`/deliveries/${row.id}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {row.delivery_number}
        </Link>
      )
    },
    {
      key: 'delivery_date',
      label: 'Tanggal Kirim',
      render: (row) => (
        <div className="text-gray-900 dark:text-gray-100">
          {format(new Date(row.delivery_date), 'dd MMM yyyy', { locale: id })}
        </div>
      )
    },
    {
      key: 'driver',
      label: 'Sopir & Truk',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.employees?.name || '-'}
          </div>
          {row.truck_number && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Truk: {row.truck_number}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'orders',
      label: 'Order',
      render: (row) => {
        const orders = row.delivery_orders || []
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {orders.length} order
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {orders.slice(0, 2).map(d => d.orders?.stores?.name).join(', ')}
              {orders.length > 2 && '...'}
            </div>
          </div>
        )
      }
    },
    {
      key: 'total_sacks',
      label: 'Total Karung',
      render: (row) => (
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          {row.total_sacks || 0}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${DELIVERY_STATUS_COLORS[row.status]}`}>
          {DELIVERY_STATUS_LABELS[row.status]}
        </span>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manajemen Pengiriman</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola jadwal dan tracking pengiriman pupuk
          </p>
        </div>
        <Link to="/deliveries/schedule">
          <Button>+ Jadwalkan Pengiriman</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cari
            </label>
            <input
              type="text"
              placeholder="No. pengiriman, truk..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Status</option>
              {Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sopir
            </label>
            <select
              value={filters.driver_id}
              onChange={(e) => setFilters({ ...filters, driver_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Sopir</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>{driver.name}</option>
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

        {(filters.search || filters.status || filters.driver_id || filters.date_from || filters.date_to) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {deliveries.length} pengiriman
            </div>
            <button
              onClick={() => setFilters({
                status: '',
                driver_id: '',
                date_from: '',
                date_to: '',
                search: ''
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Pengiriman</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {deliveries.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Terjadwal</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {deliveries.filter(d => d.status === 'scheduled').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Dalam Pengiriman</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {deliveries.filter(d => d.status === 'on_delivery').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Selesai</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {deliveries.filter(d => d.status === 'delivered').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <Table
          columns={columns}
          data={deliveries}
          emptyMessage="Belum ada pengiriman. Klik tombol 'Jadwalkan Pengiriman' untuk membuat jadwal pengiriman."
        />
      </div>
    </div>
  )
}
