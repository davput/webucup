import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Store } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'
import { ActivityLogger } from '../lib/activityLogger'

export default function StoreForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const { toast, showSuccess, showError, hideToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [districts, setDistricts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredDistricts, setFilteredDistricts] = useState([])
  const [selectedDistrictIndex, setSelectedDistrictIndex] = useState(-1)
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    phone: '',
    address: '',
    region: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadDistricts()
    if (isEdit) {
      loadStore()
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [id])

  const loadDistricts = async () => {
    try {
      const { data } = await supabase
        .from('districts')
        .select('*')
        .order('name')
      setDistricts(data || [])
      setFilteredDistricts(data || [])
    } catch (error) {
      console.error('Error loading districts:', error)
    }
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setShowDropdown(true)
    setSelectedDistrictIndex(-1)
    
    if (value.trim() === '') {
      setFilteredDistricts(districts)
    } else {
      const filtered = districts.filter(district =>
        district.name.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredDistricts(filtered)
    }
  }

  const handleSelectDistrict = (district) => {
    setFormData({ ...formData, region: district.name })
    setSearchTerm(district.name)
    setShowDropdown(false)
    setSelectedDistrictIndex(-1)
  }

  const loadStore = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      showError('Gagal memuat data toko')
      navigate('/stores')
      return
    }

    setFormData(data)
    setSearchTerm(data.region || '')
    setLoading(false)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama toko wajib diisi'
    }

    if (!formData.owner.trim()) {
      newErrors.owner = 'Nama pemilik wajib diisi'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat wajib diisi'
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Wilayah wajib diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      showError('Mohon lengkapi semua field yang wajib diisi')
      return
    }

    setLoading(true)

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('stores')
          .update(formData)
          .eq('id', id)

        if (error) throw error

        // Log activity
        await ActivityLogger.updateStore(formData.name)

        showSuccess('Toko berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([formData])

        if (error) throw error

        // Log activity
        await ActivityLogger.createStore(formData.name)

        showSuccess('Toko berhasil ditambahkan!')
      }

      setTimeout(() => {
        navigate('/stores')
      }, 1000)
    } catch (error) {
      showError(error.message)
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
        </div>
      </div>
    )
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
          <button
            onClick={() => navigate('/stores')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Daftar Toko
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Toko' : 'Tambah Toko Baru'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isEdit ? 'Update informasi toko dan data pemilik' : 'Lengkapi form untuk menambahkan toko baru ke sistem'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card title="Informasi Toko">
                <div className="space-y-4">
                  <div>
                    <label>Nama Toko *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Toko Tani Makmur"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label>Nama Pemilik *</label>
                      <input
                        type="text"
                        required
                        value={formData.owner}
                        onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                        placeholder="Nama lengkap pemilik"
                        className={errors.owner ? 'border-red-500' : ''}
                      />
                      {errors.owner && <p className="text-red-500 text-sm mt-1">{errors.owner}</p>}
                    </div>

                    <div>
                      <label>Nomor Telepon *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Lokasi">
                <div className="space-y-4">
                  <div>
                    <label>Alamat Lengkap *</label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows="4"
                      placeholder="Jalan, RT/RW, Desa/Kelurahan"
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div className="relative">
                    <label>Kecamatan *</label>
                    <input
                      type="text"
                      required
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      onKeyDown={(e) => {
                        if (!showDropdown) return
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setSelectedDistrictIndex(prev => 
                            prev < filteredDistricts.length - 1 ? prev + 1 : prev
                          )
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setSelectedDistrictIndex(prev => prev > 0 ? prev - 1 : -1)
                        } else if (e.key === 'Enter' && selectedDistrictIndex >= 0) {
                          e.preventDefault()
                          const district = filteredDistricts[selectedDistrictIndex]
                          handleSelectDistrict(district)
                        } else if (e.key === 'Escape') {
                          setShowDropdown(false)
                          setSelectedDistrictIndex(-1)
                        }
                      }}
                      placeholder="Ketik untuk mencari kecamatan..."
                      className={errors.region ? 'border-red-500' : ''}
                    />
                    
                    {/* Dropdown Results */}
                    {showDropdown && filteredDistricts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredDistricts.map((district, index) => (
                          <button
                            key={district.id}
                            type="button"
                            onClick={() => handleSelectDistrict(district)}
                            className={`w-full text-left px-4 py-2 text-gray-900 dark:text-gray-100 transition-colors ${
                              index === selectedDistrictIndex
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {district.name}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* No Results */}
                    {showDropdown && searchTerm && filteredDistricts.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Kecamatan tidak ditemukan. 
                          <button
                            type="button"
                            onClick={() => navigate('/settings')}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 ml-1"
                          >
                            Tambah di Pengaturan
                          </button>
                        </p>
                      </div>
                    )}
                    
                    {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Kecamatan digunakan untuk pengelompokan dan optimasi rute pengiriman
                    </p>
                  </div>
                </div>
              </Card>

              <Card title="Catatan Tambahan">
                <div>
                  <label>Catatan (Opsional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="4"
                    placeholder="Catatan khusus tentang toko, preferensi pengiriman, dll"
                  />
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card title="Informasi">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Store className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Data toko akan digunakan untuk:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                        <li>Pembuatan order</li>
                        <li>Penjadwalan pengiriman</li>
                        <li>Manajemen piutang</li>
                        <li>Laporan penjualan</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="sticky top-6">
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    {loading ? 'Menyimpan...' : isEdit ? 'Update Toko' : 'Simpan Toko'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/stores')}
                    className="w-full"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
