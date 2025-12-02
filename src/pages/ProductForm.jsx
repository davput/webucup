import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Package, Upload, X } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import CurrencyInput from '../components/CurrencyInput'
import { supabase } from '../lib/supabase'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    unit: 'karung',
    weight_per_sack: '',
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    description: '',
    photo_url: '',
    min_stock: '10',
    is_active: true
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadMasterData()
    if (isEdit) {
      loadProduct()
    }
  }, [id])

  const loadMasterData = async () => {
    const { data: typesData } = await supabase.from('product_types').select('*').order('name')
    const { data: categoriesData } = await supabase.from('product_categories').select('*').order('name')
    const { data: unitsData } = await supabase.from('product_units').select('*').order('name')
    
    setTypes(typesData || [])
    setCategories(categoriesData || [])
    setUnits(unitsData || [])
  }

  const loadProduct = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setFormData(data)
      if (data.photo_url) {
        setPhotoPreview(data.photo_url)
      }
    }
    setLoading(false)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama produk wajib diisi'
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Jenis pupuk wajib diisi'
    }

    if (!formData.cost_price || parseFloat(formData.cost_price) <= 0) {
      newErrors.cost_price = 'Harga modal harus lebih dari 0'
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      newErrors.selling_price = 'Harga jual harus lebih dari 0'
    }

    if (parseFloat(formData.selling_price) <= parseFloat(formData.cost_price)) {
      newErrors.selling_price = 'Harga jual harus lebih besar dari harga modal'
    }

    if (formData.wholesale_price && parseFloat(formData.wholesale_price) < parseFloat(formData.cost_price)) {
      newErrors.wholesale_price = 'Harga grosir tidak boleh lebih kecil dari harga modal'
    }

    if (!formData.min_stock || parseInt(formData.min_stock) < 0) {
      newErrors.min_stock = 'Minimal stok harus 0 atau lebih'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const productData = {
        ...formData,
        weight_per_sack: formData.weight_per_sack ? parseFloat(formData.weight_per_sack) : null,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
        min_stock: parseInt(formData.min_stock)
      }

      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)

        if (error) throw error
        alert('Produk berhasil diupdate!')
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ ...productData, stock: 0 }])

        if (error) throw error
        alert('Produk berhasil ditambahkan!')
      }

      navigate('/products')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)

      // TODO: Upload to Supabase Storage
      // For now, just store the preview URL
      setFormData({ ...formData, photo_url: reader.result })
    }
  }

  const removePhoto = () => {
    setPhotoPreview(null)
    setFormData({ ...formData, photo_url: '' })
  }

  const calculateProfit = () => {
    const cost = parseFloat(formData.cost_price) || 0
    const selling = parseFloat(formData.selling_price) || 0
    const profit = selling - cost
    const margin = cost > 0 ? ((profit / cost) * 100).toFixed(2) : 0
    return { profit, margin }
  }

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  const { profit, margin } = calculateProfit()

  return (
    <div>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Kembali ke Daftar Produk</span>
        </button>
        
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isEdit ? 'Update informasi produk, harga, dan pengaturan stok' : 'Lengkapi form untuk menambahkan produk pupuk baru ke sistem'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Dasar */}
            <Card title="Informasi Dasar">
              <div className="space-y-4">
                <div>
                  <label>Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Pupuk Urea 50kg"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Jenis Pupuk *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className={errors.type ? 'border-red-500' : ''}
                    >
                      <option value="">-- Pilih Jenis --</option>
                      {types.map(type => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                  </div>

                  <div>
                    <label>Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Satuan Kemasan *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="">-- Pilih Satuan --</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.name.toLowerCase()}>{unit.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Berat per Karung (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight_per_sack}
                      onChange={(e) => setFormData({ ...formData, weight_per_sack: e.target.value })}
                      placeholder="Contoh: 50"
                    />
                  </div>
                </div>

                <div>
                  <label>Deskripsi</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    placeholder="Deskripsi produk, kegunaan, cara pakai, dll..."
                  />
                </div>
              </div>
            </Card>

            {/* Harga */}
            <Card title="Harga">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CurrencyInput
                      label="Harga Modal *"
                      required
                      value={formData.cost_price}
                      onChange={(value) => setFormData({ ...formData, cost_price: value })}
                      className={errors.cost_price ? 'border-red-500' : ''}
                    />
                    {errors.cost_price && <p className="text-red-500 text-sm mt-1">{errors.cost_price}</p>}
                  </div>

                  <div>
                    <CurrencyInput
                      label="Harga Jual *"
                      required
                      value={formData.selling_price}
                      onChange={(value) => setFormData({ ...formData, selling_price: value })}
                      className={errors.selling_price ? 'border-red-500' : ''}
                    />
                    {errors.selling_price && <p className="text-red-500 text-sm mt-1">{errors.selling_price}</p>}
                  </div>
                </div>

                <div>
                  <CurrencyInput
                    label="Harga Grosir (Opsional)"
                    value={formData.wholesale_price}
                    onChange={(value) => setFormData({ ...formData, wholesale_price: value })}
                    className={errors.wholesale_price ? 'border-red-500' : ''}
                  />
                  {errors.wholesale_price && <p className="text-red-500 text-sm mt-1">{errors.wholesale_price}</p>}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Harga khusus untuk pembelian dalam jumlah besar
                  </p>
                </div>

                {/* Profit Calculator */}
                {formData.cost_price && formData.selling_price && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Profit per Unit</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          Rp {profit.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Margin</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {margin}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Stok */}
            <Card title="Pengaturan Stok">
              <div className="space-y-4">
                <div>
                  <label>Minimal Stok *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className={errors.min_stock ? 'border-red-500' : ''}
                  />
                  {errors.min_stock && <p className="text-red-500 text-sm mt-1">{errors.min_stock}</p>}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Notifikasi akan muncul jika stok mencapai atau di bawah angka ini
                  </p>
                </div>

                {isEdit && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stok Saat Ini</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formData.stock || 0} {formData.unit}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Untuk menambah stok, gunakan menu <strong>Stok Masuk</strong>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Foto Produk */}
            <Card title="Foto Produk">
              <div className="space-y-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada foto</p>
                  </div>
                )}

                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Foto</span>
                  </div>
                </label>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Format: JPG, PNG. Maksimal 2MB
                </p>
              </div>
            </Card>

            {/* Status */}
            <Card title="Status Produk">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Produk Aktif</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Produk akan muncul di daftar order
                    </p>
                  </div>
                </label>

                {!formData.is_active && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      Produk nonaktif tidak akan muncul di daftar order
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <Card>
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Menyimpan...' : isEdit ? 'Update Produk' : 'Simpan Produk'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/products')}
                  className="w-full"
                >
                  Batal
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
