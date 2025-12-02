export default function Button({ children, onClick, variant = 'primary', type = 'button', className = '', disabled = false }) {
  const variants = {
    primary: 'bg-green-600 hover:bg-green-700 active:bg-green-800 dark:bg-green-500 dark:hover:bg-green-600 text-white shadow-sm hover:shadow',
    secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-sm hover:shadow',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </button>
  )
}
