import { useState } from 'react'
import { Lock, Eye, EyeOff, Shield, Key } from 'lucide-react'
import Button from './Button'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function PinSetup({ onRefresh }) {
  const { hasPin, setupPin, changePin, removePin } = useAuth()
  const { showToast } = useToast()
  const [mode, setMode] = useState('view') // view, setup, change, remove
  const [formData, setFormData] = useState({
    oldPin: '',
    newPin: '',
    confirmPin: ''
  })
  const [showPins, setShowPins] = useState({
    old: false,
    new: false,
    confirm: false
  })

  async function handleSetupPin() {
    if (formData.newPin.length !== 6) {
      showToast('PIN harus 6 digit', 'error')
      return
    }

    if (formData.newPin !== formData.confirmPin) {
      showToast('PIN tidak cocok', 'error')
      return
    }

    try {
      // Delete password if exists (exclusive security)
      await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', 'app_password')

      setupPin(formData.newPin)
      showToast('PIN berhasil dibuat', 'success')
      setMode('view')
      setFormData({ oldPin: '', newPin: '', confirmPin: '' })
      
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Error setting up PIN:', error)
      showToast('Gagal membuat PIN', 'error')
    }
  }

  async function handleChangePin() {
    if (formData.newPin.length !== 6) {
      showToast('PIN baru harus 6 digit', 'error')
      return
    }

    if (formData.newPin !== formData.confirmPin) {
      showToast('PIN baru tidak cocok', 'error')
      return
    }

    const result = await changePin(formData.oldPin, formData.newPin)
    showToast(result.message, result.success ? 'success' : 'error')
    
    if (result.success) {
      setMode('view')
      setFormData({ oldPin: '', newPin: '', confirmPin: '' })
    }
  }

  async function handleRemovePin() {
    const result = await removePin(formData.oldPin)
    showToast(result.message, result.success ? 'success' : 'error')
    
    if (result.success) {
      setMode('view')
      setFormData({ oldPin: '', newPin: '', confirmPin: '' })
      if (onRefresh) onRefresh()
    }
  }

  if (mode === 'view') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Keamanan PIN
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {hasPin 
                ? 'PIN aktif. Aplikasi akan meminta PIN saat dibuka.'
                : 'Belum ada PIN. Buat PIN untuk mengamankan aplikasi Anda.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!hasPin ? (
            <Button onClick={() => setMode('setup')} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Buat PIN
            </Button>
          ) : (
            <>
              <Button onClick={() => setMode('change')} className="w-full">
                <Key className="w-4 h-4 mr-2" />
                Ganti PIN
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setMode('remove')} 
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                Hapus PIN
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'setup') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PIN Baru (6 digit)
          </label>
          <div className="relative">
            <input
              type={showPins.new ? 'text' : 'password'}
              value={formData.newPin}
              onChange={(e) => setFormData({ ...formData, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              placeholder="••••••"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
              maxLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPins({ ...showPins, new: !showPins.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPins.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konfirmasi PIN
          </label>
          <div className="relative">
            <input
              type={showPins.confirm ? 'text' : 'password'}
              value={formData.confirmPin}
              onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              placeholder="••••••"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white pr-10"
              maxLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPins({ ...showPins, confirm: !showPins.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPins.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => {
            setMode('view')
            setFormData({ oldPin: '', newPin: '', confirmPin: '' })
          }} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleSetupPin} className="flex-1">
            Simpan PIN
          </Button>
        </div>
      </div>
    )
  }

  if (mode === 'change') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PIN Lama
          </label>
          <input
            type={showPins.old ? 'text' : 'password'}
            value={formData.oldPin}
            onChange={(e) => setFormData({ ...formData, oldPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="••••••"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            maxLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PIN Baru (6 digit)
          </label>
          <input
            type={showPins.new ? 'text' : 'password'}
            value={formData.newPin}
            onChange={(e) => setFormData({ ...formData, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="••••••"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            maxLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konfirmasi PIN Baru
          </label>
          <input
            type={showPins.confirm ? 'text' : 'password'}
            value={formData.confirmPin}
            onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="••••••"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            maxLength={6}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => {
            setMode('view')
            setFormData({ oldPin: '', newPin: '', confirmPin: '' })
          }} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleChangePin} className="flex-1">
            Ganti PIN
          </Button>
        </div>
      </div>
    )
  }

  if (mode === 'remove') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            Menghapus PIN akan membuat aplikasi tidak terlindungi. Siapa saja bisa mengakses data Anda.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Masukkan PIN untuk konfirmasi
          </label>
          <input
            type={showPins.old ? 'text' : 'password'}
            value={formData.oldPin}
            onChange={(e) => setFormData({ ...formData, oldPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="••••••"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            maxLength={6}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => {
            setMode('view')
            setFormData({ oldPin: '', newPin: '', confirmPin: '' })
          }} className="flex-1">
            Batal
          </Button>
          <Button variant="danger" onClick={handleRemovePin} className="flex-1">
            Hapus PIN
          </Button>
        </div>
      </div>
    )
  }
}
