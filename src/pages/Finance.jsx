import { useState, useEffect } from 'react'
import { Plus, DollarSign } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function Finance() {
  const [payments, setPayments] = useState([])
  const [stores, setStores] = useState([])
  const [orders, setOrders] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    order_id: '',
    amount: '',
    payment_method: 'cash',
    notes: ''
  })
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalDebt: 0,
    todayIncome: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`
        *,
        orders (order_number, stores (name))
      `)
      .order('payment_date', { ascending: false })

    const { data: storesData } = await supabase.from('stores').select('*')
    
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, stores (name)')
      .in('status', ['shipped', 'completed'])

    setPayments(paymentsData || [])
    setStores(storesData || [])
    setOrders(ordersData || [])

    // Calculate summary
    const totalIncome = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const totalDebt = storesData?.reduce((sum, s) => sum + Number(s.debt), 0) || 0
    
    const today = new Date().toISOString().split('T')[0]
    const todayIncome = paymentsData?.filter(p => 
      p.payment_date.startsWith(today)
    ).reduce((sum, p) => sum + Number(p.amount), 0) || 0

    setSummary({ totalIncome, totalDebt, todayIncome })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    await supabase.from('payments').insert([formData])

    // Update store debt
    const order = orders.find(o => o.id === formData.order_id)
    if (order) {
      const { data: store } = await supabase
        .from('stores')
        .select('debt')
        .eq('id', order.store_id)
        .single()

      const newDebt = Number(store.debt) - Number(formData.amount)
      await supabase
        .from('stores')
        .update({ debt: Math.max(0, newDebt) })
        .eq('id', order.store_id)
    }

    setIsModalOpen(false)
    setFormData({ order_id: '', amount: '', payment_method: 'cash', notes: '' })
    loadData()
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Manajemen Keuangan</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Catat pembayaran, kelola piutang, dan monitor pemasukan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Pemasukan</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Piutang</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {formatCurrency(summary.totalDebt)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Pemasukan Hari Ini</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {formatCurrency(summary.todayIncome)}
            </p>
          </div>
        </Card>
      </div>

      <Card
        title="Riwayat Pembayaran"
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 inline mr-2" />
            Catat Pembayaran
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No. Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toko</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Metode</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    {format(new Date(payment.payment_date), 'dd MMM yyyy HH:mm', { locale: id })}
                  </td>
                  <td className="px-4 py-3">{payment.orders?.order_number}</td>
                  <td className="px-4 py-3">{payment.orders?.stores?.name}</td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Pembayaran"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              required
              value={formData.order_id}
              onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Pilih Order --</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number} - {order.stores?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
            <select
              required
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="check">Cek</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
