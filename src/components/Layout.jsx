import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Package, Store, ShoppingCart, 
  Truck, Users, DollarSign, FileText, Menu, X, Moon, Sun, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, List, Plus, Settings, Database
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const menuItems = [
  { 
    path: '/', 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    subtitle: 'Ringkasan & Statistik' 
  },
  { 
    path: '/products', 
    icon: Package, 
    label: 'Produk', 
    subtitle: 'Kelola Produk Pupuk',
    subItems: [
      { path: '/products', label: 'Daftar Produk', icon: List },
      { path: '/stock-in', label: 'Stok Masuk', icon: TrendingUp },
      { path: '/stock-adjustment', label: 'Penyesuaian Stok', icon: Settings },
      { path: '/product-reports', label: 'Laporan Produk', icon: FileText },
      { path: '/product-master', label: 'Master Data', icon: Database },
    ]
  },
  { 
    path: '/stores', 
    icon: Store, 
    label: 'Toko', 
    subtitle: 'Manajemen Toko',
    subItems: [
      { path: '/stores', label: 'Daftar Toko', icon: List },
      { path: '/store-reports', label: 'Laporan Toko', icon: FileText },
    ]
  },
  { 
    path: '/order-management', 
    icon: ShoppingCart, 
    label: 'Order', 
    subtitle: 'Pesanan & Transaksi',
    subItems: [
      { path: '/order-management', label: 'Daftar Order', icon: List },
      { path: '/orders/new', label: 'Buat Order Baru', icon: Plus },
    ]
  },
  { 
    path: '/delivery-management', 
    icon: Truck, 
    label: 'Pengiriman', 
    subtitle: 'Jadwal & Rute',
    subItems: [
      { path: '/delivery-management', label: 'Daftar Pengiriman', icon: List },
      { path: '/deliveries/schedule', label: 'Jadwalkan Pengiriman', icon: Plus },
      { path: '/driver-mode', label: 'Mode Sopir', icon: Users },
    ]
  },
  { 
    path: '/employees', 
    icon: Users, 
    label: 'Pegawai', 
    subtitle: 'Driver & Loader' 
  },
  { 
    path: '/reports', 
    icon: FileText, 
    label: 'Laporan', 
    subtitle: 'Laporan & Export' 
  },
  { 
    path: '/settings', 
    icon: Settings, 
    label: 'Pengaturan', 
    subtitle: 'Konfigurasi Aplikasi' 
  },
]

export default function Layout({ children }) {
  const location = useLocation()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('sidebarOpen')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [expandedMenus, setExpandedMenus] = useState(() => {
    // Auto-expand menu if current path matches
    const expanded = {}
    menuItems.forEach(item => {
      if (item.subItems) {
        const isActive = item.subItems.some(sub => location.pathname.startsWith(sub.path))
        if (isActive) expanded[item.path] = true
      }
    })
    return expanded
  })
  const { isDark, toggleTheme } = useTheme()

  const toggleDesktopSidebar = () => {
    const newState = !isDesktopSidebarOpen
    setIsDesktopSidebarOpen(newState)
    localStorage.setItem('sidebarOpen', JSON.stringify(newState))
  }

  const toggleSubMenu = (path) => {
    setExpandedMenus(prev => {
      const isCurrentlyExpanded = prev[path]
      // Close all menus first, then toggle the clicked one
      const newState = {}
      if (!isCurrentlyExpanded) {
        newState[path] = true
      }
      return newState
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-all duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDesktopSidebarOpen ? 'lg:w-64' : 'lg:w-20'}
      `}>
        <div className={`flex items-center ${isDesktopSidebarOpen ? 'justify-between' : 'justify-center'} p-4 border-b border-gray-200 dark:border-gray-700`}>
          {isDesktopSidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pupuk App</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Distribusi</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedMenus[item.path]
            const isActive = !hasSubItems && location.pathname === item.path
            const isParentActive = hasSubItems && item.subItems.some(sub => 
              location.pathname === sub.path || location.pathname.startsWith(sub.path + '/')
            )

            return (
              <div key={item.path}>
                {/* Main Menu Item */}
                {hasSubItems ? (
                  <button
                    onClick={() => {
                      if (isDesktopSidebarOpen) {
                        toggleSubMenu(item.path)
                      } else {
                        // If collapsed, navigate to main path
                        window.location.href = item.path
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isParentActive
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${!isDesktopSidebarOpen && 'lg:justify-center'}
                    `}
                    title={!isDesktopSidebarOpen ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isDesktopSidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${!isDesktopSidebarOpen && 'lg:justify-center'}
                    `}
                    title={!isDesktopSidebarOpen ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isDesktopSidebarOpen && <span>{item.label}</span>}
                  </Link>
                )}

                {/* Sub Menu Items */}
                {hasSubItems && isExpanded && isDesktopSidebarOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = location.pathname === subItem.path || 
                                         location.pathname.startsWith(subItem.path + '/')
                      
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                            ${isSubActive
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }
                          `}
                        >
                          {SubIcon && <SubIcon className="w-4 h-4" />}
                          <span>{subItem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Toggle Button (Desktop Only) */}
        <button
          onClick={toggleDesktopSidebar}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-md"
          title={isDesktopSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
        >
          {isDesktopSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <Menu className="w-6 h-6" />
                </button>

                <button
                  onClick={toggleDesktopSidebar}
                  className="hidden lg:flex text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  title={isDesktopSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
                >
                  <Menu className="w-5 h-5" />
                </button>


              </div>
              
              <div className="flex-1" />

              <div className="flex items-center gap-3">
                <span className="hidden lg:inline text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Manajemen Distribusi Pupuk
                </span>
                
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
