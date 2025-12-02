import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'

export default function Stores() {
  const navigate = useNavigate()
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [stores, setStores] = useState([])
  const [filteredStores, setFilteredStores] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')
  const [filterDebt, setFilterDebt] = useState('all')

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    filterStores()
  }, [stores, searchTerm, filterRegion, filterDebt])

  const loadStores = async () => {
    const { data } = await supabase.from('stores').select('*').order('created_at', { ascending: false })
    setStores(data || [])
    setFilteredStores(data || [])
  }

  const filterStores = () => {
    let filtered = [...stores]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        s.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Region filter
    if (filterRegion !== 'all') {
      filtered = filtered.filter(s => s.region === filterRegion)
    }

    // Debt filter
    if (filterDebt === 'with-debt') {
      filtered = filtered.filter(s => s.debt > 0)
    } else if (filterDebt === 'no-debt') {
      filtered = filtered.filter(s => s.debt === 0 || !s.debt)
    }

    setFilteredStores(filtered)
  }

  const regions = [...new Set(stores.map(s => s.region))].sort()

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus toko ini?')) return

    const { error } = await supabase.from('stores').delete().eq('id', id)
    if (error) {
      showError('Gagal menghapus toko: ' + error.message)
      return
    }
    showSuccess('Toko berhasil dihapus!')
    loadStores()
  }

  const totalDebt = stores.reduce((sum, store) => sum + (store.debt || 0), 0)
  const storesWithDebt = stores.filter(s => s.debt > 0).length

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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Manajemen Toko</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Kelola data toko, piutang, dan riwayat pembelian</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Toko</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stores.length}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Toko Berhutang</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{storesWithDebt}</p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Piutang</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalDebt)}</p>
          </div>
        </div>

        {/* Alert for stores with debt */}
        {storesWithDebt > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Perhatian Piutang!
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {storesWithDebt} toko memiliki piutang dengan total {formatCurrency(totalDebt)}
                </p>
              </div>
            </div>
          </div>
        )}

      <Card
        title="Daftar Toko"
        action={
          <Button onClick={() => navigate('/stores/new')}>
            <Plus className="w-5 h-5 inline mr-2" />
            Tambah Toko
          </Button>
        }
      >
        {/* Filter & Search */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Cari toko, pemilik, telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full"
            >
              <option value="all">Semua Wilayah</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterDebt}
              onChange={(e) => setFilterDebt(e.target.value)}
              className="w-full"
            >
              <option value="all">Semua Status</option>
              <option value="with-debt">Ada Piutang</option>
              <option value="no-debt">Lunas</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Menampilkan {filteredStores.length} dari {stores.length} toko
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Toko</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Pemilik</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Telepon</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Wilayah</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Piutang</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStores.map((store) => (
                <tr 
                  key={store.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    store.debt > 0 ? 'bg-red-50 dark:bg-red-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {store.debt > 0 && (
                        <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{store.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{store.owner}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{store.phone}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{store.region}</td>
                  <td className="px-4 py-3">
                    <span className={store.debt > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                      {formatCurrency(store.debt || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/stores/${store.id}`)} 
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => navigate(`/stores/edit/${store.id}`)} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(store.id)} 
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
    </div>
    </>
  )
}
