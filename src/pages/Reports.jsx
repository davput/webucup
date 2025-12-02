import { useState, useEffect } from 'react'
import { FileDown, TrendingUp, TrendingDown, DollarSign, Package, Truck, Store, Calendar, Filter, BarChart3, PieChart, Download } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function Reports() {
  const { showToast } = useToast()
  const [reportType, setReportType] = useState('sales')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const generateReport = async () => {
    if (reportType !== 'stock' && (!dateFrom || !dateTo)) {
      showToast('Pilih tanggal mulai dan akhir', 'error')
      return
    }

    setLoading(true)
    try {
      if (reportType === 'sales') {
        let query = supabase
          .from('orders')
          .select(`
            *,
            stores (name, region, address),
            order_items (quantity, subtotal, products (name, type))
          `)
          .gte('order_date', dateFrom)
          .lte('order_date', dateTo)
          .order('order_date', { ascending: false })

        if (selectedRegion) {
          query = query.eq('stores.region', selectedRegion)
        }
        if (selectedStatus) {
          query = query.eq('status', selectedStatus)
        }

        const { data, error } = await query
        if (error) throw error

        setReportData(data || [])
        
        // Calculate summary
        const totalOrders = data?.length || 0
        const totalRevenue = data?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0
        const totalQuantity = data?.reduce((sum, order) => {
          return sum + (order.order_items?.reduce((s, item) => s + item.quantity, 0) || 0)
        }, 0) || 0
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

        setSummary({
          totalOrders,
          totalRevenue,
          totalQuantity,
          avgOrderValue,
          completedOrders: data?.filter(o => o.status === 'completed').length || 0,
          pendingOrders: data?.filter(o => o.status === 'pending').length || 0
        })

      } else if (reportType === 'deliveries') {
        let query = supabase
          .from('deliveries')
          .select(`
            *,
            orders (order_number, total_amount, stores (name, region, address)),
            employees (name, role)
          `)
          .gte('delivery_date', dateFrom)
          .lte('delivery_date', dateTo)
          .order('delivery_date', { ascending: false })

        if (selectedRegion) {
          query = query.eq('orders.stores.region', selectedRegion)
        }

        const { data, error } = await query
        if (error) throw error

        setReportData(data || [])

        // Calculate summary
        const totalDeliveries = data?.length || 0
        const completedDeliveries = data?.filter(d => d.status === 'completed').length || 0
        const ongoingDeliveries = data?.filter(d => d.status === 'on_delivery').length || 0
        const totalValue = data?.reduce((sum, d) => sum + Number(d.orders?.total_amount || 0), 0) || 0

        setSummary({
          totalDeliveries,
          completedDeliveries,
          ongoingDeliveries,
          totalValue,
          completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries * 100).toFixed(1) : 0
        })

      } else if (reportType === 'stock') {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('stock', { ascending: true })
        
        if (error) throw error

        // Filter produk yang stoknya <= min_stock
        const lowStockProducts = data?.filter(p => p.stock <= p.min_stock) || []
        setReportData(lowStockProducts)

        // Calculate summary
        const totalProducts = data?.length || 0
        const lowStockCount = lowStockProducts.length
        const outOfStock = data?.filter(p => p.stock === 0).length || 0
        const totalStockValue = data?.reduce((sum, p) => sum + (p.stock * p.price), 0) || 0

        setSummary({
          totalProducts,
          lowStockCount,
          outOfStock,
          totalStockValue,
          criticalPercentage: totalProducts > 0 ? (lowStockCount / totalProducts * 100).toFixed(1) : 0
        })

      } else if (reportType === 'finance') {
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            *,
            stores (name, region),
            payments (*)
          `)
          .gte('order_date', dateFrom)
          .lte('order_date', dateTo)
          .order('order_date', { ascending: false })

        if (error) throw error

        setReportData(orders || [])

        // Calculate financial summary
        const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
        const totalPaid = orders?.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0) || 0
        const totalDebt = totalRevenue - totalPaid
        const paidOrders = orders?.filter(o => o.payment_status === 'paid').length || 0
        const partialOrders = orders?.filter(o => o.payment_status === 'partial').length || 0
        const unpaidOrders = orders?.filter(o => o.payment_status === 'unpaid').length || 0

        setSummary({
          totalRevenue,
          totalPaid,
          totalDebt,
          paidOrders,
          partialOrders,
          unpaidOrders,
          collectionRate: totalRevenue > 0 ? (totalPaid / totalRevenue * 100).toFixed(1) : 0
        })
      }

      showToast('Laporan berhasil di-generate', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('LAPORAN DISTRIBUSI PUPUK', 14, 20)
    
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    const reportTitle = {
      sales: 'Laporan Penjualan',
      deliveries: 'Laporan Pengiriman',
      stock: 'Laporan Stok Menipis',
      finance: 'Laporan Keuangan'
    }
    doc.text(reportTitle[reportType], 14, 28)
    
    if (dateFrom && dateTo) {
      doc.text(`Periode: ${dateFrom} s/d ${dateTo}`, 14, 35)
    }
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 42)

    // Summary
    let startY = 50
    if (summary) {
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('RINGKASAN:', 14, startY)
      doc.setFont(undefined, 'normal')
      startY += 7

      if (reportType === 'sales') {
        doc.text(`Total Order: ${summary.totalOrders}`, 14, startY)
        doc.text(`Total Pendapatan: ${formatCurrency(summary.totalRevenue)}`, 14, startY + 5)
        doc.text(`Total Karung: ${summary.totalQuantity}`, 14, startY + 10)
        doc.text(`Rata-rata Order: ${formatCurrency(summary.avgOrderValue)}`, 14, startY + 15)
        startY += 25
      } else if (reportType === 'deliveries') {
        doc.text(`Total Pengiriman: ${summary.totalDeliveries}`, 14, startY)
        doc.text(`Selesai: ${summary.completedDeliveries} (${summary.completionRate}%)`, 14, startY + 5)
        doc.text(`Dalam Perjalanan: ${summary.ongoingDeliveries}`, 14, startY + 10)
        doc.text(`Total Nilai: ${formatCurrency(summary.totalValue)}`, 14, startY + 15)
        startY += 25
      } else if (reportType === 'stock') {
        doc.text(`Total Produk: ${summary.totalProducts}`, 14, startY)
        doc.text(`Stok Menipis: ${summary.lowStockCount} (${summary.criticalPercentage}%)`, 14, startY + 5)
        doc.text(`Habis: ${summary.outOfStock}`, 14, startY + 10)
        doc.text(`Nilai Stok: ${formatCurrency(summary.totalStockValue)}`, 14, startY + 15)
        startY += 25
      } else if (reportType === 'finance') {
        doc.text(`Total Pendapatan: ${formatCurrency(summary.totalRevenue)}`, 14, startY)
        doc.text(`Terbayar: ${formatCurrency(summary.totalPaid)} (${summary.collectionRate}%)`, 14, startY + 5)
        doc.text(`Piutang: ${formatCurrency(summary.totalDebt)}`, 14, startY + 10)
        doc.text(`Lunas: ${summary.paidOrders} | Sebagian: ${summary.partialOrders} | Belum: ${summary.unpaidOrders}`, 14, startY + 15)
        startY += 25
      }
    }

    // Table
    if (reportType === 'sales') {
      const tableData = reportData.map(order => {
        const totalQty = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
        return [
          order.order_number,
          new Date(order.order_date).toLocaleDateString('id-ID'),
          order.stores?.name,
          order.stores?.region,
          `${totalQty} karung`,
          formatCurrency(order.total_amount),
          order.status
        ]
      })

      doc.autoTable({
        startY: startY,
        head: [['No. Order', 'Tanggal', 'Toko', 'Wilayah', 'Jumlah', 'Total', 'Status']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })
    } else if (reportType === 'deliveries') {
      const tableData = reportData.map(delivery => [
        delivery.orders?.order_number,
        delivery.orders?.stores?.name,
        delivery.orders?.stores?.region,
        delivery.employees?.name,
        new Date(delivery.delivery_date).toLocaleDateString('id-ID'),
        formatCurrency(delivery.orders?.total_amount),
        delivery.status === 'on_delivery' ? 'Dalam Perjalanan' : delivery.status
      ])

      doc.autoTable({
        startY: startY,
        head: [['No. Order', 'Toko', 'Wilayah', 'Driver', 'Tanggal', 'Nilai', 'Status']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })
    } else if (reportType === 'stock') {
      const tableData = reportData.map(product => [
        product.name,
        product.type,
        `${product.stock} ${product.unit}`,
        `${product.min_stock} ${product.unit}`,
        formatCurrency(product.price),
        formatCurrency(product.stock * product.price),
        product.stock === 0 ? 'Habis' : 'Menipis'
      ])

      doc.autoTable({
        startY: startY,
        head: [['Produk', 'Jenis', 'Stok', 'Min. Stok', 'Harga', 'Nilai Stok', 'Status']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })
    } else if (reportType === 'finance') {
      const tableData = reportData.map(order => {
        const remaining = Number(order.total_amount || 0) - Number(order.paid_amount || 0)
        return [
          order.order_number,
          new Date(order.order_date).toLocaleDateString('id-ID'),
          order.stores?.name,
          formatCurrency(order.total_amount),
          formatCurrency(order.paid_amount || 0),
          formatCurrency(remaining),
          order.payment_status === 'paid' ? 'Lunas' :
          order.payment_status === 'partial' ? 'Sebagian' : 'Belum Bayar'
        ]
      })

      doc.autoTable({
        startY: startY,
        head: [['No. Order', 'Tanggal', 'Toko', 'Total', 'Terbayar', 'Sisa', 'Status']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' })
    }

    doc.save(`laporan-${reportType}-${new Date().getTime()}.pdf`)
    showToast('PDF berhasil diexport', 'success')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="w-7 h-7 mr-3 text-blue-600" />
          Laporan & Analisis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Generate laporan komprehensif untuk analisis bisnis</p>
      </div>

      {/* Filter Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Laporan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <PieChart className="w-4 h-4 inline mr-1" />
                Jenis Laporan
              </label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value)
                  setReportData([])
                  setSummary(null)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="sales">📊 Laporan Penjualan</option>
                <option value="deliveries">🚚 Laporan Pengiriman</option>
                <option value="stock">📦 Laporan Stok</option>
                <option value="finance">💰 Laporan Keuangan</option>
              </select>
            </div>

            {reportType !== 'stock' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </>
            )}

            {(reportType === 'sales' || reportType === 'deliveries') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wilayah (Opsional)
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Semua Wilayah</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Bogor">Bogor</option>
                  <option value="Depok">Depok</option>
                  <option value="Tangerang">Tangerang</option>
                  <option value="Bekasi">Bekasi</option>
                </select>
              </div>
            )}

            {reportType === 'sales' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status (Opsional)
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={generateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Laporan'}
            </Button>
            {reportData.length > 0 && (
              <Button onClick={exportPDF} variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="mt-6">
          {reportType === 'sales' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Order</p>
                    <p className="text-3xl font-bold mt-2">{summary.totalOrders}</p>
                    <p className="text-blue-100 text-xs mt-1">
                      {summary.completedOrders} selesai, {summary.pendingOrders} pending
                    </p>
                  </div>
                  <Package className="w-12 h-12 text-blue-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Pendapatan</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.totalRevenue)}</p>
                    <p className="text-green-100 text-xs mt-1">Periode dipilih</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Karung</p>
                    <p className="text-3xl font-bold mt-2">{summary.totalQuantity.toLocaleString()}</p>
                    <p className="text-purple-100 text-xs mt-1">Terjual</p>
                  </div>
                  <Package className="w-12 h-12 text-purple-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Rata-rata Order</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.avgOrderValue)}</p>
                    <p className="text-orange-100 text-xs mt-1">Per transaksi</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-orange-200 opacity-80" />
                </div>
              </div>
            </div>
          )}

          {reportType === 'deliveries' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Pengiriman</p>
                    <p className="text-3xl font-bold mt-2">{summary.totalDeliveries}</p>
                  </div>
                  <Truck className="w-12 h-12 text-blue-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Selesai</p>
                    <p className="text-3xl font-bold mt-2">{summary.completedDeliveries}</p>
                    <p className="text-green-100 text-xs mt-1">{summary.completionRate}% completion rate</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Dalam Perjalanan</p>
                    <p className="text-3xl font-bold mt-2">{summary.ongoingDeliveries}</p>
                  </div>
                  <Truck className="w-12 h-12 text-yellow-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Nilai</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.totalValue)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-purple-200 opacity-80" />
                </div>
              </div>
            </div>
          )}

          {reportType === 'stock' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Produk</p>
                    <p className="text-3xl font-bold mt-2">{summary.totalProducts}</p>
                  </div>
                  <Package className="w-12 h-12 text-blue-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Stok Menipis</p>
                    <p className="text-3xl font-bold mt-2">{summary.lowStockCount}</p>
                    <p className="text-red-100 text-xs mt-1">{summary.criticalPercentage}% dari total</p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-red-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Habis</p>
                    <p className="text-3xl font-bold mt-2">{summary.outOfStock}</p>
                  </div>
                  <Package className="w-12 h-12 text-orange-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Nilai Stok</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.totalStockValue)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-200 opacity-80" />
                </div>
              </div>
            </div>
          )}

          {reportType === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Pendapatan</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.totalRevenue)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-blue-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Terbayar</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.totalPaid)}</p>
                    <p className="text-green-100 text-xs mt-1">{summary.collectionRate}% collection rate</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Piutang</p>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(summary.totalDebt)}</p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-red-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Status Pembayaran</p>
                    <p className="text-sm font-bold mt-2">
                      Lunas: {summary.paidOrders}<br/>
                      Sebagian: {summary.partialOrders}<br/>
                      Belum: {summary.unpaidOrders}
                    </p>
                  </div>
                  <Store className="w-12 h-12 text-purple-200 opacity-80" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      {reportData.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Hasil Laporan ({reportData.length} data)
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {dateFrom && dateTo && `${dateFrom} s/d ${dateTo}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              {reportType === 'sales' && (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No. Order</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toko</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Wilayah</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah Karung</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.map((order) => {
                      const totalQty = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{order.order_number}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{order.stores?.name}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{order.stores?.region}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{totalQty} karung</td>
                          <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{formatCurrency(order.total_amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {reportType === 'deliveries' && (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No. Order</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toko</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Wilayah</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Driver</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nilai Order</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{delivery.orders?.order_number}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{delivery.orders?.stores?.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{delivery.orders?.stores?.region}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{delivery.employees?.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(delivery.delivery_date).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{formatCurrency(delivery.orders?.total_amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            delivery.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            delivery.status === 'on_delivery' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {delivery.status === 'on_delivery' ? 'Dalam Perjalanan' : delivery.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'stock' && (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok Saat Ini</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Min. Stok</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Harga</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nilai Stok</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{product.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.type}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${
                            product.stock === 0 ? 'text-red-600 dark:text-red-400' :
                            product.stock <= product.min_stock ? 'text-orange-600 dark:text-orange-400' :
                            'text-gray-900 dark:text-gray-100'
                          }`}>
                            {product.stock} {product.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.min_stock} {product.unit}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.stock * product.price)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.stock === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {product.stock === 0 ? 'Habis' : 'Menipis'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'finance' && (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No. Order</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toko</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Terbayar</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Sisa Hutang</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.map((order) => {
                      const remaining = Number(order.total_amount || 0) - Number(order.paid_amount || 0)
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{order.order_number}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{order.stores?.name}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.total_amount)}</td>
                          <td className="px-4 py-3 text-green-600 dark:text-green-400">{formatCurrency(order.paid_amount || 0)}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${
                              remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {formatCurrency(remaining)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {order.payment_status === 'paid' ? 'Lunas' :
                               order.payment_status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
