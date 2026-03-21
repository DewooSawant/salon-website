import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiHome, FiCalendar, FiScissors, FiUsers, FiSettings, 
  FiMessageSquare, FiLogOut, FiMenu, FiX, FiChevronDown
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
  { name: 'Bookings', href: '/admin/bookings', icon: FiCalendar },
  { name: 'Services', href: '/admin/services', icon: FiScissors },
  { name: 'Stylists', href: '/admin/stylists', icon: FiUsers },
  { name: 'Messages', href: '/admin/messages', icon: FiMessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: FiSettings },
]

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-dark-900 border-r border-white/10
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                <span className="text-xl font-display font-bold text-dark-950">G</span>
              </div>
              <span className="text-lg font-display font-semibold text-white">Glamour Cuts</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-gold-500/10 text-gold-400' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-8 bg-gold-500 rounded-r-full"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                  <span className="text-dark-950 font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium text-sm">{user?.name || 'Admin'}</p>
                  <p className="text-gray-400 text-xs capitalize">{user?.role || 'Owner'}</p>
                </div>
                <FiChevronDown className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-dark-800 border border-white/10 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <FiLogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-dark-950/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <FiMenu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-white">{title}</h1>
            </div>

            <a
              href="/"
              target="_blank"
              className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
            >
              View Website →
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

