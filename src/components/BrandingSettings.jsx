import { useState, useEffect } from 'react'
import { Palette, Upload, X, RefreshCw, Save, Image as ImageIcon, Loader2 } from 'lucide-react'
import Button from './Button'
import Card from './Card'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function BrandingSettings() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [formData, setFormData] = useState({
    appLogo: '',
    primaryColor: '#10b981', // green-500
    accentColor: '#3b82f6', // blue-500
    sidebarColor: '#ffffff',
    headerColor: '#ffffff',
    appName: 'Pupuk App',
    appTagline: 'Distribusi'
  })

  const colorPresets = [
    { name: 'Green', primary: '#10b981', accent: '#3b82f6' },
    { name: 'Blue', primary: '#3b82f6', accent: '#8b5cf6' },
    { name: 'Purple', primary: '#8b5cf6', accent: '#ec4899' },
    { name: 'Red', primary: '#ef4444', accent: '#f59e0b' },
    { name: 'Orange', primary: '#f97316', accent: '#eab308' },
    { name: 'Teal', primary: '#14b8a6', accent: '#06b6d4' },
  ]

  useEffect(() => {
    loadBrandingSettings()
  }, [])

  async function loadBrandingSettings() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'app_logo', 'primary_color', 'accent_color',
          'sidebar_color', 'header_color', 'app_name', 'app_tagline'
        ])

      if (data && data.length > 0) {
        const settings = {}
        data.forEach(item => {
          const key = item.setting_key
          const value = item.setting_value || ''
          
          if (key === 'app_logo') settings.appLogo = value
          else if (key === 'primary_color') settings.primaryColor = value
          else if (key === 'accent_color') settings.accentColor = value
          else if (key === 'sidebar_color') settings.sidebarColor = value
          else if (key === 'header_color') settings.headerColor = value
          else if (key === 'app_name') settings.appName = value
          else if (key === 'app_tagline') settings.appTagline = value
        })
        
        setFormData(prev => ({ ...prev, ...settings }))
        if (settings.appLogo) {
          setLogoPreview(settings.appLogo)
        }
      }
    } catch (error) {
      console.error('Error loading branding settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      
      const settingsToSave = [
        { key: 'app_logo', value: formData.appLogo },
        { key: 'primary_color', value: formData.primaryColor },
        { key: 'accent_color', value: formData.accentColor },
        { key: 'sidebar_color', value: formData.sidebarColor },
        { key: 'header_color', value: formData.headerColor },
        { key: 'app_name', value: formData.appName },
        { key: 'app_tagline', value: formData.appTagline }
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

      // Trigger event to update app name in Layout
      window.dispatchEvent(new Event('businessNameUpdated'))
      
      showToast('Pengaturan branding berhasil disimpan', 'success')
    } catch (error) {
      console.error('Error saving branding settings:', error)
      showToast('Gagal menyimpan pengaturan', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file maksimal 2MB', 'error')
        return
      }

      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar', 'error')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
        setFormData({ ...formData, appLogo: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  function removeLogo() {
    setLogoPreview(null)
    setFormData({ ...formData, appLogo: '' })
  }

  function applyColorPreset(preset) {
    setFormData({
      ...formData,
      primaryColor: preset.primary,
      accentColor: preset.accent
    })
    showToast(`Preset warna ${preset.name} diterapkan`, 'success')
  }

  function resetToDefault() {
    setFormData({
      appLogo: '',
      primaryColor: '#10b981',
      accentColor: '#3b82f6',
      sidebarColor: '#ffffff',
      headerColor: '#ffffff',
      appName: 'Pupuk App',
      appTagline: 'Distribusi'
    })
    setLogoPreview(null)
    showToast('Pengaturan direset ke default', 'info')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* App Identity */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Identitas Aplikasi</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Logo dan nama aplikasi</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Logo Aplikasi
              </label>
              
              {logoPreview ? (
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Logo berhasil diunggah
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">Ganti Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      PNG, JPG, atau SVG (Max. 2MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* App Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Aplikasi
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Pupuk App"
              />
            </div>

            {/* App Tagline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={formData.appTagline}
                onChange={(e) => setFormData({ ...formData, appTagline: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Distribusi"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Color Theme */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Tema Warna</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sesuaikan warna aplikasi</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preset Warna
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: preset.accent }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Warna Utama
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-20 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
                  placeholder="#10b981"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Warna Aksen
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-20 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview:</p>
              <div className="flex gap-3">
                <div
                  className="flex-1 h-20 rounded-lg shadow-sm flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Primary
                </div>
                <div
                  className="flex-1 h-20 rounded-lg shadow-sm flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: formData.accentColor }}
                >
                  Accent
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          onClick={resetToDefault}
          className="flex-1"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset ke Default
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>

      {/* Dashboard Widgets */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Widget Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pilih widget yang ingin ditampilkan</p>
            </div>
          </div>

          <DashboardWidgetCustomizer />
        </div>
      </Card>

      {/* Info */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Palette className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white mb-2">
                Catatan Penting:
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Perubahan warna akan diterapkan setelah refresh halaman</li>
                <li>Logo akan ditampilkan di sidebar dan halaman login</li>
                <li>Gunakan logo dengan background transparan untuk hasil terbaik</li>
                <li>Warna yang dipilih akan mempengaruhi tombol, link, dan elemen UI lainnya</li>
                <li>Widget dashboard dapat diatur sesuai kebutuhan Anda</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Dashboard Widget Customizer Component
function DashboardWidgetCustomizer() {
  const { showToast } = useToast()
  const [widgets, setWidgets] = useState([
    { id: 'stats', name: 'Statistik Utama', enabled: true, icon: '📊' },
    { id: 'sales-chart', name: 'Grafik Penjualan', enabled: true, icon: '📈' },
    { id: 'low-stock', name: 'Stok Menipis', enabled: true, icon: '⚠️' },
    { id: 'top-products', name: 'Produk Terlaris', enabled: true, icon: '🏆' },
    { id: 'recent-orders', name: 'Order Terbaru', enabled: false, icon: '🛒' },
    { id: 'recent-deliveries', name: 'Pengiriman Terbaru', enabled: false, icon: '🚚' }
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadWidgetSettings()
  }, [])

  async function loadWidgetSettings() {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'dashboard_widgets')
        .single()

      if (data?.setting_value) {
        const savedWidgets = JSON.parse(data.setting_value)
        setWidgets(savedWidgets)
      }
    } catch (error) {
      console.error('Error loading widget settings:', error)
    }
  }

  async function saveWidgetSettings() {
    try {
      setSaving(true)
      
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'dashboard_widgets',
          setting_value: JSON.stringify(widgets),
          setting_type: 'string'
        }, { onConflict: 'setting_key' })

      showToast('Pengaturan widget berhasil disimpan', 'success')
      
      // Trigger dashboard refresh
      window.dispatchEvent(new Event('dashboardWidgetsUpdated'))
    } catch (error) {
      console.error('Error saving widget settings:', error)
      showToast('Gagal menyimpan pengaturan widget', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleWidget(id) {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ))
  }

  function moveWidget(id, direction) {
    const index = widgets.findIndex(w => w.id === id)
    if (direction === 'up' && index > 0) {
      const newWidgets = [...widgets]
      ;[newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]]
      setWidgets(newWidgets)
    } else if (direction === 'down' && index < widgets.length - 1) {
      const newWidgets = [...widgets]
      ;[newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]]
      setWidgets(newWidgets)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              widget.enabled
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            <span className="text-2xl">{widget.icon}</span>
            <div className="flex-1">
              <p className={`font-medium ${
                widget.enabled 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {widget.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => moveWidget(widget.id, 'up')}
                disabled={index === 0}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Pindah ke atas"
              >
                ↑
              </button>
              <button
                onClick={() => moveWidget(widget.id, 'down')}
                disabled={index === widgets.length - 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Pindah ke bawah"
              >
                ↓
              </button>
              <button
                onClick={() => toggleWidget(widget.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  widget.enabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              >
                {widget.enabled ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={saveWidgetSettings}
        disabled={saving}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Simpan Pengaturan Widget
          </>
        )}
      </Button>
    </div>
  )
}
