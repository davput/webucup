import { useState, useEffect } from 'react'
import { Plus, Eye, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800'
}

const statusLabels = {
  pending: 'Pending',
  processing: 'Proses',
  shipped: 'Dikirim',
  completed: 'Selesai'
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        stores (name)
      `)
      .order('order_date', { ascending: false })
    setOrders(data || [])
  }

  const updateStatus = async (orderId, newStatus) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    loadOrders()
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Manajemen Order</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Kelola pesanan dari toko dan tracking status pengiriman</p>
      </div>

      <Card
        title="Daftar Order"
        action={
          <Button onClick={() => navigate('/orders/create')}>
            <Plus className="w-5 h-5 inline mr-2" />
            Buat Order
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No. Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toko</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium">{order.order_number}</td>
                  <td className="px-4 py-3">{order.stores?.name}</td>
                  <td className="px-4 py-3">
                    {format(new Date(order.order_date), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.total_amount)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}
                    >
                      {Object.keys(statusLabels).map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
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
