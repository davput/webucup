import { useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    const newToast = { id, message, type }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }

  const showSuccess = (message) => {
    showToast(message, 'success')
  }

  const showError = (message) => {
    showToast(message, 'error')
  }

  const showWarning = (message) => {
    showToast(message, 'warning')
  }

  const showInfo = (message) => {
    showToast(message, 'info')
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  }
}
