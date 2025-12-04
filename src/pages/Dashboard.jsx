import { useState, useEffect } from 'react'
import { Package, Store, ShoppingCart, Truck } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStock: 0,
    totalStores: 0,
    todayOrders: 0,
    todayDeliveries: 0,
    totalProducts: 0,
    activeProducts: 0,
    lowStockCount: 0
  })
  const [salesData, setSalesData] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [widgetSettings, setWidgetSettings] = useState({
    stats: true,
    'sales-chart': true,
    'low-stock': true,
    'top-products': true,
    'recent-orders': false,
    'recent-deliveries': false
  })

  useEffect(() => {
    loadDashboardData()
    loadWidgetSettings()
    
    // Listen for widget settings updates
    const handleWidgetUpdate = () => {
      loadWidgetSettings()
    }
    window.addEventListener('dashboardWidgetsUpdated', handleWidgetUpdate)
    
    return () => {
      window.removeEventListener('dashboardWidgetsUpdated', handleWidgetUpdate)
    }
  }, [])

  async function loadWidgetSettings() {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'dashboard_widgets')
        .single()

      if (data?.setting_value) {
        const widgets = JSON.parse(data.setting_value)
        const settings = {}
        widgets.forEach(w => {
          settings[w.id] = w.enabled
        })
        setWidgetSettings(settings)
      }
    } catch (error) {
      console.error('Error loading widget settings:', error)
    }
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load all products
      const { data: allProducts } = await supabase.from('products').select('*')
    
    // Total stok
    const totalStock = allProducts?.reduce((sum, p) => sum + p.stock, 0) || 0
    
    // Product stats
    const totalProducts = allProducts?.length || 0
    const activeProducts = allProducts?.filter(p => p.is_active).length || 0
    const lowStock = allProducts?.filter(p => p.stock <= p.min_stock) || []
    const lowStockCount = lowStock.length

    // Total toko
    const { count: storeCount } = await supabase.from('stores').select('*', { count: 'exact', head: true })

    // Order hari ini
    const today = new Date().toISOString().split('T')[0]
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('order_date', today)

    // Pengiriman hari ini
    const { count: deliveryCount } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_date', today)

    setStats({
      totalStock,
      totalStores: storeCount || 0,
      todayOrders: orderCount || 0,
      todayDeliveries: deliveryCount || 0,
      totalProducts,
      activeProducts,
      lowStockCount
    })

    // Produk stok menipis (top 5)
    setLowStockProducts(lowStock.slice(0, 5))
    
    // Top products by stock
    const topByStock = [...(allProducts || [])]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5)
    setTopProducts(topByStock)

      // Data penjualan bulanan (mock data untuk demo)
      setSalesData([
        { month: 'Jan', sales: 4000 },
        { month: 'Feb', sales: 3000 },
        { month: 'Mar', sales: 5000 },
        { month: 'Apr', sales: 4500 },
        { month: 'Mei', sales: 6000 },
        { month: 'Jun', sales: 5500 },
      ])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Skeleton Component
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  )

  const SkeletonList = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  )

  const SkeletonChart = () => (
    <div className="h-64 lg:h-80 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 dark:text-gray-600">Loading chart...</div>
    </div>
  )

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Ringkasan statistik dan performa distribusi pupuk</p>
      </div>

      {loading ? (
        <>
          {/* Skeleton Stats Cards - Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* Skeleton Stats Cards - Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* Skeleton Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <Card title="⚠️ Stok Menipis">
              <SkeletonList />
            </Card>
            <Card title="📦 Stok Terbanyak">
              <SkeletonList />
            </Card>
            <Card title="📊 Distribusi Jenis">
              <SkeletonList />
            </Card>
          </div>

          {/* Skeleton Chart */}
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <Card title="Penjualan Bulanan">
              <SkeletonChart />
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Stats Cards */}
          {widgetSettings.stats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
                <StatCard title="Total Produk" value={stats.totalProducts} icon={Package} color="blue" subtitle={`${stats.activeProducts} aktif`} />
                <StatCard title="Total Stok" value={stats.totalStock} icon={Package} color="green" subtitle="karung" />
                <StatCard title="Stok Rendah" value={stats.lowStockCount} icon={Package} color="red" subtitle="perlu restock" />
                <StatCard title="Total Toko" value={stats.totalStores} icon={Store} color="purple" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <StatCard title="Order Hari Ini" value={stats.todayOrders} icon={ShoppingCart} color="yellow" />
                <StatCard title="Pengiriman Hari Ini" value={stats.todayDeliveries} icon={Truck} color="orange" />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Stok Menipis */}
            {widgetSettings['low-stock'] && (
              <Card title="⚠️ Stok Menipis">
          {lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-medium">Semua stok aman</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tidak ada produk dengan stok menipis</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:shadow-sm transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.type}</p>
                  </div>
                  <span className="text-red-600 dark:text-red-400 font-bold ml-4 whitespace-nowrap">
                    {product.stock} {product.unit}
                  </span>
                </div>
              ))}
            </div>
              )}
            </Card>

            )}

            {/* Top Products */}
            {widgetSettings['top-products'] && (
              <Card title="📦 Stok Terbanyak">
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-sm transition">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 dark:bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.type}</p>
                  </div>
                </div>
                <span className="text-green-600 dark:text-green-400 font-bold ml-4 whitespace-nowrap">
                  {product.stock} {product.unit}
                </span>
              </div>
              ))}
            </div>
              </Card>
            )}

            {/* Product Types Distribution */}
            <Card title="📊 Distribusi Jenis">
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {(() => {
              const typeStats = {}
              topProducts.forEach(p => {
                if (!typeStats[p.type]) {
                  typeStats[p.type] = { count: 0, stock: 0 }
                }
                typeStats[p.type].count++
                typeStats[p.type].stock += p.stock
              })
              return Object.entries(typeStats).map(([type, data]) => (
                <div key={type} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">{type}</p>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{data.stock}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(data.stock / stats.totalStock) * 100}%` }}
                    />
                  </div>
                </div>
                ))
              })()}
            </div>
            </Card>
          </div>

          {/* Grafik Penjualan */}
          {widgetSettings['sales-chart'] && (
            <div className="grid grid-cols-1 gap-4 lg:gap-6">
              <Card title="Penjualan Bulanan">
          <div className="h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280' }}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280' }}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                </LineChart>
              </ResponsiveContainer>
            </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
