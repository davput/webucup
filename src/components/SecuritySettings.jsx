import { useState, useEffect } from 'react'
import { Lock, Key, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import PinSetup from './PinSetup'
import PasswordSetup from './PasswordSetup'
import Card from './Card'
import { supabase } from '../lib/supabase'

export default function SecuritySettings() {
  const [activeTab, setActiveTab] = useState('pin')
  const [hasPin, setHasPin] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSecurityStatus()
  }, [])

  async function checkSecurityStatus() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_pin', 'app_password'])
      
      const pinData = data?.find(d => d.setting_key === 'app_pin')
      const passwordData = data?.find(d => d.setting_key === 'app_password')
      
      setHasPin(!!pinData?.setting_value)
      setHasPassword(!!passwordData?.setting_value)
      
      // Auto select active method
      if (pinData?.setting_value) {
        setActiveTab('pin')
      } else if (passwordData?.setting_value) {
        setActiveTab('password')
      }
    } catch (error) {
      console.error('Error checking security status:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleRefresh() {
    checkSecurityStatus()
  }

  const securityOptions = [
    {
      id: 'pin',
      label: 'PIN',
      icon: Key,
      description: 'Kode PIN 6 digit untuk keamanan aplikasi',
      component: PinSetup,
      isActive: hasPin
    },
    {
      id: 'password',
      label: 'Password',
      icon: Lock,
      description: 'Password untuk login dan keamanan',
      component: PasswordSetup,
      isActive: hasPassword
    }
  ]

  const activeOption = securityOptions.find(opt => opt.id === activeTab)
  const ActiveComponent = activeOption?.component
  const activeMethod = hasPin ? 'pin' : hasPassword ? 'password' : null

  return (
    <div className="space-y-6">
      {/* Active Security Method Info */}
      {activeMethod && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                Metode Keamanan Aktif: {activeMethod === 'pin' ? 'PIN' : 'Password'}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Hanya satu metode keamanan yang dapat aktif. Untuk menggunakan metode lain, hapus metode yang sedang aktif terlebih dahulu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityOptions.map(option => {
          const Icon = option.icon
          const isActive = activeTab === option.id
          const isMethodActive = option.isActive
          const isDisabled = activeMethod && activeMethod !== option.id

          return (
            <button
              key={option.id}
              onClick={() => !isDisabled && setActiveTab(option.id)}
              disabled={isDisabled}
              className={`
                relative p-6 rounded-xl border-2 text-left transition-all
                ${isActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  p-3 rounded-lg
                  ${isActive 
                    ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                      {option.label}
                    </h3>
                    {isMethodActive && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Aktif
                      </span>
                    )}
                    {isDisabled && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        Terkunci
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
              {isActive && (
                <div className="absolute top-4 right-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Active Security Component */}
      {ActiveComponent ? (
        <Card>
          <div className="p-6">
            <ActiveComponent onRefresh={handleRefresh} />
          </div>
        </Card>
      ) : null}

      {/* Security Tips */}
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Tips Keamanan
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Hanya satu metode keamanan yang dapat aktif (PIN atau Password)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Gunakan kode yang unik dan tidak mudah ditebak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Jangan bagikan kode keamanan Anda kepada siapapun</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Ubah kode secara berkala untuk keamanan maksimal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Pastikan tidak ada yang melihat saat Anda memasukkan kode</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
