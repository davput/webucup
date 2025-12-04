import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

// Simple hash function for PIN (untuk production gunakan bcrypt)
function hashPin(pin) {
  return btoa(pin) // Base64 encode (simple, untuk production gunakan crypto yang lebih kuat)
}

export function AuthProvider({ children }) {
  const [isLocked, setIsLocked] = useState(true)
  const [hasPin, setHasPin] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [securityMethod, setSecurityMethod] = useState(null) // 'pin' or 'password'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSecurityStatus()
  }, [])

  async function checkSecurityStatus() {
    try {
      // Check database for security settings
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_pin', 'app_password'])

      const pinData = data?.find(d => d.setting_key === 'app_pin')
      const passwordData = data?.find(d => d.setting_key === 'app_password')

      const hasPinSet = !!pinData?.setting_value
      const hasPasswordSet = !!passwordData?.setting_value

      setHasPin(hasPinSet)
      setHasPassword(hasPasswordSet)

      // Determine security method and lock status
      if (hasPinSet) {
        setSecurityMethod('pin')
        setIsLocked(true)
      } else if (hasPasswordSet) {
        setSecurityMethod('password')
        setIsLocked(true)
      } else {
        setSecurityMethod(null)
        setIsLocked(false)
      }
    } catch (error) {
      console.error('Error checking security status:', error)
      setIsLocked(false)
    } finally {
      setLoading(false)
    }
  }

  async function setupPin(pin) {
    const hashedPin = hashPin(pin)
    setHasPin(true)
    setSecurityMethod('pin')
    setIsLocked(false)
    return true
  }

  async function verifyPin(pin) {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'app_pin')
        .single()

      if (data?.setting_value) {
        const hashedPin = hashPin(pin)
        if (hashedPin === data.setting_value) {
          setIsLocked(false)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error verifying PIN:', error)
      return false
    }
  }

  async function verifyPassword(password) {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'app_password')
        .single()

      if (data?.setting_value) {
        const storedPassword = atob(data.setting_value)
        if (storedPassword === password) {
          setIsLocked(false)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error verifying password:', error)
      return false
    }
  }

  async function changePin(oldPin, newPin) {
    const isValid = await verifyPin(oldPin)
    if (!isValid) {
      return { success: false, message: 'PIN lama salah' }
    }
    
    return { success: true, message: 'PIN berhasil diubah' }
  }

  async function removePin(pin) {
    const isValid = await verifyPin(pin)
    if (!isValid) {
      return { success: false, message: 'PIN salah' }
    }
    
    setHasPin(false)
    setSecurityMethod(null)
    setIsLocked(false)
    return { success: true, message: 'PIN berhasil dihapus' }
  }

  function lock() {
    if (hasPin || hasPassword) {
      setIsLocked(true)
    }
  }

  return (
    <AuthContext.Provider value={{
      isLocked,
      hasPin,
      hasPassword,
      securityMethod,
      loading,
      setupPin,
      verifyPin,
      verifyPassword,
      changePin,
      removePin,
      lock
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
