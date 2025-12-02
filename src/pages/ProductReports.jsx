import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function ProductReports() {
  const [reportType, setReportType] = useState('stock')
  const [reportData, setReportData] = useState([])
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReport()
  }, [reportType, dateRange])

  const loadReport = async () => {
    switch (reportType) {
      case 'stock':
        await loadStockReport()
        break
      case 'stock-in':
        await loadStockInReport()
        break
      case 'stock-out':
        await loadStockOutReport()
        break
      case 'adjustment':
        await loadAdjustmentReport()
        break
      case 'value':
        await loadValueReport()
        break
      default:
        break
    }
  }

  const loadStockReport = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('stock', { ascending: false })
    setReportData(data || [])
  }

  const loadStockInReport = async () => {
    const { data, error } = await supabase
      .from('stock_in')
      .select(`
        *,
        products (name, unit, type),
        suppliers (name)
      `)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error loading stock in report:', error)
      setReportData([])
      return
    }
    setReportData(data || [])
  }

  const loadStockOutReport = async () => {
    const { data } = await supabase
      .from('stock_logs')
      .select(`
        *,
        products (name, unit, type)
      `)
      .eq('type', 'out')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59')
      .order('created_at', { ascending: false })
    setReportData(data || [])
  }

  const loadAdjustmentReport = async () => {
    const { data } = await supabase
      .from('stock_logs')
      .select(`
        *,
        products (name, unit, type)
      `)
      .in('type', ['adjustment', 'damaged', 'lost', 'expired'])
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end + 'T23:59:59')
      .order('created_at', { ascending: false })
    setReportData(data || [])
  }

  const loadValueReport = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('stock', { ascending: false })
    
    const enriched = data?.map(p => ({
      ...p,
      stock_value: p.stock * p.cost_price,
      potential_revenue: p.stock * p.selling_price,
      potential_profit: p.stock * (p.selling_price - p.cost_price)
    })) || []
    
    setReportData(enriched)
  }

  const exportToCSV = () => {
    let csv = ''
    let filename = `laporan-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`

    switch (reportType) {
      case 'stock':
        csv = 'Nama,Jenis,Kategori,Stok,Min Stok,Satuan,Status\n'
        reportData.forEach(item => {
          csv += `"${item.name}","${item.type}","${item.category || '-'}",${item.stock},${item.min_stock},"${item.unit}","${item.is_active ? 'Aktif' : 'Tidak Aktif'}"\n`
        })
        break
      
      case 'stock-in':
        csv = 'Tanggal,Produk,Supplier,Jumlah,Harga Modal,Total\n'
        reportData.forEach(item => {
          csv += `"${item.date}","${item.products?.name}","${item.suppliers?.name || '-'}",${item.quantity},${item.cost_price},${item.total_cost}\n`
        })
        break
      
      case 'stock-out':
        csv = 'Tanggal,Produk,Jumlah,Stok Sebelum,Stok Sesudah\n'
        reportData.forEach(item => {
          const dateStr = item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm') : '-'
          csv += `"${dateStr}","${item.products?.name}",${Math.abs(item.quantity)},${item.stock_before},${item.stock_after}\n`
        })
        break
      
      case 'adjustment':
        csv = 'Tanggal,Produk,Jenis,Perubahan,Stok Sebelum,Stok Sesudah,Keterangan\n'
        reportData.forEach(item => {
          const dateStr = item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm') : '-'
          csv += `"${dateStr}","${item.products?.name}","${item.type}",${item.quantity},${item.stock_before},${item.stock_after},"${item.notes || '-'}"\n`
        })
        break
      
      case 'value':
        csv = 'Nama,Jenis,Stok,Harga Modal,Harga Jual,Nilai Stok,Potensi Pendapatan,Potensi Profit\n'
        reportData.forEach(item => {
          csv += `"${item.name}","${item.type}",${item.stock},${item.cost_price},${item.selling_price},${item.stock_value},${item.potential_revenue},${item.potential_profit}\n`
        })
        break
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const getTotalValue = () => {
    if (reportType === 'value') {
      return {
        stockValue: reportData.reduce((sum, item) => sum + item.stock_value, 0),
        potentialRevenue: reportData.reduce((sum, item) => sum + item.potential_revenue, 0),
        potentialProfit: reportData.reduce((sum, item) => sum + item.potential_profit, 0)
      }
    }
    return null
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Laporan Produk</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Laporan lengkap stok, pergerakan, dan nilai produk</p>
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
              <option value="stock">Laporan Stok</option>
              <option value="stock-in">Laporan Stok Masuk</option>
              <option value="stock-out">Laporan Stok Keluar</option>
              <option value="adjustment">Laporan Penyesuaian</option>
              <option value="value">Laporan Nilai Stok</option>
            </select>
          </div>

          {reportType !== 'stock' && reportType !== 'value' && (
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

        {/* Summary for Value Report */}
        {reportType === 'value' && getTotalValue() && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Nilai Stok</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(getTotalValue().stockValue)}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Potensi Pendapatan</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(getTotalValue().potentialRevenue)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Potensi Profit</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(getTotalValue().potentialProfit)}
              </p>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Total: {reportData.length} data
        </div>

        <div className="overflow-x-auto">
          {/* Stock Report */}
          {reportType === 'stock' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Min Stok</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((item) => (
                  <tr key={item.id} className={item.stock <= item.min_stock ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={item.stock <= item.min_stock ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-900 dark:text-gray-100'}>
                        {item.stock} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.min_stock}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Stock In Report */}
          {reportType === 'stock-in' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Harga Modal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {item.date ? format(new Date(item.date), 'dd MMM yyyy', { locale: id }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.products?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.suppliers?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                      +{item.quantity} {item.products?.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{formatCurrency(item.cost_price)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Stock Out Report */}
          {reportType === 'stock-out' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok Sebelum</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok Sesudah</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.products?.name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                      {item.quantity} {item.products?.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.stock_before}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{item.stock_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Adjustment Report */}
          {reportType === 'adjustment' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Perubahan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.products?.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${item.quantity >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.quantity >= 0 ? '+' : ''}{item.quantity} {item.products?.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Value Report */}
          {reportType === 'value' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nilai Stok</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Potensi Pendapatan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Potensi Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.stock} {item.unit}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(item.stock_value)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.potential_revenue)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(item.potential_profit)}</td>
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
