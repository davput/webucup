import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

export default function ProductMaster() {
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [activeTab, setActiveTab] = useState('types')
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Load types
    const { data: typesData } = await supabase
      .from('product_types')
      .select('*')
      .order('name')
    setTypes(typesData || [])

    // Load categories
    const { data: categoriesData } = await supabase
      .from('product_categories')
      .select('*')
      .order('name')
    setCategories(categoriesData || [])

    // Load units
    const { data: unitsData } = await supabase
      .from('product_units')
      .select('*')
      .order('name')
    setUnits(unitsData || [])
  }

  const getCurrentTable = () => {
    switch (activeTab) {
      case 'types': return 'product_types'
      case 'categories': return 'product_categories'
      case 'units': return 'product_units'
      default: return 'product_types'
    }
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'types': return types
      case 'categories': return categories
      case 'units': return units
      default: return []
    }
  }

  const getTabLabel = () => {
    switch (activeTab) {
      case 'types': return 'Jenis Pupuk'
      case 'categories': return 'Kategori'
      case 'units': return 'Satuan Kemasan'
      default: return ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const table = getCurrentTable()

    if (editingItem) {
      const { error } = await supabase
        .from(table)
        .update(formData)
        .eq('id', editingItem.id)

      if (error) {
        showError('Gagal mengupdate: ' + error.message)
        return
      }
      showSuccess('Data berhasil diupdate!')
    } else {
      const { error } = await supabase
        .from(table)
        .insert([formData])

      if (error) {
        showError('Gagal menambah: ' + error.message)
        return
      }
      showSuccess('Data berhasil ditambahkan!')
    }

    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({ name: '', description: '' })
    loadData()
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({ name: item.name, description: item.description || '' })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return

    const table = getCurrentTable()
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) {
      showError('Gagal menghapus: ' + error.message)
      return
    }

    showSuccess('Data berhasil dihapus!')
    loadData()
  }

  const openAddModal = () => {
    setEditingItem(null)
    setFormData({ name: '', description: '' })
    setIsModalOpen(true)
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Master Data Produk</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Kelola jenis pupuk, kategori, dan satuan kemasan</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('types')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'types'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Jenis Pupuk
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'categories'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Kategori
              </button>
              <button
                onClick={() => setActiveTab('units')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'units'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Satuan Kemasan
              </button>
            </nav>
          </div>
        </div>

        <Card
          title={getTabLabel()}
          action={
            <Button onClick={openAddModal}>
              <Plus className="w-5 h-5 inline mr-2" />
              Tambah
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Deskripsi</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {getCurrentData().length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada data</p>
                    </td>
                  </tr>
                ) : (
                  getCurrentData().map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.description || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Hapus"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingItem(null)
          }}
          title={`${editingItem ? 'Edit' : 'Tambah'} ${getTabLabel()}`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Nama</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={
                  activeTab === 'types' ? 'Contoh: Urea, NPK, ZA' :
                  activeTab === 'categories' ? 'Contoh: Nitrogen, Fosfat, Kalium' :
                  'Contoh: Karung, Sak, Ton'
                }
              />
            </div>

            <div>
              <label>Deskripsi (Opsional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                placeholder="Keterangan tambahan"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingItem(null)
                }}
              >
                Batal
              </Button>
              <Button type="submit">{editingItem ? 'Update' : 'Simpan'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
