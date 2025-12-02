export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    red: 'bg-gradient-to-br from-red-500 to-red-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-sm font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colorClasses[color]} p-3 lg:p-4 rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
        </div>
      </div>
    </div>
  )
}
