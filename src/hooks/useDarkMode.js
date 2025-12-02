import { useState, useEffect } from 'react'

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage safely
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      console.log('🌓 Initial dark mode from localStorage:', saved)
      if (saved !== null) {
        return JSON.parse(saved)
      }
      // Check system preference
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
      console.log('🌓 Using system preference:', systemPreference)
      return systemPreference
    }
    return false
  })

  useEffect(() => {
    console.log('🌓 Dark mode changed to:', isDark)
    const root = window.document.documentElement
    
    if (isDark) {
      root.classList.add('dark')
      console.log('✅ Added dark class to html')
    } else {
      root.classList.remove('dark')
      console.log('✅ Removed dark class from html')
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('darkMode', JSON.stringify(isDark))
      console.log('💾 Saved to localStorage:', isDark)
    } catch (e) {
      console.error('❌ Failed to save dark mode preference:', e)
    }
  }, [isDark])

  return [isDark, setIsDark]
}
