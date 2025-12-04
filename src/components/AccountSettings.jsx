import { useState, useEffect } from 'react'
import { User, Building2, Save, Upload, X, Mail, Phone, MapPin } from 'lucide-react'
import Button from './Button'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function AccountSettings() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [formData, setFormData] = useState({
    // Personal Info
    ownerName: '',
    email: '',
    phone: '',
    
    // Business Info
    businessName: 'Toko Pupuk',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    logoUrl: ''
  })

  useEffect(() => {
    loadAccountData()
  }, [])

  async function loadAccountData() {
    try {
      // Load from database
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'owner_name', 'owner_email', 'owner_phone',
          'business_name', 'business_address', 'business_phone',
          'business_email', 'business_tax_id', 'business_description'
        ])

      if (data && data.length > 0) {
        const settings = {}
        data.forEach(item => {
          const key = item.setting_key
          const value = item.setting_value || ''
          
          // Map database keys to form data keys
          if (key === 'owner_name') settings.ownerName = value
          else if (key === 'owner_email') settings.ownerEmail = value
          else if (key === 'owner_phone') settings.ownerPhone = value
          else if (key === 'business_name') settings.businessName = value
          else if (key === 'business_address') settings.businessAddress = value
          else if (key === 'business_phone') settings.businessPhone = value
          else if (key === 'business_email') settings.businessEmail = value
          else if (key === 'business_tax_id') settings.businessTaxId = value
          else if (key === 'business_description') settings.businessDescription = value
        })
        
        setFormData(prev => ({ ...prev, ...settings }))
      }

      // Also check localStorage for logo (not stored in DB yet)
      const savedData = localStorage.getItem('account_settings')
      if (savedData) {
        const data = JSON.parse(savedData)
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl)
          setFormData(prev => ({ ...prev, logoUrl: data.logoUrl }))
        }
      }
    } catch (error) {
      console.error('Error loading account data:', error)
      // Fallback to localStorage
      const savedData = localStorage.getItem('account_settings')
      if (savedData) {
        const data = JSON.parse(savedData)
        setFormData(data)
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl)
        }
      }
    }
  }

  async function handleSave() {
    setLoading(true)
    
    try {
      // Save to database
      const settingsToSave = [
        { key: 'owner_name', value: formData.ownerName },
        { key: 'owner_email', value: formData.ownerEmail },
        { key: 'owner_phone', value: formData.ownerPhone },
        { key: 'business_name', value: formData.businessName },
        { key: 'business_address', value: formData.businessAddress },
        { key: 'business_phone', value: formData.businessPhone },
        { key: 'business_email', value: formData.businessEmail },
        { key: 'business_tax_id', value: formData.businessTaxId },
        { key: 'business_description', value: formData.businessDescription }
      ]

      for (const setting of settingsToSave) {
        await supabase
          .from('system_settings')
          .upsert({
            setting_key: setting.key,
            setting_value: setting.value,
            setting_type: 'string'
          }, { onConflict: 'setting_key' })
      }

      // Also save to localStorage as backup
      localStorage.setItem('account_settings', JSON.stringify(formData))
      
      // Trigger event to update business name in Layout
      window.dispatchEvent(new Event('businessNameUpdated'))
      
      showToast('Pengaturan akun berhasil disimpan', 'success')
    } catch (error) {
      console.error('Error saving account settings:', error)
      showToast('Gagal menyimpan pengaturan', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file maksimal 2MB', 'error')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
        setFormData({ ...formData, logoUrl: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  function removeLogo() {
    setLogoPreview(null)
    setFormData({ ...formData, logoUrl: '' })
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Informasi Pribadi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Data pemilik/pengelola toko</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="Nama pemilik toko"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="w-4 h-4 text-gray-400" />
                Nomor Telepon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xx-xxxx-xxxx"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Informasi Bisnis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Data toko/usaha Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo Toko
            </label>
            <div className="flex items-start gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              )}

              <div className="flex-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Logo</span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  JPG, PNG. Maksimal 2MB
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Toko/Usaha
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Nama toko Anda"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Alamat Toko
            </label>
            <textarea
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              placeholder="Alamat lengkap toko"
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="w-4 h-4 text-gray-400" />
                Telepon Toko
              </label>
              <input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                placeholder="Nomor telepon toko"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 text-gray-400" />
                Email Toko
              </label>
              <input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                placeholder="Email toko"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="min-w-[200px]">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </div>
  )
}
