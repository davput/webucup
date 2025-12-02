import { useState, useEffect } from 'react'
import { Plus, Edit, Users } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loaders, setLoaders] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [formData, setFormData] = useState({
    order_id: '',
    driver_id: '',
    delivery_date: '',
    route_order: 0,
    notes: ''
  })
  const [selectedWorkers, setSelectedWorkers] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: deliveriesData } = await supabase
      .from('deliveries')
      .select(`
        *,
        orders (order_number, stores (name, region)),
        employees:driver_id (name)
      `)
      .order('delivery_date', { ascending: false })

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, stores (name)')
      .eq('status', 'processing')

    const { data: driversData } = await supabase
      .from('employees')
      .select('*')
      .eq('role', 'driver')

    const { data: loadersData } = await supabase
      .from('employees')
      .select('*')
      .eq('role', 'loader')

    setDeliveries(deliveriesData || [])
    setOrders(ordersData || [])
    setDrivers(driversData || [])
    setLoaders(loadersData || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { data: delivery } = await supabase
      .from('deliveries')
      .insert([formData])
      .select()
      .single()

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'shipped' })
      .eq('id', formData.order_id)

    setIsModalOpen(false)
    setFormData({ order_id: '', driver_id: '', delivery_date: '', route_order: 0, notes: '' })
    loadData()
  }

  const openWorkerModal = (delivery) => {
    setSelectedDelivery(delivery)
    loadDeliveryWorkers(delivery.id)
    setIsWorkerModalOpen(true)
  }

  const loadDeliveryWorkers = async (deliveryId) => {
    const { data } = await supabase
      .from('delivery_workers')
      .select('employee_id')
      .eq('delivery_id', deliveryId)
    setSelectedWorkers(data?.map(w => w.employee_id) || [])
  }

  const saveWorkers = async () => {
    // Delete existing workers
    await supabase
      .from('delivery_workers')
      .delete()
      .eq('delivery_id', selectedDelivery.id)

    // Insert new workers
    const workers = selectedWorkers.map(employeeId => ({
      delivery_id: selectedDelivery.id,
      employee_id: employeeId,
      sacks_loaded: 0,
      wage_earned: 0
    }))

    await supabase.from('delivery_workers').insert(workers)

    setIsWorkerModalOpen(false)
    setSelectedDelivery(null)
    setSelectedWorkers([])
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Manajemen Pengiriman</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Jadwalkan pengiriman, atur rute, dan tugaskan driver & pegawai</p>
      </div>

      <Card
        title="Daftar Pengiriman"
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 inline mr-2" />
            Jadwalkan Pengiriman
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No. Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Toko</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Wilayah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Driver</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium">{delivery.orders?.order_number}</td>
                  <td className="px-4 py-3">{delivery.orders?.stores?.name}</td>
                  <td className="px-4 py-3">{delivery.orders?.stores?.region}</td>
                  <td className="px-4 py-3">{delivery.employees?.name}</td>
                  <td className="px-4 py-3">
                    {format(new Date(delivery.delivery_date), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      delivery.status === 'completed' ? 'bg-green-100 text-green-800' :
                      delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {delivery.status === 'completed' ? 'Selesai' :
                       delivery.status === 'in_progress' ? 'Dalam Perjalanan' : 'Dijadwalkan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openWorkerModal(delivery)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Pengiriman"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              required
              value={formData.order_id}
              onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
            <select
              required
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- Pilih Driver --</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pengiriman</label>
            <input
              type="date"
              required
              value={formData.delivery_date}
              onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urutan Rute</label>
            <input
              type="number"
              value={formData.route_order}
              onChange={(e) => setFormData({ ...formData, route_order: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

      <Modal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        title="Tugaskan Pegawai Bongkar Muat"
      >
        <div className="space-y-4">
          {loaders.map((loader) => (
            <label key={loader.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedWorkers.includes(loader.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedWorkers([...selectedWorkers, loader.id])
                  } else {
                    setSelectedWorkers(selectedWorkers.filter(id => id !== loader.id))
                  }
                }}
                className="mr-3"
              />
              <div>
                <p className="font-medium">{loader.name}</p>
                <p className="text-sm text-gray-600">
                  Upah: Rp {Number(loader.wage_per_sack).toLocaleString('id-ID')}/karung
                </p>
              </div>
            </label>
          ))}
          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsWorkerModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveWorkers}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
