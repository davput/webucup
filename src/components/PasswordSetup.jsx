import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import Button from './Button'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'

export default function PasswordSetup({ onRefresh }) {
  const { showToast } = useToast()
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState('view') // view, setup, change, remove
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Show/hide password
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    checkPasswordStatus()
  }, [])

  async function checkPasswordStatus() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'app_password')
        .single()
      
      setHasPassword(!!data?.setting_value)
    } catch (error) {
      setHasPassword(false)
    } finally {
      setLoading(false)
    }
  }

  function validatePassword(password) {
    const errors = []
    if (password.length < 6) {
      errors.push('Password minimal 6 karakter')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Harus ada huruf besar')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Harus ada huruf kecil')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Harus ada angka')
    }
    return errors
  }

  function getPasswordStrength(password) {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    if (strength <= 2) return { label: 'Lemah', color: 'red', width: '33%' }
    if (strength <= 4) return { label: 'Sedang', color: 'yellow', width: '66%' }
    return { label: 'Kuat', color: 'green', width: '100%' }
  }

  async function handleSetupPassword() {
    if (!newPassword || !confirmPassword) {
      showToast('Mohon isi semua field', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Password tidak cocok', 'error')
      return
    }

    const errors = validatePassword(newPassword)
    if (errors.length > 0) {
      showToast(errors[0], 'error')
      return
    }

    try {
      setSaving(true)
      
      // Delete PIN if exists (exclusive security)
      await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', 'app_pin')
      
      // Hash password (simple base64 encoding - in production use proper hashing)
      const hashedPassword = btoa(newPassword)
      
      await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'app_password',
          setting_value: hashedPassword,
          setting_type: 'string'
        }, { onConflict: 'setting_key' })

      showToast('Password berhasil dibuat', 'success')
      setHasPassword(true)
      setMode('view')
      resetForm()
      
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Error setting password:', error)
      showToast('Gagal membuat password', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Mohon isi semua field', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('Password baru tidak cocok', 'error')
      return
    }

    const errors = validatePassword(newPassword)
    if (errors.length > 0) {
      showToast(errors[0], 'error')
      return
    }

    try {
      setSaving(true)
      
      // Verify current password
      const { data: currentData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'app_password')
        .single()

      const storedPassword = atob(currentData.setting_value)
      if (storedPassword !== currentPassword) {
        showToast('Password lama salah', 'error')
        setSaving(false)
        return
      }

      // Update password
      const hashedPassword = btoa(newPassword)
      await supabase
        .from('system_settings')
        .update({ setting_value: hashedPassword })
        .eq('setting_key', 'app_password')

      showToast('Password berhasil diubah', 'success')
      setMode('view')
      resetForm()
    } catch (error) {
      console.error('Error changing password:', error)
      showToast('Gagal mengubah password', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemovePassword() {
    if (!currentPassword) {
      showToast('Masukkan password untuk menghapus', 'error')
      return
    }

    try {
      setSaving(true)
      
      // Verify current password
      const { data: currentData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'app_password')
        .single()

      const storedPassword = atob(currentData.setting_value)
      if (storedPassword !== currentPassword) {
        showToast('Password salah', 'error')
        setSaving(false)
        return
      }

      // Delete password
      await supabase
        .from('system_settings')
        .delete()
        .eq('setting_key', 'app_password')

      showToast('Password berhasil dihapus', 'success')
      setHasPassword(false)
      setMode('view')
      resetForm()
      
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error('Error removing password:', error)
      showToast('Gagal menghapus password', 'error')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
  }

  function handleCancel() {
    setMode('view')
    resetForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  // View Mode
  if (mode === 'view') {
    return (
      <div className="space-y-6">
        {/* Status Card */}
        <div className={`p-6 rounded-xl border-2 ${
          hasPassword 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              hasPassword 
                ? 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {hasPassword ? 'Password Aktif' : 'Password Belum Diatur'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasPassword 
                  ? 'Password Anda saat ini aktif dan melindungi aplikasi' 
                  : 'Atur password untuk keamanan tambahan aplikasi Anda'}
              </p>
            </div>
            {hasPassword && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!hasPassword ? (
            <Button onClick={() => setMode('setup')} className="flex-1">
              <Lock className="w-4 h-4 mr-2" />
              Buat Password
            </Button>
          ) : (
            <>
              <Button onClick={() => setMode('change')} className="flex-1">
                <Lock className="w-4 h-4 mr-2" />
                Ubah Password
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setMode('remove')}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Hapus Password
              </Button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-medium mb-1">Tentang Password</p>
            <p className="text-blue-700 dark:text-blue-300">
              Password digunakan untuk login ke aplikasi. Pastikan password Anda kuat dan tidak mudah ditebak.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Setup Mode
  if (mode === 'setup') {
    const strength = newPassword ? getPasswordStrength(newPassword) : null
    const errors = newPassword ? validatePassword(newPassword) : []

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Buat Password Baru</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Buat password yang kuat untuk melindungi aplikasi
            </p>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Masukkan password baru"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password Strength */}
          {newPassword && strength && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Kekuatan Password</span>
                <span className={`text-xs font-medium text-${strength.color}-600 dark:text-${strength.color}-400`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${strength.color}-500 transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {newPassword && errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <XCircle className="w-3 h-3" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Ulangi password baru"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Password tidak cocok
            </p>
          )}
          {confirmPassword && newPassword === confirmPassword && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Password cocok
            </p>
          )}
        </div>

        {/* Requirements */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Persyaratan Password:</p>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-400'}`} />
              Minimal 6 karakter
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
              Minimal 1 huruf besar
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
              Minimal 1 huruf kecil
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-400'}`} />
              Minimal 1 angka
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCancel} className="flex-1">
            Batal
          </Button>
          <Button 
            onClick={handleSetupPassword} 
            disabled={saving || errors.length > 0 || newPassword !== confirmPassword}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Buat Password
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Change Mode
  if (mode === 'change') {
    const strength = newPassword ? getPasswordStrength(newPassword) : null
    const errors = newPassword ? validatePassword(newPassword) : []

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Ubah Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Masukkan password lama dan password baru
            </p>
          </div>
        </div>

        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password Lama
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Masukkan password lama"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Masukkan password baru"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {newPassword && strength && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">Kekuatan Password</span>
                <span className={`text-xs font-medium text-${strength.color}-600`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${strength.color}-500 transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Ulangi password baru"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Password tidak cocok
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCancel} className="flex-1">
            Batal
          </Button>
          <Button 
            onClick={handleChangePassword} 
            disabled={saving || errors.length > 0 || newPassword !== confirmPassword || !currentPassword}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ubah Password
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Remove Mode
  if (mode === 'remove') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Hapus Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Konfirmasi password untuk menghapus
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900 dark:text-red-200">
              <p className="font-medium mb-1">Peringatan!</p>
              <p className="text-red-700 dark:text-red-300">
                Menghapus password akan menghilangkan perlindungan keamanan aplikasi. Pastikan Anda yakin sebelum melanjutkan.
              </p>
            </div>
          </div>
        </div>

        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Masukkan password untuk konfirmasi"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCancel} className="flex-1">
            Batal
          </Button>
          <Button 
            variant="danger"
            onClick={handleRemovePassword} 
            disabled={saving || !currentPassword}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Hapus Password
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
