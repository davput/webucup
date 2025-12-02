export default function Card({ title, children, action, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 transition-colors ${className}`}>
      {title && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
