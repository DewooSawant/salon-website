import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiSearch, FiUser, FiCalendar, FiScissors, FiLogIn, FiHeart, FiLogOut, FiGrid } from 'react-icons/fi'
import { useCustomer } from '../../context/CustomerContext'

export default function MarketplaceNavbar({ transparent = false }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const { isAuthenticated, user, logout } = useCustomer()
  const navigate = useNavigate()
  const location = useLocation()
  const isSalonOwner = !!localStorage.getItem('salonOwnerToken')

  const isActive = (path) => location.pathname === path

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    setProfileOpen(false)
    navigate('/')
  }

  const navLinks = [
    { to: '/discover', label: 'Find Salons', icon: FiSearch },
    { to: '/for-salon-owners', label: 'List Your Salon', icon: FiScissors },
  ]

  const authLinks = isAuthenticated
    ? [
        { to: '/my-bookings', label: 'My Bookings', icon: FiCalendar },
        { to: '/my-bookings', label: 'Favorites', icon: FiHeart },
      ]
    : [{ to: '/login', label: 'Login', icon: FiLogIn }]

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand group-hover:shadow-brand-lg transition-shadow">
                <FiScissors className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">
                Stylo
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:text-brand-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/my-bookings"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-gray-50 transition-all"
                  >
                    My Bookings
                  </Link>
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-brand-600 hover:from-purple-200 hover:to-pink-200 transition-all"
                    >
                      <FiUser className="w-4 h-4" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                        {user?.name && (
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                          </div>
                        )}
                        <Link to="/my-bookings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition">
                          <FiCalendar className="w-4 h-4" /> My Bookings
                        </Link>
                        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition">
                          <FiLogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {isSalonOwner ? (
                    <Link
                      to="/salon-owner/dashboard"
                      className="px-4 py-2 rounded-xl text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-all flex items-center gap-1.5"
                    >
                      <FiGrid className="w-3.5 h-3.5" /> My Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/salon-owner/login"
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-gray-50 transition-all"
                    >
                      Salon Login
                    </Link>
                  )}
                  <Link
                    to="/login"
                    className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-pink-600 transition-all shadow-md shadow-brand hover:shadow-lg hover:shadow-brand-lg"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
            >
              {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-xl rounded-b-2xl mx-2 overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {[...navLinks, ...authLinks].map((link) => (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.to)
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <div className="my-2 border-t border-gray-100" />
                    {user?.name && (
                      <div className="px-4 py-2">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t border-gray-100" />
                    {isSalonOwner ? (
                      <Link
                        to="/salon-owner/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-600 bg-brand-50 transition-all"
                      >
                        <FiGrid className="w-4 h-4" />
                        My Salon Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/salon-owner/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <FiScissors className="w-4 h-4" />
                        Salon Owner Login
                      </Link>
                    )}
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 mt-2 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl text-sm font-semibold"
                    >
                      Sign In as Customer
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
