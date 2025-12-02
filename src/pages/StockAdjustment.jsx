import { useState, useEffect } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function StockAdjustment() {
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [adjustments, setAdjustments] = useState([])
  const [products, setProducts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    type: 'adjustment',
    quantity: '',
    reason: '',
    notes: ''
  })

  const adjustmentTypes = [
    { value: 'adjustment', label: 'Koreksi Stok', color: 'blue' },
    { value: 'damaged', label: 'Barang Rusak', color: 'red' },
    { value: 'lost', label: 'Hilang', color: 'orange' },
    { value: 'expired', label: 'Kadaluarsa', color: 'yellow' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load adjustments
    const { data: adjustmentsData } = await supabase
      .from('stock_logs')
      .select(`
        *,
        products (name, unit)
      `)
      .in('type', ['adjustment', 'damaged', 'lost', 'expired'])
      .order('created_at', { ascending: false })

    setAdjustments(adjustmentsData || [])

    // Load products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    setProducts(productsData || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const product = products.find(p => p.id === formData.product_id)
    const quantity = parseInt(formData.quantity)
    const isNegative = formData.type !== 'adjustment' || quantity < 0
    const actualQuantity = isNegative ? -Math.abs(quantity) : quantity
    const newStock = product.stock + actualQuantity

    if (newStock < 0) {
      showError('Stok tidak boleh negatif!')
      return
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', formData.product_id)

    if (updateError) {
      showError('Gagal mengupdate stok: ' + updateError.message)
      return
    }

    // Create stock log
    const { error: logError } = await supabase
      .from('stock_logs')
      .insert([{
        product_id: formData.product_id,
        type: formData.type,
        quantity: actualQuantity,
        stock_before: product.stock,
        stock_after: newStock,
        reference_type: 'manual',
        notes: `${formData.reason}${formData.notes ? ': ' + formData.notes : ''}`,
        created_by: 'Admin'
      }])

    if (logError) {
      showError('Gagal mencatat log: ' + logError.message)
      return
    }

    showSuccess('Penyesuaian stok berhasil!')
    setIsModalOpen(false)
    setFormData({
      product_id: '',
      type: 'adjustment',
      quantity: '',
      reason: '',
      notes: ''
    })
    loadData()
  }

  const getTypeColor = (type) => {
    const typeObj = adjustmentTypes.find(t => t.value === type)
    return typeObj?.color || 'gray'
  }

  const getTypeLabel = (type) => {
    const typeObj = adjustmentTypes.find(t => t.value === type)
    return typeObj?.label || type
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      <div>
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Penyesuaian Stok</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Koreksi stok manual untuk barang rusak, hilang, atau penyesuaian lainnya</p>
        </div>

        <Card
          title="Riwayat Penyesuaian"
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 inline mr-2" />
              Penyesuaian
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Produk</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Perubahan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok Sebelum</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok Sesudah</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(adj.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {adj.products?.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${getTypeColor(adj.type) === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        ${getTypeColor(adj.type) === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                        ${getTypeColor(adj.type) === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                        ${getTypeColor(adj.type) === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                      `}>
                        {getTypeLabel(adj.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${adj.quantity >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {adj.quantity >= 0 ? '+' : ''}{adj.quantity} {adj.products?.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {adj.stock_before}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {adj.stock_after}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {adj.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal Penyesuaian */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Penyesuaian Stok"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Produk</label>
              <select
                required
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
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
              <label>Jenis Penyesuaian</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {adjustmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Jumlah</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder={formData.type === 'adjustment' ? 'Positif untuk tambah, negatif untuk kurang' : 'Jumlah yang berkurang'}
              />
              {formData.type !== 'adjustment' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Stok akan berkurang
                </p>
              )}
            </div>

            <div>
              <label>Alasan</label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Contoh: Audit fisik, Kemasan rusak, dll"
              />
            </div>

            <div>
              <label>Catatan Tambahan</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                placeholder="Detail tambahan (opsional)"
              />
            </div>

            {formData.product_id && formData.quantity && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Preview Perubahan</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {products.find(p => p.id === formData.product_id)?.stock || 0}
                  {' → '}
                  {(products.find(p => p.id === formData.product_id)?.stock || 0) + 
                    (formData.type !== 'adjustment' || parseInt(formData.quantity) < 0 
                      ? -Math.abs(parseInt(formData.quantity)) 
                      : parseInt(formData.quantity))}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
