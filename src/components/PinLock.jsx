import { useState } from 'react'
import { Lock, LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from './Button'

export default function PinLock() {
  const { verifyPin, verifyPassword, securityMethod } = useAuth()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isPasswordMode = securityMethod === 'password'

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (isPasswordMode) {
      // Password mode
      if (!input) {
        setError('Masukkan password')
        return
      }

      const isValid = await verifyPassword(input)
      if (isValid) {
        setError('')
      } else {
        setError('Password salah!')
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setInput('')
        }, 500)
      }
    } else {
      // PIN mode
      if (input.length !== 6) {
        setError('PIN harus 6 digit')
        return
      }

      const isValid = await verifyPin(input)
      if (isValid) {
        setError('')
      } else {
        setError('PIN salah!')
        setShake(true)
        setTimeout(() => {
          setShake(false)
          setInput('')
        }, 500)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Toko Pupuk</h1>
          <p className="text-blue-100 dark:text-gray-300">
            Masukkan {isPasswordMode ? 'Password' : 'PIN'} untuk melanjutkan
          </p>
        </div>

        {/* Lock Form */}
        <form onSubmit={handleSubmit}>
          <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 ${shake ? 'animate-shake' : ''}`}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                {isPasswordMode ? 'Password' : 'PIN (6 digit)'}
              </label>
              
              {isPasswordMode ? (
                // Password Input
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      setError('')
                    }}
                    placeholder="Masukkan password"
                    className="w-full px-6 py-4 pr-12 text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              ) : (
                // PIN Input
                <>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={input}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setInput(value)
                      setError('')
                    }}
                    placeholder="••••••"
                    className="w-full px-6 py-4 text-center text-2xl tracking-widest border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                    autoFocus
                  />
                  
                  {/* PIN Dots Indicator */}
                  <div className="flex justify-center gap-3 mt-4">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index < input.length
                            ? 'bg-blue-600 dark:bg-blue-400 scale-110'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-center text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isPasswordMode ? !input : input.length !== 6}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Unlock
            </Button>

            <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-4">
              {isPasswordMode 
                ? 'Masukkan password Anda' 
                : 'Masukkan 6 digit PIN Anda'}
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  )
}
