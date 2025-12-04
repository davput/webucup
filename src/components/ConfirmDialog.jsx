import { AlertTriangle, X, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  loading = false
}) {
  const confirmButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // Auto focus confirm button
    confirmButtonRef.current?.focus()

    // Handle keyboard events
    const handleKeyDown = (e) => {
      if (loading) return // Disable keyboard when loading
      
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleConfirm()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, loading])

  const handleConfirm = () => {
    if (loading) return
    if (onConfirm) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (loading) return
    onClose()
  }

  if (!isOpen) return null

  const typeConfig = {
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      buttonColor: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 active:bg-blue-700'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-50 dark:bg-green-500/10',
      buttonColor: 'bg-green-500 hover:bg-green-600 focus:ring-green-500 active:bg-green-700'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      buttonColor: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 active:bg-amber-700'
    },
    danger: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-50 dark:bg-red-500/10',
      buttonColor: 'bg-red-500 hover:bg-red-600 focus:ring-red-500 active:bg-red-700'
    }
  }

  const config = typeConfig[type] || typeConfig.warning
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full animate-slideUp overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className={`${config.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center mb-5`}>
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 pr-8">
            {title}
          </h3>

          {/* Message */}
          <div className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-300 mb-8 whitespace-pre-line">
            {message}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white ${config.buttonColor} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
