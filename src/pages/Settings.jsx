import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette, Save, Moon, Sun, Monitor, Plus, Edit, Trash2, Package, MapPin, DollarSign, Hash } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('general')
  
  // Master Data States
  const [productTypes, setProductTypes] = useState([])
  const [districts, setDistricts] = useState([])
  const [units, setUnits] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [formValue, setFormValue] = useState('')
  
  const [settings, setSettings] = useState({
    // General
    companyName: 'Distribusi Pupuk',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    
    // Appearance
    theme: localStorage.getItem('theme') || 'system',
    
    // Notifications
    emailNotifications: true,
    orderNotifications: true,
    stockAlerts: true,
    deliveryUpdates: true,
    
    // Business
    defaultPaymentTerms: 30,
    lowStockThreshold: 10,
    autoGenerateInvoice: true,
    requireApproval: false,
    
    // System
    backupFrequency: 'daily',
    dataRetention: 365,
    enableAuditLog: true,
    
    // Pricing (from system_settings table)
    default_margin: 20,
    wholesale_min_quantity: 10,
    wholesale_discount: 10,
    
    // Stock (from system_settings table)
    minimum_stock_global: 5,
    enable_low_stock_notification: true,
    enable_stock_movement_notification: true,
    
    // Numbering (from system_settings table)
    order_number_format: 'ORD-{YYYY}{MM}{DD}-{####}',
    delivery_number_format: 'DEL-{YYYY}{MM}{DD}-{####}',
    payment_number_format: 'PAY-{YYYY}{MM}{DD}-{####}',
    invoice_number_format: 'INV-{YYYY}{MM}{DD}-{####}'
  })

  useEffect(() => {
    loadSettings()
    loadMasterData()
  }, [])

  const loadSettings = async () => {
    // Load from localStorage
    const saved = localStorage.getItem('appSettings')
    if (saved) {
      setSettings(prev => ({ ...prev, ...JSON.parse(saved) }))
    }
    
    // Load from system_settings table
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
      
      if (error) throw error

      // Convert array to object
      const settingsObj = {}
      data?.forEach(item => {
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
      console.error('Error loading system settings:', error)
    }
  }

  const loadMasterData = async () => {
    try {
      // Load product types
      const { data: typesData } = await supabase
        .from('product_types')
        .select('*')
        .order('name')
      setProductTypes(typesData || [])

      // Load districts
      const { data: districtsData } = await supabase
        .from('districts')
        .select('*')
        .order('name')
      setDistricts(districtsData || [])

      // Load units
      const { data: unitsData } = await supabase
        .from('units')
        .select('*')
        .order('name')
      setUnits(unitsData || [])
    } catch (error) {
      console.error('Error loading master data:', error)
      showToast('Gagal memuat master data', 'error')
    }
  }

  const openAddModal = (type) => {
    setModalType(type)
    setEditingItem(null)
    setFormValue('')
    setIsModalOpen(true)
  }

  const openEditModal = (type, item) => {
    setModalType(type)
    setEditingItem(item)
    setFormValue(item.name)
    setIsModalOpen(true)
  }

  const handleMasterDataSubmit = async () => {
    if (!formValue.trim()) {
      showToast('Nilai tidak boleh kosong', 'error')
      return
    }

    try {
      const tableName = modalType === 'productType' ? 'product_types' : 
                       modalType === 'district' ? 'districts' : 'units'

      if (editingItem !== null) {
        // Update existing
        const { error } = await supabase
          .from(tableName)
          .update({ name: formValue })
          .eq('id', editingItem.id)

        if (error) throw error
        showToast('Data berhasil diupdate', 'success')
      } else {
        // Insert new
        const { error } = await supabase
          .from(tableName)
          .insert([{ name: formValue }])

        if (error) throw error
        showToast('Data berhasil ditambahkan', 'success')
      }

      setIsModalOpen(false)
      loadMasterData()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleDelete = async (type, item) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return

    try {
      const tableName = type === 'productType' ? 'product_types' : 
                       type === 'district' ? 'districts' : 'units'

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', item.id)

      if (error) throw error
      showToast('Data berhasil dihapus', 'success')
      loadMasterData()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings))
    
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    localStorage.setItem('theme', settings.theme)
    
    showToast('Pengaturan berhasil disimpan', 'success')
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'general', label: 'Umum', icon: SettingsIcon },
    { id: 'pricing', label: 'Harga', icon: DollarSign },
    { id: 'stock', label: 'Stok', icon: Package },
    { id: 'numbering', label: 'Penomoran', icon: Hash },
    { id: 'appearance', label: 'Tampilan', icon: Palette },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'business', label: 'Bisnis', icon: Database },
    { id: 'masterdata', label: 'Master Data', icon: MapPin },
    { id: 'security', label: 'Keamanan', icon: Shield }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <SettingsIcon className="w-7 h-7 mr-3 text-blue-600" />
          Pengaturan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola preferensi dan konfigurasi aplikasi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <nav className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <div className="p-6">

              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Perusahaan</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nama Perusahaan
                        </label>
                        <input
                          type="text"
                          value={settings.companyName}
                          onChange={(e) => handleChange('companyName', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Alamat
                        </label>
                        <textarea
                          value={settings.companyAddress}
                          onChange={(e) => handleChange('companyAddress', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Telepon
                          </label>
                          <input
                            type="tel"
                            value={settings.companyPhone}
                            onChange={(e) => handleChange('companyPhone', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={settings.companyEmail}
                            onChange={(e) => handleChange('companyEmail', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tema Aplikasi</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => handleChange('theme', 'light')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            settings.theme === 'light'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Terang</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mode terang</p>
                        </button>

                        <button
                          onClick={() => handleChange('theme', 'dark')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            settings.theme === 'dark'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Moon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Gelap</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mode gelap</p>
                        </button>

                        <button
                          onClick={() => handleChange('theme', 'system')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            settings.theme === 'system'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sistem</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ikuti sistem</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferensi Notifikasi</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Notifikasi Email</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Terima notifikasi via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Order Baru</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Notifikasi saat ada order baru</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.orderNotifications}
                            onChange={(e) => handleChange('orderNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Peringatan Stok</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Alert saat stok menipis</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.stockAlerts}
                            onChange={(e) => handleChange('stockAlerts', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Update Pengiriman</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Notifikasi status pengiriman</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.deliveryUpdates}
                            onChange={(e) => handleChange('deliveryUpdates', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Settings */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pengaturan Bisnis</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Jangka Waktu Pembayaran Default (hari)
                        </label>
                        <input
                          type="number"
                          value={settings.defaultPaymentTerms}
                          onChange={(e) => handleChange('defaultPaymentTerms', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Jangka waktu pembayaran untuk order baru
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Threshold Stok Rendah (karung)
                        </label>
                        <input
                          type="number"
                          value={settings.lowStockThreshold}
                          onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Batas minimum stok sebelum peringatan
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Auto-Generate Invoice</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Buat invoice otomatis saat order dibuat</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.autoGenerateInvoice}
                            onChange={(e) => handleChange('autoGenerateInvoice', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Persetujuan Order</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Order memerlukan persetujuan sebelum diproses</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.requireApproval}
                            onChange={(e) => handleChange('requireApproval', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Master Data Settings */}
              {activeTab === 'masterdata' && (
                <div className="space-y-6">
                  {/* Product Types */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        Jenis Produk
                      </h3>
                      <Button onClick={() => openAddModal('productType')} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Tambah
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {productTypes.map((type) => (
                        <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{type.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal('productType', type)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('productType', type)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Districts */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Kecamatan
                      </h3>
                      <Button onClick={() => openAddModal('district')} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Tambah
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {districts.map((district) => (
                        <div key={district.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{district.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal('district', district)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('district', district)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Units */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <Database className="w-5 h-5 mr-2" />
                        Satuan
                      </h3>
                      <Button onClick={() => openAddModal('unit')} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Tambah
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {units.map((unit) => (
                        <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{unit.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal('unit', unit)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('unit', unit)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Info:</strong> Master data ini akan digunakan di seluruh aplikasi untuk dropdown dan pilihan data.
                    </p>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Keamanan & Backup</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Frekuensi Backup
                        </label>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) => handleChange('backupFrequency', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="daily">Harian</option>
                          <option value="weekly">Mingguan</option>
                          <option value="monthly">Bulanan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Retensi Data (hari)
                        </label>
                        <input
                          type="number"
                          value={settings.dataRetention}
                          onChange={(e) => handleChange('dataRetention', parseInt(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Berapa lama data disimpan sebelum dihapus otomatis
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Audit Log</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Catat semua aktivitas pengguna</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.enableAuditLog}
                            onChange={(e) => handleChange('enableAuditLog', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          <strong>Catatan:</strong> Backup otomatis akan disimpan di Supabase Storage. Pastikan Anda memiliki cukup ruang penyimpanan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal for Master Data */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem !== null
            ? `Edit ${modalType === 'productType' ? 'Jenis Produk' : modalType === 'district' ? 'Kecamatan' : 'Satuan'}`
            : `Tambah ${modalType === 'productType' ? 'Jenis Produk' : modalType === 'district' ? 'Kecamatan' : 'Satuan'}`
        }
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {modalType === 'productType' ? 'Nama Jenis Produk' : modalType === 'district' ? 'Nama Kecamatan' : 'Nama Satuan'}
            </label>
            <input
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder={
                modalType === 'productType' ? 'Contoh: Urea' :
                modalType === 'district' ? 'Contoh: Cibinong' :
                'Contoh: Karung'
              }
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              onKeyPress={(e) => e.key === 'Enter' && handleMasterDataSubmit()}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleMasterDataSubmit}>
              {editingItem !== null ? 'Update' : 'Tambah'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
