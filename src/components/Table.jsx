export default function Table({ headers, children, columns, data, emptyMessage = 'Tidak ada data', responsive = true }) {
  // Support both old style (headers + children) and new style (columns + data)
  if (columns && data !== undefined) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data && data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // Old style with headers and children
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers && headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TableRow({ children, onClick }) {
  return (
    <tr 
      onClick={onClick}
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      {children}
    </tr>
  )
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-3 lg:px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </td>
  )
}
