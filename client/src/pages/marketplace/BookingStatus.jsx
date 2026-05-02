import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiPhone, FiUser,
  FiCheck, FiX, FiShare2, FiLink, FiExternalLink, FiAlertCircle,
  FiDownload, FiScissors, FiBell,
} from 'react-icons/fi'
import { FaWhatsapp, FaFacebook, FaTwitter } from 'react-icons/fa'
import RecentBookingsMenu from '../../components/marketplace/RecentBookingsMenu'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const formatTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// Hero banner config per status: gradient, icon, headline, subline, pill bg
const statusConfig = {
  pending: {
    label: 'Awaiting confirmation',
    subline: 'The salon will confirm your booking shortly.',
    gradient: 'from-amber-400 via-amber-500 to-orange-500',
    icon: FiClock,
    canCancel: true,
  },
  confirmed: {
    label: 'You\'re confirmed',
    subline: 'See you at your appointment!',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    icon: FiCheck,
    canCancel: true,
  },
  completed: {
    label: 'All done',
    subline: 'Thanks for visiting!',
    gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    icon: FiCheck,
    canCancel: false,
  },
  cancelled: {
    label: 'Cancelled',
    subline: 'This booking is no longer active.',
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    icon: FiX,
    canCancel: false,
  },
  no_show: {
    label: 'Marked as no-show',
    subline: 'You did not arrive for this appointment.',
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    icon: FiAlertCircle,
    canCancel: false,
  },
}

// Journey timeline: steps in order. Which is the current/last reached depends on status.
const journeySteps = [
  { key: 'booked', label: 'Booked', icon: FiCalendar },
  { key: 'confirmed', label: 'Confirmed', icon: FiBell },
  { key: 'completed', label: 'Completed', icon: FiCheck },
]
// Map status → highest reached index
const statusReached = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: -1, // special — hide timeline
  no_show: -1,
}

function ShareMenu({ url, title, onClose }) {
  const ref = useRef(null)
  const text = `${title}\nView details:`

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy — please copy from the address bar')
    }
    onClose()
  }

  const waText = encodeURIComponent(`${text} ${url}`)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute top-12 right-0 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 text-gray-800"
    >
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noreferrer"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 transition"
      >
        <FaWhatsapp className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium">WhatsApp</span>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition"
      >
        <FaFacebook className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium">Facebook</span>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition"
      >
        <FaTwitter className="w-5 h-5 text-gray-800" />
        <span className="text-sm font-medium">X (Twitter)</span>
      </a>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={copy}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition"
      >
        <FiLink className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium">Copy link</span>
      </button>
    </motion.div>
  )
}

