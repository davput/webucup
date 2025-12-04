import { useState, useEffect } from 'react'
import { Save, DollarSign, Package, Hash, Bell } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import CurrencyInput from '../components/CurrencyInput'
import Toast from '../components/Toast'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

export default function SystemSettings() {
  const { toasts, showToast, removeToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('pricing')
  
  const [settings, setSettings] = useState({
    // Pricing
    default_margin: 20,
    wholesale_min_quantity: 10,
    wholesale_discount: 10,
    
    // Stock
    minimum_stock_global: 5,
    low_stock_threshold: 10,
    enable_low_stock_notification: true,
    enable_stock_movement_notification: true,
    
    // Numbering
    order_number_format: 'ORD-{YYYY}{MM}{DD}-{####}',
    delivery_number_format: 'DEL-{YYYY}{MM}{DD}-{####}',
    payment_number_format: 'PAY-{YYYY}{MM}{DD}-{####}',
    invoice_number_format: 'INV-{YYYY}{MM}{DD}-{####}',
    
    // Notification
    enable_email_notification: false,
    enable_whatsapp_notification: false
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
      
      if (error) throw error

      // Convert array to object
      const settingsObj = {}
      data.forEach(item => {
        let value = item.setting_value
        if (item.setting_type === 'number') {
          value = parseFloat(value)
        } else if (item.setting_type === 'boolean') {
          value = value === 'true'
        }
        settingsObj[item.setting_key] = value
      })

      setSettings(prev => ({ ...prev, ...settingsObj }))
    } catch (error) {
      console.error('Error loading settings:', error)
      showToast('Gagal memuat pengaturan', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)

      // Convert settings object to array for upsert
      const updates = Object.entries(settings).map(([key, value]) => {
        let setting_type = 'string'
        let setting_value = String(value)
        
        if (typeof value === 'number') {
          setting_type = 'number'
        } else if (typeof value === 'boolean') {
          setting_type = 'boolean'
          setting_value = value ? 'true' : 'false'
        }

        return {
          setting_key: key,
          setting_value,
          setting_type
        }
      })

      // Upsert all settings
      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .upsert(update, { onConflict: 'setting_key' })
        
        if (error) throw error
      }

      showToast('Pengaturan berhasil disimpan', 'success')
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Gagal menyimpan pengaturan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'pricing', label: 'Harga', icon: DollarSign },
    { id: 'stock', label: 'Stok', icon: Package },
    { id: 'numbering', label: 'Penomoran', icon: Hash },
    { id: 'notification', label: 'Notifikasi', icon: Bell }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Memuat pengaturan...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Pengaturan Sistem
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Konfigurasi sistem dan preferensi aplikasi
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Pricing Settings */}
        {activeTab === 'pricing' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pengaturan Harga
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Margin Default (%)
                </label>
                <input
                  type="number"
                  value={settings.default_margin}
                  onChange={(e) => setSettings({ ...settings, default_margin: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Margin keuntungan default untuk produk baru
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kuantitas Minimum Grosir
                </label>
                <input
                  type="number"
                  value={settings.wholesale_min_quantity}
                  onChange={(e) => setSettings({ ...settings, wholesale_min_quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Jumlah minimum untuk mendapat harga grosir
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Diskon Grosir (%)
                </label>
                <input
                  type="number"
                  value={settings.wholesale_discount}
                  onChange={(e) => setSettings({ ...settings, wholesale_discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Persentase diskon untuk pembelian grosir
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stock Settings */}
        {activeTab === 'stock' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pengaturan Stok
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Stok Global
                </label>
                <input
                  type="number"
                  value={settings.minimum_stock_global}
                  onChange={(e) => setSettings({ ...settings, minimum_stock_global: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Batas minimum stok untuk semua produk
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Threshold Stok Menipis
                </label>
                <input
                  type="number"
                  value={settings.low_stock_threshold}
                  onChange={(e) => setSettings({ ...settings, low_stock_threshold: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Jumlah stok untuk memicu notifikasi stok menipis
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Notifikasi Stok Menipis
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tampilkan alert saat stok produk menipis
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_low_stock_notification}
                    onChange={(e) => setSettings({ ...settings, enable_low_stock_notification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Notifikasi Pergerakan Stok
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tampilkan notifikasi saat stok masuk/keluar
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_stock_movement_notification}
                    onChange={(e) => setSettings({ ...settings, enable_stock_movement_notification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </Card>
        )}

        {/* Numbering Settings */}
        {activeTab === 'numbering' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Format Penomoran Otomatis
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Format yang tersedia:</strong><br />
                  {'{YYYY}'} = Tahun 4 digit (2024)<br />
                  {'{YY}'} = Tahun 2 digit (24)<br />
                  {'{MM}'} = Bulan 2 digit (01-12)<br />
                  {'{DD}'} = Tanggal 2 digit (01-31)<br />
                  {'{####}'} = Nomor urut 4 digit (0001, 0002, dst)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format Nomor Order
                </label>
                <input
                  type="text"
                  value={settings.order_number_format}
                  onChange={(e) => setSettings({ ...settings, order_number_format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
                  placeholder="ORD-{YYYY}{MM}{DD}-{####}"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Contoh: ORD-20241203-0001
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format Nomor Pengiriman
                </label>
                <input
                  type="text"
                  value={settings.delivery_number_format}
                  onChange={(e) => setSettings({ ...settings, delivery_number_format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
                  placeholder="DEL-{YYYY}{MM}{DD}-{####}"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Contoh: DEL-20241203-0001
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format Nomor Pembayaran
                </label>
                <input
                  type="text"
                  value={settings.payment_number_format}
                  onChange={(e) => setSettings({ ...settings, payment_number_format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
                  placeholder="PAY-{YYYY}{MM}{DD}-{####}"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Contoh: PAY-20241203-0001
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format Nomor Invoice
                </label>
                <input
                  type="text"
                  value={settings.invoice_number_format}
                  onChange={(e) => setSettings({ ...settings, invoice_number_format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 font-mono"
                  placeholder="INV-{YYYY}{MM}{DD}-{####}"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Contoh: INV-20241203-0001
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Notification Settings */}
        {activeTab === 'notification' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pengaturan Notifikasi
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Notifikasi Email
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kirim notifikasi melalui email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_email_notification}
                    onChange={(e) => setSettings({ ...settings, enable_email_notification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Notifikasi WhatsApp
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kirim notifikasi melalui WhatsApp
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_whatsapp_notification}
                    onChange={(e) => setSettings({ ...settings, enable_whatsapp_notification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Catatan:</strong> Fitur notifikasi email dan WhatsApp memerlukan konfigurasi tambahan di server.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}
