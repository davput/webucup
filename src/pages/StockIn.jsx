import { useState, useEffect } from 'react'
import { Plus, TrendingUp, Edit, Trash2 } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import CurrencyInput from '../components/CurrencyInput'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function StockIn() {
  const { showToast } = useToast()
  const [stockIns, setStockIns] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [editingStockIn, setEditingStockIn] = useState(null)
  const [formData, setFormData] = useState({
    product_id: '',
    supplier_id: '',
    quantity: '',
    cost_price: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load stock ins
    const { data: stockInsData } = await supabase
      .from('stock_in')
      .select(`
        *,
        products (name, unit),
        suppliers (name)
      `)
      .order('date', { ascending: false })

    setStockIns(stockInsData || [])

    // Load products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    setProducts(productsData || [])

    // Load suppliers
    const { data: suppliersData } = await supabase
      .from('suppliers')
      .select('*')
      .order('name')

    setSuppliers(suppliersData || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const totalCost = parseFloat(formData.quantity) * parseFloat(formData.cost_price)

    if (editingStockIn) {
      // Update existing stock in
      const { error } = await supabase
        .from('stock_in')
        .update({
          ...formData,
          supplier_id: formData.supplier_id || null,
          total_cost: totalCost
        })
        .eq('id', editingStockIn.id)

      if (error) {
        showToast('Gagal mengupdate stok: ' + error.message, 'error')
        return
      }

      showToast('Data stok berhasil diupdate!', 'success')
    } else {
      // Insert new stock in
      const { data: stockIn, error } = await supabase
        .from('stock_in')
        .insert([{
          ...formData,
          supplier_id: formData.supplier_id || null,
          total_cost: totalCost,
          created_by: 'Admin'
        }])
        .select()
        .single()

      if (error) {
        showToast('Gagal menambah stok: ' + error.message, 'error')
        return
      }

      // Update product stock
      const product = products.find(p => p.id === formData.product_id)
      const newStock = product.stock + parseInt(formData.quantity)

      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', formData.product_id)

      // Check if stock log already exists for this stock_in
      const { data: existingLog } = await supabase
        .from('stock_logs')
        .select('id')
        .eq('reference_type', 'stock_in')
        .eq('reference_id', stockIn.id)
        .single()

      // Only create stock log if it doesn't exist yet
      if (!existingLog) {
        await supabase.from('stock_logs').insert([{
          product_id: formData.product_id,
          type: 'in',
          quantity: parseInt(formData.quantity),
          stock_before: product.stock,
          stock_after: newStock,
          reference_type: 'stock_in',
          reference_id: stockIn.id,
          notes: formData.notes,
          created_by: 'Admin'
        }])
      }

      showToast('Stok berhasil ditambahkan!', 'success')
    }

    setIsModalOpen(false)
    setEditingStockIn(null)
    setFormData({
      product_id: '',
      supplier_id: '',
      quantity: '',
      cost_price: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    loadData()
  }

  const handleSupplierSubmit = async (e) => {
    e.preventDefault()

    const { error } = await supabase.from('suppliers').insert([supplierForm])

    if (error) {
      showToast('Gagal menambah supplier: ' + error.message, 'error')
      return
    }

    showToast('Supplier berhasil ditambahkan!', 'success')
    setIsSupplierModalOpen(false)
    setSupplierForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    })
    loadData()
  }

  const handleEdit = (stockIn) => {
    setEditingStockIn(stockIn)
    setFormData({
      product_id: stockIn.product_id,
      supplier_id: stockIn.supplier_id || '',
      quantity: stockIn.quantity,
      cost_price: stockIn.cost_price,
      date: stockIn.date,
      notes: stockIn.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data stok masuk ini?')) return

    const { error } = await supabase
      .from('stock_in')
      .delete()
      .eq('id', id)

    if (error) {
      showToast('Gagal menghapus: ' + error.message, 'error')
      return
    }

    showToast('Data stok masuk berhasil dihapus!', 'success')
    loadData()
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Stok Masuk</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Catat stok masuk dari supplier dan update harga modal produk</p>
      </div>

      <Card
        title="Riwayat Stok Masuk"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsSupplierModalOpen(true)}>
              <Plus className="w-5 h-5 inline mr-2" />
              Supplier
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <TrendingUp className="w-5 h-5 inline mr-2" />
              Stok Masuk
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Supplier</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Harga Modal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Catatan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stockIns.map((stockIn) => (
                <tr key={stockIn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {format(new Date(stockIn.date), 'dd MMM yyyy', { locale: id })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {stockIn.products?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {stockIn.suppliers?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                    +{stockIn.quantity} {stockIn.products?.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(stockIn.cost_price)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(stockIn.total_cost)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {stockIn.notes || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(stockIn)} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(stockIn.id)} 
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Stok Masuk */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStockIn(null)
        }}
        title={editingStockIn ? 'Edit Stok Masuk' : 'Tambah Stok Masuk'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Produk</label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value)
                setFormData({ 
                  ...formData, 
                  product_id: e.target.value,
                  cost_price: product?.cost_price || ''
                })
              }}
            >
              <option value="">-- Pilih Produk --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (Stok: {product.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Supplier</label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            >
              <option value="">-- Pilih Supplier (Opsional) --</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Jumlah</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div>
              <CurrencyInput
                label="Harga Modal/Unit"
                required
                value={formData.cost_price}
                onChange={(value) => setFormData({ ...formData, cost_price: value })}
              />
            </div>
          </div>

          <div>
            <label>Tanggal</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {formData.quantity && formData.cost_price && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Biaya</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.cost_price))}
              </p>
            </div>
          )}

          <div>
            <label>Catatan</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => {
              setIsModalOpen(false)
              setEditingStockIn(null)
            }}>
              Batal
            </Button>
            <Button type="submit">{editingStockIn ? 'Update' : 'Simpan'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Supplier */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Tambah Supplier"
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <div>
            <label>Nama Supplier</label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
            />
          </div>

          <div>
            <label>Contact Person</label>
            <input
              type="text"
              value={supplierForm.contact_person}
              onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Telepon</label>
              <input
                type="tel"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label>Alamat</label>
            <textarea
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              rows="3"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsSupplierModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
