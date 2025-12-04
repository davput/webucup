import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, AlertTriangle, Eye } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { useToast } from '../context/ToastContext'

export default function Products() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    price: '',
    unit: '',
    stock: '',
    min_stock: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, filterType, filterStatus])

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setFilteredProducts(data || [])
  }

  const filterProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType)
    }

    // Status filter
    if (filterStatus === 'low') {
      filtered = filtered.filter(p => p.stock <= p.min_stock)
    } else if (filterStatus === 'active') {
      filtered = filtered.filter(p => p.is_active)
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(p => !p.is_active)
    }

    setFilteredProducts(filtered)
  }

  const productTypes = [...new Set(products.map(p => p.type))].sort()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingProduct) {
      await supabase.from('products').update(formData).eq('id', editingProduct.id)
    } else {
      await supabase.from('products').insert([formData])
    }

    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({ name: '', type: '', price: '', unit: '', stock: '', min_stock: '' })
    loadProducts()
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData(product)
    setIsModalOpen(true)
  }

  const confirmDelete = (product) => {
    setProductToDelete(product)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!productToDelete || deleteLoading) return

    try {
      setDeleteLoading(true)

      // Check if product is used in orders
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productToDelete.id)
        .limit(1)

      if (orderItems && orderItems.length > 0) {
        showToast('Produk tidak dapat dihapus karena sudah digunakan dalam order', 'error')
        setShowDeleteConfirm(false)
        setProductToDelete(null)
        return
      }

      // Delete product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id)

      if (error) throw error

      // Log activity
      try {
        await supabase.from('activity_logs').insert({
          user_name: 'Admin',
          action: 'delete',
          entity_type: 'product',
          entity_name: productToDelete.name,
          description: `Menghapus produk "${productToDelete.name}"`,
          created_at: new Date().toISOString()
        })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
      }

      showToast(`Produk "${productToDelete.name}" berhasil dihapus`, 'success')
      setShowDeleteConfirm(false)
      setProductToDelete(null)
      loadProducts()
    } catch (error) {
      showToast(error.message || 'Gagal menghapus produk', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({ name: '', type: '', price: '', unit: '', stock: '', min_stock: '' })
    setIsModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Manajemen Produk</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Kelola produk pupuk, stok, dan harga</p>
      </div>

      {/* Alert Stok Minimum */}
      {products.filter(p => p.stock <= p.min_stock).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">
                Peringatan Stok Minimum!
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {products.filter(p => p.stock <= p.min_stock).length} produk memiliki stok di bawah atau sama dengan minimum stok.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card
        title="Daftar Produk"
        action={
          <Button onClick={() => navigate('/products/new')} className="w-full sm:w-auto">
            <Plus className="w-5 h-5 inline mr-2" />
            <span className="hidden sm:inline">Tambah Produk</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        }
      >
        {/* Filter & Search */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full"
            >
              <option value="all">Semua Jenis</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full"
            >
              <option value="all">Semua Status</option>
              <option value="low">Stok Rendah</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Harga</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Satuan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Stok</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    product.stock <= product.min_stock 
                      ? 'bg-red-50 dark:bg-red-900/10' 
                      : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.stock <= product.min_stock && (
                        <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                      )}
                      <span className={product.stock <= product.min_stock ? 'font-semibold text-red-900 dark:text-red-200' : ''}>
                        {product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{product.type}</td>
                  <td className="px-4 py-3">{formatCurrency(product.selling_price)}</td>
                  <td className="px-4 py-3">{product.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={product.stock <= product.min_stock ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                        {product.stock}
                      </span>
                      {product.stock <= product.min_stock && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          (Min: {product.min_stock})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/products/${product.id}`)} 
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => navigate(`/products/edit/${product.id}`)} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => confirmDelete(product)} 
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
            <input
              type="text"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok Minimum</label>
              <input
                type="number"
                required
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">
              {editingProduct ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => !deleteLoading && setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${productToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  )
}
