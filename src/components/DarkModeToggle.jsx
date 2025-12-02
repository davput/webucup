import { Moon, Sun } from 'lucide-react'
import useDarkMode from '../hooks/useDarkMode'

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useDarkMode()

  const handleToggle = () => {
    console.log('Toggle clicked! Current:', isDark, 'New:', !isDark)
    setIsDark(!isDark)
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
