import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'

export default function StoreReports() {
  const [reportType, setReportType] = useState('stores')
  const [reportData, setReportData] = useState([])
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [filterRegion, setFilterRegion] = useState('all')
  const [regions, setRegions] = useState([])

  useEffect(() => {
    loadReport()
  }, [reportType, dateRange, filterRegion])

  const loadReport = async () => {
    switch (reportType) {
      case 'stores':
        await loadStoresReport()
        break
      case 'debt':
        await loadDebtReport()
        break
      case 'purchases':
        await loadPurchasesReport()
        break
      case 'region':
        await loadRegionReport()
        break
      default:
        break
    }
  }

  const loadStoresReport = async () => {
    let query = supabase
      .from('stores')
      .select('*')
      .order('name')

    if (filterRegion !== 'all') {
      query = query.eq('region', filterRegion)
    }

    const { data } = await query
    setReportData(data || [])

    // Get unique regions
    const uniqueRegions = [...new Set(data?.map(s => s.region) || [])].sort()
    setRegions(uniqueRegions)
  }

  const loadDebtReport = async () => {
    let query = supabase
      .from('stores')
      .select('*')
      .gt('debt', 0)
      .order('debt', { ascending: false })

    if (filterRegion !== 'all') {
      query = query.eq('region', filterRegion)
    }

    const { data } = await query
    setReportData(data || [])
  }

  const loadPurchasesReport = async () => {
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, owner, region')

    const { data: orders } = await supabase
      .from('orders')
      .select('store_id, total_amount, order_date')
      .gte('order_date', dateRange.start)
      .lte('order_date', dateRange.end + 'T23:59:59')

    const storeStats = stores?.map(store => {
      const storeOrders = orders?.filter(o => o.store_id === store.id) || []
      return {
        ...store,
        total_orders: storeOrders.length,
        total_spent: storeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      }
    }).sort((a, b) => b.total_spent - a.total_spent) || []

    setReportData(storeStats)
  }

  const loadRegionReport = async () => {
    const { data: stores } = await supabase
      .from('stores')
      .select('region')

    const { data: orders } = await supabase
      .from('orders')
      .select('store_id, total_amount, stores(region)')
      .gte('order_date', dateRange.start)
      .lte('order_date', dateRange.end + 'T23:59:59')

    const regionStats = {}
    
    stores?.forEach(store => {
      if (!regionStats[store.region]) {
        regionStats[store.region] = {
          region: store.region,
          store_count: 0,
          total_orders: 0,
          total_sales: 0
        }
      }
      regionStats[store.region].store_count++
    })

    orders?.forEach(order => {
      const region = order.stores?.region
      if (region && regionStats[region]) {
        regionStats[region].total_orders++
        regionStats[region].total_sales += order.total_amount || 0
      }
    })

    setReportData(Object.values(regionStats).sort((a, b) => b.total_sales - a.total_sales))
  }

  const exportToCSV = () => {
    let csv = ''
    let filename = `laporan-toko-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`

    switch (reportType) {
      case 'stores':
        csv = 'Nama Toko,Pemilik,Telepon,Alamat,Kecamatan,Hutang\n'
        reportData.forEach(store => {
          csv += `"${store.name}","${store.owner}","${store.phone}","${store.address}","${store.region}",${store.debt || 0}\n`
        })
        break

      case 'debt':
        csv = 'Nama Toko,Pemilik,Kecamatan,Hutang\n'
        reportData.forEach(store => {
          csv += `"${store.name}","${store.owner}","${store.region}",${store.debt}\n`
        })
        break

      case 'purchases':
        csv = 'Nama Toko,Pemilik,Kecamatan,Total Order,Total Pembelian\n'
        reportData.forEach(store => {
          csv += `"${store.name}","${store.owner}","${store.region}",${store.total_orders},${store.total_spent}\n`
        })
        break

      case 'region':
        csv = 'Kecamatan,Jumlah Toko,Total Order,Total Penjualan\n'
        reportData.forEach(region => {
          csv += `"${region.region}",${region.store_count},${region.total_orders},${region.total_sales}\n`
        })
        break
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Laporan Toko</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Laporan lengkap data toko, hutang, dan pembelian</p>
      </div>

      <Card
        title="Filter Laporan"
        action={
          <Button onClick={exportToCSV}>
            <Download className="w-5 h-5 inline mr-2" />
            Export CSV
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label>Jenis Laporan</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="stores">Daftar Toko</option>
              <option value="debt">Laporan Hutang</option>
              <option value="purchases">Laporan Pembelian</option>
              <option value="region">Laporan Per Wilayah</option>
            </select>
          </div>

          {reportType !== 'region' && (
            <div>
              <label>Filter Kecamatan</label>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
              >
                <option value="all">Semua Kecamatan</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          )}

          {(reportType === 'purchases' || reportType === 'region') && (
            <>
              <div>
                <label>Tanggal Mulai</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <label>Tanggal Akhir</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Total: {reportData.length} data
        </div>

        <div className="overflow-x-auto">
          {/* Daftar Toko */}
          {reportType === 'stores' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Toko</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Pemilik</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Telepon</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Kecamatan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Hutang</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((store) => (
                  <tr key={store.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{store.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{store.owner}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{store.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{store.region}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={store.debt > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                        {formatCurrency(store.debt || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Laporan Hutang */}
          {reportType === 'debt' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Toko</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Pemilik</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Kecamatan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Hutang</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((store) => (
                  <tr key={store.id} className="bg-red-50 dark:bg-red-900/10">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{store.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{store.owner}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{store.region}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(store.debt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Laporan Pembelian */}
          {reportType === 'purchases' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Toko</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Pemilik</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Kecamatan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Order</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Pembelian</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((store) => (
                  <tr key={store.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{store.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{store.owner}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{store.region}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{store.total_orders}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(store.total_spent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Laporan Per Wilayah */}
          {reportType === 'region' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Kecamatan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah Toko</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Order</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Penjualan</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((region) => (
                  <tr key={region.region}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{region.region}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{region.store_count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400">{region.total_orders}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(region.total_sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
