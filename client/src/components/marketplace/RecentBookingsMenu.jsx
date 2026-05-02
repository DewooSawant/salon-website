import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCalendar, FiChevronDown, FiChevronRight, FiX } from 'react-icons/fi'

// Reads booking entries saved by SalonProfile after a successful booking.
// Entry shape: { code, salon_name, salon_slug, booking_date, start_time, total_price, saved_at }
function readRecent() {
  try {
    const raw = localStorage.getItem('stylo_recent_bookings')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
    return parsed.filter(b => b && b.code && b.saved_at && b.saved_at > cutoff).slice(0, 5)
  } catch {
    return []
  }
}

export default function RecentBookingsMenu({ variant = 'light' }) {
  const [bookings, setBookings] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    setBookings(readRecent())
    // Refresh when returning to the tab (covers books made in another tab)
    const onFocus = () => setBookings(readRecent())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('touchstart', onClick)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('touchstart', onClick)
    }
  }, [open])

  if (bookings.length === 0) return null

  const isLight = variant === 'light'
  const triggerClass = isLight
    ? 'text-gray-700 hover:text-brand-700 hover:bg-brand-50'
    : 'text-white/90 hover:bg-white/10'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${triggerClass}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FiCalendar className="w-4 h-4" />
        <span className="hidden sm:inline">My Bookings</span>
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${isLight ? 'bg-brand-100 text-brand-700' : 'bg-white/20 text-white'}`}>
          {bookings.length}
        </span>
        <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-0 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Your bookings on this device</p>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 sm:hidden">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {bookings.map(b => (
                <Link
                  key={b.code}
                  to={`/booking/${b.code}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.salon_name}</p>
                    <p className="text-xs text-gray-500">{b.booking_date} · {b.start_time}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">Code: {b.code}</p>
                  </div>
                  <FiChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 text-center px-4 py-2 border-t border-gray-100 bg-gray-50">
              Saved on this device only. Share or save your booking link.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
