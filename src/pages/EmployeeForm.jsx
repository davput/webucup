import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, User, Phone, Briefcase, DollarSign } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { formatCurrency } from '../lib/utils'

export default function EmployeeForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'loader',
    wage_per_sack: '',
    wage_per_delivery: ''
  })
  const [displayWages, setDisplayWages] = useState({
    wage_per_sack: '',
    wage_per_delivery: ''
  })

  useEffect(() => {
    if (id) {
      loadEmployee()
    }
  }, [id])

  const loadEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setFormData(data)
      setDisplayWages({
        wage_per_sack: data.wage_per_sack ? formatNumber(data.wage_per_sack) : '',
        wage_per_delivery: data.wage_per_delivery ? formatNumber(data.wage_per_delivery) : ''
      })
    } catch (error) {
      showToast('Gagal memuat data pegawai', 'error')
      navigate('/employees')
    }
  }

  const formatNumber = (num) => {
    if (!num) return ''
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const parseNumber = (str) => {
    if (!str) return ''
    return str.replace(/\./g, '')
  }

  const handleWageChange = (field, value) => {
    const numericValue = parseNumber(value)
    if (numericValue === '' || /^\d+$/.test(numericValue)) {
      setFormData(prev => ({ ...prev, [field]: numericValue }))
      setDisplayWages(prev => ({ ...prev, [field]: formatNumber(numericValue) }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data - convert empty strings to proper values
      const dataToSave = {
        name: formData.name,
        phone: formData.phone || '-', // Phone is required in DB, use '-' if empty
        role: formData.role,
        wage_per_sack: formData.wage_per_sack ? parseInt(formData.wage_per_sack) : 0,
        wage_per_delivery: formData.wage_per_delivery ? parseInt(formData.wage_per_delivery) : 0
      }

      if (id) {
        const { error } = await supabase
          .from('employees')
          .update(dataToSave)
          .eq('id', id)

        if (error) throw error
        showToast('Pegawai berhasil diupdate', 'success')
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([dataToSave])

        if (error) throw error
        showToast('Pegawai berhasil ditambahkan', 'success')
      }

      navigate('/employees')
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/employees')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {id ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {id ? 'Perbarui informasi pegawai' : 'Masukkan data pegawai baru'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            {/* Informasi Dasar */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informasi Dasar
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Contoh: Pak Joko"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Phone className="w-4 h-4 mr-1.5" />
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="08123456789 (opsional)"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Format: 08xxxxxxxxxx (opsional)
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Posisi & Role */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Posisi & Jabatan
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Posisi <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="loader">Bongkar Muat (Loader)</option>
                  <option value="driver">Driver (Sopir)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Pilih posisi sesuai tugas pegawai
                </p>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Upah */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Informasi Upah
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upah per Karung <span className="text-gray-500 dark:text-gray-400 font-normal">(Rp)</span>
                  </label>
                  <input
                    type="text"
                    value={displayWages.wage_per_sack}
                    onChange={(e) => handleWageChange('wage_per_sack', e.target.value)}
                    placeholder="2.000"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Untuk pegawai bongkar muat
                  </p>
                  {formData.wage_per_sack && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {formatCurrency(formData.wage_per_sack)} per karung
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upah per Pengiriman <span className="text-gray-500 dark:text-gray-400 font-normal">(Rp)</span>
                  </label>
                  <input
                    type="text"
                    value={displayWages.wage_per_delivery}
                    onChange={(e) => handleWageChange('wage_per_delivery', e.target.value)}
                    placeholder="100.000"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Untuk driver/sopir
                  </p>
                  {formData.wage_per_delivery && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {formatCurrency(formData.wage_per_delivery)} per pengiriman
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Tips:</strong> Anda bisa mengisi kedua jenis upah jika pegawai memiliki tugas ganda
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/employees')}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : id ? 'Update Pegawai' : 'Simpan Pegawai'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