function buildGoogleCalendarUrl(booking) {
  if (!booking?.booking_date || !booking?.start_time || !booking?.end_time) return null
  // Convert local date/time → UTC iCal format (YYYYMMDDTHHMMSSZ).
  // Salon times are IST (+05:30). We bake this in by treating the incoming time as IST.
  const toUtcIcal = (date, time) => {
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    const ist = new Date(Date.UTC(y, m - 1, d, hh, mm) - 5.5 * 60 * 60 * 1000)
    const pad = (n) => String(n).padStart(2, '0')
    return `${ist.getUTCFullYear()}${pad(ist.getUTCMonth() + 1)}${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}${pad(ist.getUTCMinutes())}00Z`
  }
  const start = toUtcIcal(booking.booking_date, booking.start_time)
  const end = toUtcIcal(booking.booking_date, booking.end_time)
  const serviceNames = (booking.services || []).map(s => s.service_name).join(', ')
  const details = [
    `Booking code: ${booking.booking_code}`,
    serviceNames && `Services: ${serviceNames}`,
    `Total: Rs ${booking.final_price}`,
    booking.salon_phone && `Salon phone: ${booking.salon_phone}`,
  ].filter(Boolean).join('\n')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Appointment at ${booking.salon_name}`,
    dates: `${start}/${end}`,
    details,
    location: booking.salon_address || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function BookingStatus() {
  const { code } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/marketplace/bookings/track/${code}`)
      setBooking(res.data.booking)
      setError(null)
    } catch (err) {
      setError(err.response?.status === 404 ? 'Booking not found. Check the code and try again.' : 'Could not load booking')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [code])

  const handleShare = async () => {
    const url = window.location.href
    const title = `My appointment at ${booking?.salon_name || 'Stylo'}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
      }
    }
    setShowShareMenu(true)
  }

  const cancelBooking = async () => {
    setCancelling(true)
    try {
      await axios.patch(`${API_URL}/marketplace/bookings/track/${code}/cancel`)
      toast.success('Booking cancelled')
      setShowCancelConfirm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <FiAlertCircle className="w-12 h-12 text-gray-400 mb-3" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">{error || 'Booking not found'}</h1>
        <p className="text-sm text-gray-500 mb-6">Booking code: <span className="font-mono">{code}</span></p>
        <Link to="/" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition">
          Go to Stylo
        </Link>
      </div>
    )
  }

  const statusInfo = statusConfig[booking.status] || statusConfig.pending
  const gcalUrl = buildGoogleCalendarUrl(booking)
  const mapQuery = booking.salon_latitude && booking.salon_longitude
    ? `${booking.salon_latitude},${booking.salon_longitude}`
    : encodeURIComponent(booking.salon_address || booking.salon_name)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Print-only stylesheet: hide everything with .no-print, show only the receipt block */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-receipt { box-shadow: none !important; border: none !important; }
          header, .sticky { position: static !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 no-print">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center">
              <span className="text-white text-sm">✂️</span>
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Stylo</span>
          </Link>
          <div className="flex items-center gap-1">
            <RecentBookingsMenu />
            <div className="relative">
              <button
                onClick={handleShare}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                aria-label="Share booking"
              >
                <FiShare2 className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <ShareMenu
                    url={window.location.href}
                    title={`My appointment at ${booking.salon_name}`}
                    onClose={() => setShowShareMenu(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {/* PRINT-ONLY RECEIPT — clean branded layout for printing / saving as PDF / screenshotting */}
        <div className="print-only bg-white p-6 mb-4 print-receipt">
          <div className="flex items-center justify-between pb-4 border-b-2 border-gray-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center">
                  <FiScissors className="text-white w-5 h-5" />
                </div>
                <span className="text-2xl font-bold">Stylo</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">stylo.sbs</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Booking Receipt</p>
              <p className="text-lg font-mono font-bold">{booking.booking_code}</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold mt-6 mb-1">{booking.salon_name}</h1>
          {booking.salon_address && <p className="text-sm text-gray-600 mb-1">{booking.salon_address}</p>}
          {booking.salon_phone && <p className="text-sm text-gray-600">{booking.salon_phone}</p>}

          <div className="grid grid-cols-2 gap-6 mt-6 py-4 border-y border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Customer</p>
              <p className="text-base font-semibold">{booking.customer_name}</p>
              {booking.customer_phone && <p className="text-sm text-gray-600">{booking.customer_phone}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Appointment</p>
              <p className="text-base font-semibold">{formatDate(booking.booking_date)}</p>
              <p className="text-sm text-gray-600">{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</p>
              {booking.stylist_name && <p className="text-sm text-gray-600 mt-1">Stylist: {booking.stylist_name}</p>}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Services</p>
            <div className="space-y-2">
              {(booking.services || []).map(s => (
                <div key={s.id} className="flex items-center justify-between py-1 border-b border-dashed border-gray-200">
                  <div>
                    <p className="text-sm font-medium">{s.service_name}</p>
                    <p className="text-xs text-gray-500">{s.service_duration} min</p>
                  </div>
                  <p className="text-sm font-semibold">₹{Number(s.service_price).toFixed(0)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t-2 border-gray-900 flex items-center justify-between">
              <span className="text-base font-bold">Total</span>
              <span className="text-2xl font-bold">₹{Number(booking.final_price).toFixed(0)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Status: <span className="font-semibold capitalize">{booking.status.replace('_', ' ')}</span> · Generated on {new Date().toLocaleDateString('en-IN')}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Manage this booking at stylo.sbs/booking/{booking.booking_code}
            </p>
          </div>
        </div>

        {/* Status hero — full-bleed colored banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl p-6 mb-4 bg-gradient-to-br ${statusInfo.gradient} text-white shadow-lg`}
        >
          {/* Decorative glows */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

          <div className="relative flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.6, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30"
            >
              <statusInfo.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80 mb-1">{statusInfo.label}</p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight truncate">{booking.salon_name}</h1>
              <p className="text-sm text-white/85 mt-1">{statusInfo.subline}</p>
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs">
                <span className="opacity-80">CODE</span>
                <span className="font-mono font-bold tracking-wider">{booking.booking_code}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Journey timeline — hidden for cancelled/no_show */}
        {statusReached[booking.status] >= 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between relative">
              {/* Connecting line behind steps */}
              <div className="absolute top-4 left-[14%] right-[14%] h-0.5 bg-gray-200" />
              <div
                className="absolute top-4 left-[14%] h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                style={{ width: `${(statusReached[booking.status] / (journeySteps.length - 1)) * 72}%` }}
              />
              {journeySteps.map((step, i) => {
                const reached = i <= statusReached[booking.status]
                const isCurrent = i === statusReached[booking.status]
                return (
                  <div key={step.key} className="relative flex flex-col items-center flex-1">
                    <motion.div
                      initial={false}
                      animate={{ scale: isCurrent ? 1.1 : 1 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        reached
                          ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/30'
                          : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      <step.icon className="w-4 h-4" strokeWidth={2.5} />
                    </motion.div>
                    <span className={`mt-2 text-xs font-semibold ${reached ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Appointment card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Date & Time</p>
              <p className="text-base font-semibold text-gray-900">{formatDate(booking.booking_date)}</p>
              <p className="text-sm text-gray-600">{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <FiUser className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Customer</p>
              <p className="text-base font-semibold text-gray-900">{booking.customer_name}</p>
              <p className="text-sm text-gray-600">{booking.customer_phone}</p>
              {booking.stylist_name && <p className="text-sm text-gray-600 mt-1">Stylist: {booking.stylist_name}</p>}
            </div>
          </div>

          {booking.salon_address && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <FiMapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Location</p>
                <p className="text-sm text-gray-700">{booking.salon_address}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-600 font-semibold hover:underline mt-1"
                >
                  Open in Maps <FiExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {booking.salon_phone && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <FiPhone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Salon Contact</p>
                <a href={`tel:${booking.salon_phone}`} className="text-base font-semibold text-brand-700 hover:underline">
                  {booking.salon_phone}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Services + total */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Services</p>
          <div className="space-y-2">
            {(booking.services || []).map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.service_name}</p>
                  <p className="text-xs text-gray-500">{s.service_duration} min</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">₹{Number(s.service_price).toFixed(0)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-lg font-bold text-brand-700">₹{Number(booking.final_price).toFixed(0)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 no-print">
          {gcalUrl && booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <a
              href={gcalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              <FiCalendar className="w-4 h-4" /> Add to Google Calendar
            </a>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              <FiDownload className="w-4 h-4" /> Receipt
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              <FiShare2 className="w-4 h-4" /> Share
            </button>
          </div>
          {booking.salon_whatsapp && (
            <a
              href={`https://wa.me/${booking.salon_whatsapp}?text=${encodeURIComponent(`Hi! About my booking ${booking.booking_code} at ${booking.salon_name}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition"
            >
              <FaWhatsapp className="w-5 h-5" /> Contact Salon on WhatsApp
            </a>
          )}
          {statusInfo.canCancel && !showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition"
            >
              Cancel Booking
            </button>
          )}
          {statusInfo.canCancel && showCancelConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 mb-3">Are you sure you want to cancel this booking? This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold"
                >
                  Keep booking
                </button>
                <button
                  onClick={cancelBooking}
                  disabled={cancelling}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </div>
          )}
          <Link
            to={`/salon/${booking.salon_slug}`}
            className="block text-center py-3 text-brand-700 font-semibold hover:underline"
          >
            <FiArrowLeft className="inline w-4 h-4 mr-1" /> Back to {booking.salon_name}
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Save this page or its URL to view your booking later. No account needed.
        </p>
      </main>
    </div>
  )
}
