import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Users, Truck, Package, Search, Filter } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { useToast } from '../hooks/useToast'

export default function Employees() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const { showToast } = useToast()
  const [stats, setStats] = useState({
    total: 0,
    drivers: 0,
    loaders: 0
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchTerm, roleFilter])

  const loadEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
    setEmployees(data || [])
    
    // Calculate stats
    const total = data?.length || 0
    const drivers = data?.filter(e => e.role === 'driver').length || 0
    const loaders = data?.filter(e => e.role === 'loader').length || 0
    setStats({ total, drivers, loaders })
  }

  const filterEmployees = () => {
    let filtered = [...employees]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone.includes(searchTerm)
      )
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(emp => emp.role === roleFilter)
    }

    setFilteredEmployees(filtered)
  }

  const handleEdit = (id) => {
    navigate(`/employees/edit/${id}`)
  }

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus pegawai ini?')) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id)
        if (error) throw error
        showToast('Pegawai berhasil dihapus', 'success')
        loadEmployees()
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
  }

  const handleAdd = () => {
    navigate('/employees/new')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Pegawai</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola data driver dan pegawai bongkar muat beserta upahnya</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Pegawai</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Driver</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.drivers}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Truck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Bongkar Muat</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.loaders}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Cari Pegawai
            </label>
            <input
              type="text"
              placeholder="Nama atau telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filter Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Role</option>
              <option value="driver">Driver</option>
              <option value="loader">Bongkar Muat</option>
            </select>
          </div>

          <Button onClick={handleAdd}>
            <Plus className="w-5 h-5 inline mr-2" />
            Tambah Pegawai
          </Button>
        </div>

        {(searchTerm || roleFilter) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {filteredEmployees.length} dari {stats.total} pegawai
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card title="Daftar Pegawai">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Telepon</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Posisi</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Upah/Karung</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Upah/Pengiriman</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      {searchTerm || roleFilter ? 'Tidak ada pegawai yang sesuai filter' : 'Belum ada pegawai'}
                    </p>
                    {!searchTerm && !roleFilter && (
                      <Button onClick={handleAdd} className="mt-4">
                        <Plus className="w-4 h-4 inline mr-2" />
                        Tambah Pegawai Pertama
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium">{employee.name}</td>
                  <td className="px-4 py-3">{employee.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      employee.role === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {employee.role === 'driver' ? 'Driver' : 'Bongkar Muat'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(employee.wage_per_sack || 0)}</td>
                  <td className="px-4 py-3">{formatCurrency(employee.wage_per_delivery || 0)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(employee.id)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(employee.id)} className="text-red-600 hover:text-red-800 dark:text-red-400">
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
    </div>
  )
}
