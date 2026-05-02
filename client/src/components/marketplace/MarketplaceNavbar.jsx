import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiScissors, FiGrid } from 'react-icons/fi'

export default function MarketplaceNavbar({ transparent = false }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isSalonOwner = !!localStorage.getItem('salonOwnerToken')

  const isActive = (path) => location.pathname === path

  const navLinks = []

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
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-pink-600 transition-all shadow-md shadow-brand hover:shadow-lg hover:shadow-brand-lg"
                >
                  Salon Login
                </Link>
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
                {navLinks.map((link) => (
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
                    className="block w-full text-center py-3 mt-2 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl text-sm font-semibold"
                  >
                    Salon Login
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
