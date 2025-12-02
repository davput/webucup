import { Edit, Trash2, Eye, MoreVertical } from 'lucide-react'
import { useState } from 'react'

export default function MobileCard({ 
  title, 
  subtitle, 
  badge, 
  details = [], 
  onEdit, 
  onDelete, 
  onView 
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
        {badge && (
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${badge.className}`}>
            {badge.text}
          </span>
        )}
      </div>

      {details.length > 0 && (
        <div className="space-y-2 mb-3">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{detail.label}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
          >
            <Eye className="w-4 h-4" />
            Lihat
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
        )}
      </div>
    </div>
  )
}
