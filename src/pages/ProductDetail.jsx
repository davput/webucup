import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Package, TrendingUp, TrendingDown, Store, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function ProductDetail() {
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [stockLogs, setStockLogs] = useState([])
  const [stockChart, setStockChart] = useState([])
  const [topStores, setTopStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProductDetail()
  }, [productId])

  const loadProductDetail = async () => {
    setLoading(true)

    // Load product
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    setProduct(productData)

    // Load stock logs (last 20)
    const { data: logsData } = await supabase
      .from('stock_logs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20)

    setStockLogs(logsData || [])

    // Load stock chart data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: chartData } = await supabase
      .from('stock_logs')
      .select('created_at, stock_after')
      .eq('product_id', productId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const groupedData = {}
    chartData?.forEach(log => {
      const date = format(new Date(log.created_at), 'dd MMM', { locale: id })
      groupedData[date] = log.stock_after
    })

    setStockChart(Object.entries(groupedData).map(([date, stock]) => ({ date, stock })))

    // Load top stores (who bought this product most)
    const { data: topStoresData } = await supabase
      .from('order_items')
      .select(`
        quantity,
        orders!inner(store_id, stores(name))
      `)
      .eq('product_id', productId)

    // Aggregate by store
    const storeMap = {}
    topStoresData?.forEach(item => {
      const storeName = item.orders?.stores?.name
      if (storeName) {
        storeMap[storeName] = (storeMap[storeName] || 0) + item.quantity
      }
    })

    const topStoresArray = Object.entries(storeMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    setTopStores(topStoresArray)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Produk tidak ditemukan</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Kembali ke Daftar Produk</span>
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {product.type} - {product.category} • Stok: {product.stock} {product.unit}
            </p>
          </div>
          <Button onClick={() => navigate(`/products/edit/${product.id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Produk
          </Button>
        </div>
      </div>

      {/* Product Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo */}
            <div className="w-full md:w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
              {product.photo_url ? (
                <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-16 h-16 text-gray-400" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Harga Modal</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.cost_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Harga Jual</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(product.selling_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Harga Grosir</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.wholesale_price || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Berat/Karung</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {product.weight_per_sack} kg
                  </p>
                </div>
              </div>

              {product.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Deskripsi</p>
                  <p className="text-gray-700 dark:text-gray-300">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stock Info */}
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Stok Saat Ini</p>
            <p className={`text-4xl font-bold mb-4 ${
              product.stock <= product.min_stock 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {product.stock}
            </p>
            <p className="text-gray-600 dark:text-gray-400">{product.unit}</p>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Minimal Stok</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {product.min_stock} {product.unit}
              </p>
            </div>

            <div className="mt-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                product.is_active
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
              }`}>
                {product.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Stock Chart */}
        <Card title="Grafik Stok 30 Hari Terakhir">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280' }} style={{ fontSize: '12px' }} />
                <YAxis tick={{ fill: '#6b7280' }} style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line type="monotone" dataKey="stock" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Stores */}
        <Card title="Top 5 Toko Pembeli">
          {topStores.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              Belum ada data penjualan
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280' }} style={{ fontSize: '12px' }} />
                  <YAxis tick={{ fill: '#6b7280' }} style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Stock Logs */}
      <Card title="Riwayat Stok">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tipe</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok Sebelum</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok Sesudah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      log.type === 'in' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                    }`}>
                      {log.type === 'in' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {log.type === 'in' ? 'Masuk' : 'Keluar'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {log.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {log.stock_before}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {log.stock_after}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
