import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Settings as SettingsIcon, Database, DollarSign, Package, Hash, 
  User, Lock, Activity, Palette, Save, Plus, Edit, Trash2, MapPin,
  AlertCircle, CheckCircle2, Loader2, Clock, FileText,
  ShoppingCart, Store, Truck, CreditCard, Eye, Download
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import PinSetup from '../components/PinSetup'
import AccountSettings from '../components/AccountSettings'
import SecuritySettings from '../components/SecuritySettings'
import BrandingSettings from '../components/BrandingSettings'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { safeFormatDate } from '../lib/dateUtils'

export default function SettingsNew() {
  const [searchParams] = useSearchParams()
  const { toasts, showToast, removeToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState(searchParams.get('tab') || 'master-data')
  const [activeSubSection, setActiveSubSection] = useState('product-types')
  
  // Master Data States
  const [productTypes, setProductTypes] = useState([])
  const [units, setUnits] = useState([])
  const [districts, setDistricts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [formValue, setFormValue] = useState('')
  
  // Activity Log States
  const [activityLogs, setActivityLogs] = useState([])
  const [logFilter, setLogFilter] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [showClearLogsConfirm, setShowClearLogsConfirm] = useState(false)
  const [clearingLogs, setClearingLogs] = useState(false)
  
  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    default_margin: 20,
    wholesale_min_quantity: 10,
    wholesale_discount: 10,
    minimum_stock_global: 5,
    low_stock_threshold: 10,
    enable_low_stock_notification: true,
    enable_stock_movement_notification: true,
    order_number_format: 'ORD-{YYYY}{MM}{DD}-{####}',
    delivery_number_format: 'DEL-{YYYY}{MM}{DD}-{####}',
    payment_number_format: 'PAY-{YYYY}{MM}{DD}-{####}',
    invoice_number_format: 'INV-{YYYY}{MM}{DD}-{####}'
  })

  const menuSections = [
    {
      id: 'master-data',
      label: 'Master Data',
      icon: Database,
      description: 'Kelola data master sistem',
      subItems: [
        { id: 'product-types', label: 'Jenis Produk', icon: Package, description: 'Kategori jenis produk' },
        { id: 'units', label: 'Satuan', icon: Package, description: 'Satuan produk (Kg, Karung, dll)' },
        { id: 'districts', label: 'Wilayah', icon: MapPin, description: 'Wilayah/Kecamatan pengiriman' }
      ]
    },
    {
      id: 'system-config',
      label: 'Konfigurasi Sistem',
      icon: SettingsIcon,
      description: 'Pengaturan harga, stok, dan penomoran',
      subItems: [
        { id: 'pricing', label: 'Harga', icon: DollarSign, description: 'Margin dan diskon' },
        { id: 'stock', label: 'Stok', icon: Package, description: 'Minimum stok dan notifikasi' },
        { id: 'numbering', label: 'Penomoran', icon: Hash, description: 'Format nomor dokumen' }
      ]
    },
    {
      id: 'user-security',
      label: 'User & Keamanan',
      icon: Lock,
      description: 'Pengaturan akun dan keamanan',
      subItems: [
        { id: 'account', label: 'Akun', icon: User, description: 'Data akun owner' },
        { id: 'security', label: 'Keamanan', icon: Lock, description: 'PIN & Password' }
      ]
    },
    {
      id: 'activity-log',
      label: 'Log Aktivitas',
      icon: Activity,
      description: 'Riwayat aktivitas sistem',
      subItems: []
    },
    {
      id: 'branding',
      label: 'Branding & Tampilan',
      icon: Palette,
      description: 'Pengaturan tampilan dan branding',
      subItems: []
    }
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveSection(tab)
      const section = menuSections.find(s => s.id === tab)
      if (section && section.subItems.length > 0) {
        setActiveSubSection(section.subItems[0].id)
      }
    }
  }, [searchParams])

  async function loadData() {
    setLoading(true)
    await Promise.all([loadMasterData(), loadSystemSettings(), loadActivityLogs()])
    setLoading(false)
  }

  async function loadMasterData() {
    try {
      const [typesRes, unitsRes, districtsRes] = await Promise.all([
        supabase.from('product_types').select('*').order('name'),
        supabase.from('units').select('*').order('name'),
        supabase.from('districts').select('*').order('name')
      ])
      setProductTypes(typesRes.data || [])
      setUnits(unitsRes.data || [])
      setDistricts(districtsRes.data || [])
    } catch (error) {
      console.error('Error loading master data:', error)
    }
  }

  async function loadSystemSettings() {
    try {
      const { data } = await supabase.from('system_settings').select('*')
      const settingsObj = {}
      data?.forEach(item => {
        let value = item.setting_value
        if (item.setting_type === 'number') value = parseFloat(value)
        else if (item.setting_type === 'boolean') value = value === 'true'
        settingsObj[item.setting_key] = value
      })
      setSystemSettings(prev => ({ ...prev, ...settingsObj }))
    } catch (error) {
      console.error('Error loading system settings:', error)
    }
  }

  async function loadActivityLogs() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) {
        console.error('Error loading activity logs:', error)
        // If table doesn't exist, just set empty array
        setActivityLogs([])
        return
      }
      
      setActivityLogs(data || [])
    } catch (error) {
      console.error('Error loading activity logs:', error)
      setActivityLogs([])
    }
  }

  async function handleClearAllLogs() {
    if (clearingLogs) return

    try {
      setClearingLogs(true)

      // Get all log IDs first
      const { data: logs, error: fetchError } = await supabase
        .from('activity_logs')
        .select('id')

      if (fetchError) throw fetchError

      if (!logs || logs.length === 0) {
        showToast('Tidak ada log untuk dihapus', 'info')
        setShowClearLogsConfirm(false)
        return
      }

      // Delete all logs
      const { error: deleteError } = await supabase
        .from('activity_logs')
        .delete()
        .in('id', logs.map(log => log.id))

      if (deleteError) throw deleteError

      showToast(`${logs.length} log aktivitas berhasil dihapus`, 'success')
      setShowClearLogsConfirm(false)
      setActivityLogs([])
      
      // Reload to confirm
      await loadActivityLogs()
    } catch (error) {
      console.error('Error clearing logs:', error)
      showToast(error.message || 'Gagal menghapus log aktivitas', 'error')
    } finally {
      setClearingLogs(false)
    }
  }

  async function saveSystemSettings() {
    try {
      setSaving(true)
      const updates = Object.entries(systemSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: String(value),
        setting_type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string'
      }))
      for (const update of updates) {
        await supabase.from('system_settings').upsert(update, { onConflict: 'setting_key' })
      }
      showToast('Pengaturan berhasil disimpan', 'success')
    } catch (error) {
      showToast('Gagal menyimpan pengaturan', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveMasterData() {
    try {
      const table = modalType === 'product-types' ? 'product_types' 
                  : modalType === 'units' ? 'units' : 'districts'
      if (editingItem) {
        await supabase.from(table).update({ name: formValue }).eq('id', editingItem.id)
      } else {
        await supabase.from(table).insert({ name: formValue })
      }
      await loadMasterData()
      setIsModalOpen(false)
      setFormValue('')
      showToast('Data berhasil disimpan', 'success')
    } catch (error) {
      showToast('Gagal menyimpan data', 'error')
    }
  }

  async function handleDeleteMasterData(type, id) {
    if (!confirm('Yakin ingin menghapus data ini?')) return
    try {
      const table = type === 'product-types' ? 'product_types' 
                  : type === 'units' ? 'units' : 'districts'
      await supabase.from(table).delete().eq('id', id)
      await loadMasterData()
      showToast('Data berhasil dihapus', 'success')
    } catch (error) {
      showToast('Gagal menghapus data', 'error')
    }
  }

  const getSectionInfo = () => {
    return menuSections.find(s => s.id === activeSection) || menuSections[0]
  }

  const getCurrentData = () => {
    if (activeSubSection === 'product-types') return productTypes
    if (activeSubSection === 'units') return units
    if (activeSubSection === 'districts') return districts
    return []
  }

  const filteredData = getCurrentData().filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Memuat pengaturan...</p>
      </div>
    )
  }

  const sectionInfo = getSectionInfo()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {sectionInfo.label}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {sectionInfo.description}
          </p>
        </div>
        {activeSection === 'system-config' && (
          <Button onClick={saveSystemSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan
              </>
            )}
          </Button>
        )}
      </div>

      {/* Sub Navigation Tabs */}
      {sectionInfo.subItems.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 overflow-x-auto">
            {sectionInfo.subItems.map(subItem => {
              const SubIcon = subItem.icon
              return (
                <button
                  key={subItem.id}
                  onClick={() => setActiveSubSection(subItem.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${activeSubSection === subItem.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <SubIcon className="w-5 h-5" />
                  {subItem.label}
                </button>
              )
            })}
          </nav>
        </div>
      )}

      {/* Content */}
      <div>
        {/* Master Data Content */}
        {activeSection === 'master-data' && (
          <Card>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Cari data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                  />
                </div>
                <Button 
                  onClick={() => {
                    setModalType(activeSubSection)
                    setEditingItem(null)
                    setFormValue('')
                    setIsModalOpen(true)
                  }}
                  className="whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Data
                </Button>
              </div>

              {filteredData.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Tidak ada data yang ditemukan' : 'Belum ada data'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredData.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModalType(activeSubSection)
                            setEditingItem(item)
                            setFormValue(item.name)
                            setIsModalOpen(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMasterData(activeSubSection, item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* System Config - Pricing */}
        {activeSection === 'system-config' && activeSubSection === 'pricing' && (
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Margin Default (%)
                </label>
                <input
                  type="number"
                  value={systemSettings.default_margin}
                  onChange={(e) => setSystemSettings({ ...systemSettings, default_margin: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
                  value={systemSettings.wholesale_min_quantity}
                  onChange={(e) => setSystemSettings({ ...systemSettings, wholesale_min_quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Diskon Grosir (%)
                </label>
                <input
                  type="number"
                  value={systemSettings.wholesale_discount}
                  onChange={(e) => setSystemSettings({ ...systemSettings, wholesale_discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </Card>
        )}

        {/* User & Security Section */}
        {activeSection === 'user-security' && (
          <div className="space-y-6">
            {activeSubSection === 'account' && (
              <Card title="Pengaturan Akun">
                <div className="p-6">
                  <AccountSettings />
                </div>
              </Card>
            )}

            {activeSubSection === 'security' && (
              <SecuritySettings />
            )}
          </div>
        )}

        {activeSection === 'activity-log' && (
          <div className="space-y-6">
            {/* Filters Card */}
            <Card>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 sm:w-48"
                  >
                    <option value="all">Semua Aktivitas</option>
                    <option value="create">Tambah Data</option>
                    <option value="update">Ubah Data</option>
                    <option value="delete">Hapus Data</option>
                    <option value="view">Lihat Data</option>
                    <option value="export">Export</option>
                  </select>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Cari aktivitas..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  {activityLogs.length > 0 && (
                    <Button 
                      variant="danger" 
                      onClick={() => setShowClearLogsConfirm(true)}
                      disabled={clearingLogs}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Semua
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <div className="p-6">
                <div className="space-y-6">
                {activityLogs
                  .filter(log => {
                    if (logFilter !== 'all' && log.action !== logFilter) return false
                    if (logSearch && !log.description?.toLowerCase().includes(logSearch.toLowerCase()) && 
                        !log.entity_name?.toLowerCase().includes(logSearch.toLowerCase())) return false
                    return true
                  })
                  .map((log, index) => {
                    const getActionIcon = () => {
                      switch (log.action) {
                        case 'create': return <Plus className="w-5 h-5 text-green-500" />
                        case 'update': return <Edit className="w-5 h-5 text-blue-500" />
                        case 'delete': return <Trash2 className="w-5 h-5 text-red-500" />
                        case 'view': return <Eye className="w-5 h-5 text-gray-500" />
                        case 'export': return <Download className="w-5 h-5 text-purple-500" />
                        default: return <Activity className="w-5 h-5 text-gray-500" />
                      }
                    }

                    const getEntityIcon = () => {
                      switch (log.entity_type) {
                        case 'order': return <ShoppingCart className="w-4 h-4" />
                        case 'product': return <Package className="w-4 h-4" />
                        case 'store': return <Store className="w-4 h-4" />
                        case 'delivery': return <Truck className="w-4 h-4" />
                        case 'payment': return <CreditCard className="w-4 h-4" />
                        case 'report': return <FileText className="w-4 h-4" />
                        default: return <Activity className="w-4 h-4" />
                      }
                    }

                    const getActionColor = () => {
                      switch (log.action) {
                        case 'create': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        case 'update': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        case 'delete': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        case 'view': return 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                        case 'export': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                        default: return 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      }
                    }

                    return (
                      <div key={log.id} className="relative pl-12">
                        {/* Timeline Line */}
                        {index !== activityLogs.filter(l => {
                          if (logFilter !== 'all' && l.action !== logFilter) return false
                          if (logSearch && !l.description?.toLowerCase().includes(logSearch.toLowerCase()) && 
                              !l.entity_name?.toLowerCase().includes(logSearch.toLowerCase())) return false
                          return true
                        }).length - 1 && (
                          <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                        )}
                        
                        {/* Icon Circle */}
                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center z-10">
                          {getActionIcon()}
                        </div>

                        {/* Content Card */}
                        <div className={`border rounded-lg p-4 ${getActionColor()}`}>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getEntityIcon()}
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {log.entity_name || log.entity_type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {log.description}
                              </p>
                              {log.user_name && (
                                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                  <User className="w-3.5 h-3.5" />
                                  <span>{log.user_name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {safeFormatDate(log.created_at, 'dd MMM yyyy, HH:mm', 'Baru saja')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {activityLogs.filter(log => {
                    if (logFilter !== 'all' && log.action !== logFilter) return false
                    if (logSearch && !log.description?.toLowerCase().includes(logSearch.toLowerCase()) && 
                        !log.entity_name?.toLowerCase().includes(logSearch.toLowerCase())) return false
                    return true
                  }).length === 0 && (
                    <div className="text-center py-16">
                      <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                        {logSearch || logFilter !== 'all' 
                          ? 'Tidak ada aktivitas yang sesuai' 
                          : 'Belum ada aktivitas yang tercatat'}
                      </p>
                      {activityLogs.length === 0 && !logSearch && logFilter === 'all' && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Pastikan tabel activity_logs sudah dibuat di database
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'branding' && (
          <BrandingSettings />
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Data' : 'Tambah Data'}
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama
            </label>
            <input
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveMasterData}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

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

      {/* Clear All Logs Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearLogsConfirm}
        onClose={() => !clearingLogs && setShowClearLogsConfirm(false)}
        onConfirm={handleClearAllLogs}
        title="Hapus Semua Log Aktivitas"
        message={`Apakah Anda yakin ingin menghapus semua log aktivitas (${activityLogs.length} log)? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
        type="danger"
        loading={clearingLogs}
      />
    </div>
  )
}
