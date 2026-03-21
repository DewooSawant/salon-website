import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMenu, FiX, FiPhone, FiClock } from 'react-icons/fi'

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Team', href: '#team' },
  { name: 'Contact', href: '#contact' },
]

export default function Navbar({ onBookClick }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:block bg-dark-900 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6 text-gray-400">
            <span className="flex items-center gap-2">
              <FiClock className="text-gold-500" />
              Mon - Sat: 10:00 AM - 9:00 PM
            </span>
            <span className="flex items-center gap-2">
              <FiPhone className="text-gold-500" />
              +91 98765 43210
            </span>
          </div>
          <div className="text-gold-400 font-display italic">
            Premium Grooming Experience in Keshav Nagar, Pune
          </div>
        </div>
      </div>
      
      {/* Main navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 lg:top-10 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-dark-950/95 backdrop-blur-xl shadow-lg shadow-black/20' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-dark-950">G</span>
              </div>
              <div>
                <span className="block font-display text-2xl font-semibold text-gradient">
                  Glamour Cuts
                </span>
                <span className="text-xs text-gray-500 tracking-widest uppercase">
                  Premium Salon
                </span>
              </div>
            </a>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-300 hover:text-gold-400 transition-colors duration-300 text-sm tracking-wide"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Book button */}
            <div className="hidden lg:block">
              <button onClick={onBookClick} className="btn-primary">
                Book Appointment
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gold-400"
            >
              {isMobileMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden bg-dark-950/98 backdrop-blur-xl pt-24"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-display text-gray-200 hover:text-gold-400 transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  onBookClick()
                }}
                className="btn-primary mt-4"
              >
                Book Appointment
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

