import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiGrid, FiScissors, FiUsers, FiCalendar, FiStar, FiSettings, FiLogOut, FiArrowLeft, FiMenu, FiX, FiDollarSign, FiBarChart2, FiUserCheck, FiCreditCard, FiTrendingUp, FiExternalLink } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const sidebarLinks = [
  { to: '/salon-owner/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/salon-owner/walkin', label: 'Walk-in Billing', icon: FiDollarSign, highlight: true },
  { to: '/salon-owner/bookings', label: 'Bookings', icon: FiCalendar },
  { to: '/salon-owner/analytics', label: 'Analytics', icon: FiTrendingUp },
  { to: '/salon-owner/daily-report', label: 'Daily Register', icon: FiBarChart2 },
  { to: '/salon-owner/customers', label: 'Customers', icon: FiUserCheck },
  { to: '/salon-owner/services', label: 'Services', icon: FiScissors },
  { to: '/salon-owner/stylists', label: 'Stylists', icon: FiUsers },
  { to: '/salon-owner/staff-pay', label: 'Staff Pay', icon: FiCreditCard },
  { to: '/salon-owner/reviews', label: 'Reviews', icon: FiStar },
  { to: '/salon-owner/settings', label: 'Settings', icon: FiSettings },
]

export function useSalonOwnerApi() {
  const navigate = useNavigate()
  const token = localStorage.getItem('salonOwnerToken')

  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })

  api.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401) {
        localStorage.removeItem('salonOwnerToken')
        navigate('/salon-owner/login')
      }
      return Promise.reject(err)
    }
  )

  useEffect(() => {
    if (!token) navigate('/salon-owner/login')
  }, [token])

  return api
}

export default function SalonOwnerLayout({ children, title }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [salonName, setSalonName] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const info = localStorage.getItem('salonInfo')
    if (info) {
      try { setSalonName(JSON.parse(info).name) } catch {}
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('salonOwnerToken')
    localStorage.removeItem('salonInfo')
    navigate('/salon-owner/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
            <Link to="/salon-owner/dashboard" className="text-lg font-bold bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
              {salonName || 'My Salon'}
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/discover" className="p-2 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition" title="Marketplace">
              <FiExternalLink className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline text-sm px-1">Marketplace</span>
            </Link>
            <button onClick={logout} className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition" title="Logout">
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-3.5rem)] sticky top-14">
          <nav className="p-3 space-y-1">
            {sidebarLinks.map(link => {
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? link.highlight ? 'bg-green-50 text-green-700' : 'bg-brand-50 text-brand-700'
                      : link.highlight
                        ? 'text-green-700 bg-green-50/50 hover:bg-green-50 border border-green-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className={`w-4 h-4 ${active ? (link.highlight ? 'text-green-600' : 'text-brand-600') : link.highlight ? 'text-green-600' : 'text-gray-400'}`} />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
            <div className="absolute top-14 left-0 bottom-0 w-64 bg-white shadow-xl border-r border-gray-200">
              <nav className="p-3 space-y-1">
                {sidebarLinks.map(link => {
                  const active = location.pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <link.icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-gray-400'}`} />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
