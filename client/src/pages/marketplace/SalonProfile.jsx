import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiStar, FiMapPin, FiPhone, FiClock, FiChevronDown, FiHeart,
  FiArrowLeft, FiCheck, FiCalendar, FiUser, FiX, FiShield,
  FiWifi, FiCheckCircle, FiNavigation, FiShare2
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import MarketplaceNavbar from '../../components/marketplace/MarketplaceNavbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const amenityIcons = {
  'AC': '❄️',
  'WiFi': '📶',
  'Parking': '🅿️',
  'Card Payment': '💳',
  'Hygienic': '🧼',
  'Beverages': '☕',
  'Kids Friendly': '👶',
  'Wheelchair Access': '♿',
}

const formatTimeDisplay = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function ServiceItem({ service, selected, onToggle }) {
  const effectivePrice = service.discounted_price || service.price
  const hasDiscount = service.discounted_price && service.discounted_price < service.price

  return (
    <button
      onClick={() => onToggle(service)}
      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
        selected
          ? 'border-brand-500 bg-brand-50 shadow-sm'
          : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{service.icon || '✂️'}</span>
        <div className="text-left">
          <h4 className="font-semibold text-gray-900">{service.name}</h4>
          <p className="text-sm text-gray-500">{service.duration} min</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          {hasDiscount ? (
            <div>
              <span className="text-xs text-gray-400 line-through block">₹{service.price}</span>
              <span className="font-bold text-brand-600">₹{service.discounted_price}</span>
            </div>
          ) : (
            <span className="font-bold text-gray-900">₹{service.price}</span>
          )}
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
          selected ? 'border-brand-500 bg-brand-500 scale-110' : 'border-gray-300'
        }`}>
          {selected && <FiCheck className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>
    </button>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
            {review.customer_name?.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-sm text-gray-900">{review.customer_name}</span>
            {review.created_at && (
              <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50">
          <FiStar className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="text-sm font-bold text-amber-700">{review.rating}</span>
        </div>
      </div>
      {review.review && <p className="text-sm text-gray-600 leading-relaxed">{review.review}</p>}
      {review.owner_reply && (
        <div className="mt-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
          <p className="text-sm text-brand-700">
            <span className="font-semibold">Owner reply:</span> {review.owner_reply}
          </p>
        </div>
      )}
    </div>
  )
}

function BookingModal({ show, onClose, salon, selectedServices, stylists, totalPrice, totalDuration, slug }) {
  const totalSteps = 3
  const [step, setStep] = useState(1)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [stylistId, setStylistId] = useState('')
  const [slots, setSlots] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchSlots = async (selectedDate) => {
    setDate(selectedDate)
    setTime('')
    try {
      const res = await axios.get(`${API_URL}/salons/${slug}/available-slots/${selectedDate}`, {
        params: { duration: totalDuration, stylist_id: stylistId || undefined }
      })
      setSlots(res.data.slots)
    } catch { toast.error('Failed to load time slots') }
  }

  const submit = async () => {
    if (!name || !phone) { toast.error('Please fill in your details'); return }
    setSubmitting(true)
    try {
      const res = await axios.post(`${API_URL}/marketplace/bookings`, {
        salon_id: salon.id,
        customer_name: name,
        customer_phone: phone,
        stylist_id: stylistId || null,
        booking_date: date,
        start_time: time + ':00',
        services: selectedServices.map(s => s.id),
      })
      setResult(res.data)
      setStep(totalSteps + 1) // Go to success step
      toast.success('Booking confirmed!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-5 rounded-t-3xl flex items-center justify-between z-10">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {step > totalSteps ? 'Booking Confirmed!' : 'Book Appointment'}
              </h3>
              {step <= totalSteps && <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          {step <= totalSteps && (
            <div className="px-5 pt-4 flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-brand-500' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          )}

          <div className="p-5">
            {/* Step 1: Date & Time */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FiCalendar className="w-4 h-4 text-brand-500" /> Select Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => fetchSlots(e.target.value)}
                    className="w-full p-3.5 border border-gray-200 rounded-xl focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-gray-700"
                  />
                </div>

                {slots.length > 0 && (
                  <div className="mb-5">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FiClock className="w-4 h-4 text-brand-500" /> Select Time
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {slots.filter(s => s.available).map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => setTime(slot.time)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                            time === slot.time
                              ? 'bg-brand-600 text-white shadow-md shadow-brand'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {formatTimeDisplay(slot.time)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {stylists.length > 0 && (
                  <div className="mb-5">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FiUser className="w-4 h-4 text-brand-500" /> Preferred Stylist (optional)
                    </label>
                    <select
                      value={stylistId}
                      onChange={(e) => setStylistId(e.target.value)}
                      className="w-full p-3.5 border border-gray-200 rounded-xl focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-gray-700"
                    >
                      <option value="">Any available</option>
                      {stylists.map(s => <option key={s.id} value={s.id}>{s.name} - {s.speciality}</option>)}
                    </select>
                  </div>
                )}

                <button
                  disabled={!date || !time}
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-brand-700 hover:to-accent-600 transition-all shadow-md shadow-brand"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Name *</label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3.5 border border-gray-200 rounded-xl focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3.5 border border-gray-200 rounded-xl focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-gray-700"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    disabled={!name || !phone}
                    onClick={() => setStep(totalSteps)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold disabled:opacity-40 hover:from-brand-700 hover:to-accent-600 transition-all shadow-md shadow-brand"
                  >
                    Review
                  </button>
                </div>
              </motion.div>
            )}

            {/* Confirm Step (step 2 for logged-in, step 3 for guests) */}
            {step === totalSteps && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="bg-brand-50 rounded-2xl p-5 mb-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Salon</span>
                    <span className="font-semibold text-gray-900">{salon.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-semibold text-gray-900">{name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-semibold text-gray-900">{phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date</span>
                    <span className="font-semibold text-gray-900">{date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time</span>
                    <span className="font-semibold text-gray-900">{formatTimeDisplay(time)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Services</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[200px]">
                      {selectedServices.map(s => s.name).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">{totalDuration} min</span>
                  </div>
                  <div className="border-t border-brand-200 pt-3 flex justify-between">
                    <span className="font-bold text-brand-700">Total</span>
                    <span className="text-xl font-bold text-brand-700">₹{totalPrice}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:from-brand-700 hover:to-accent-600 transition-all shadow-md shadow-brand"
                  >
                    {submitting ? 'Booking...' : 'Confirm & Book'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success Step */}
            {step > totalSteps && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <FiCheck className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h3>
                <p className="text-gray-500 mb-6">Your appointment has been booked successfully.</p>

                <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Booking Code</p>
                  <p className="text-3xl font-bold text-brand-600 font-mono">{result.booking.booking_code}</p>
                </div>

                {result.notifications?.customerWhatsAppLink && (
                  <a
                    href={result.notifications.customerWhatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition mb-4 shadow-md"
                  >
                    <FaWhatsapp className="w-5 h-5" /> Get Confirmation on WhatsApp
                  </a>
                )}

                <p className="text-sm text-gray-400">Please arrive 5-10 minutes before your appointment.</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function SalonProfile() {
  const { slug } = useParams()
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [stylists, setStylists] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState([])
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [showBooking, setShowBooking] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('services')

  useEffect(() => {
    fetchSalon()
  }, [slug])

  const fetchSalon = async () => {
    try {
      const res = await axios.get(`${API_URL}/salons/${slug}`)
      setSalon(res.data.salon)
      setServices(res.data.services)
      setStylists(res.data.stylists)
      setReviews(res.data.reviews)
      if (res.data.services.length > 0) setExpandedCategory(res.data.services[0].name)
    } catch {
      toast.error('Salon not found')
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (service) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    )
  }

  const toggleFavorite = () => {
    toast('Favorites coming soon', { icon: '💫' })
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.discounted_price || s.price), 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  // Derive amenities from salon data
  const amenities = salon ? ['AC', 'Parking', 'Card Payment', 'Hygienic'] : []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MarketplaceNavbar />
        <div className="flex items-center justify-center pt-32">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MarketplaceNavbar />
        <div className="flex flex-col items-center justify-center pt-32">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Salon not found</h2>
          <Link to="/discover" className="text-brand-600 font-medium hover:underline">Browse salons</Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'services', label: 'Services', count: services.reduce((sum, c) => sum + c.services.length, 0) },
    { id: 'team', label: 'Team', count: stylists.length },
    { id: 'reviews', label: 'Reviews', count: reviews.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceNavbar />

      {/* Salon Header - Hero style */}
      <div className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 text-white pt-16">
        {salon.cover_image_url && (
          <>
            <img src={salon.cover_image_url.startsWith('http') ? salon.cover_image_url : `${API_URL.replace('/api', '')}${salon.cover_image_url}`} alt={salon.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-900/70 to-brand-800/50" />
          </>
        )}

        {/* Top actions */}
        <div className="relative max-w-4xl mx-auto px-4 pt-4 flex items-center justify-between">
          <Link
            to="/discover"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 transition text-sm font-medium"
          >
            <FiArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
            >
              <FiHeart className={`w-5 h-5 ${isFavorite ? 'fill-red-400 text-red-400' : 'text-white'}`} />
            </button>
            <button className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition">
              <FiShare2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Salon Info */}
        <div className="relative max-w-4xl mx-auto px-4 py-8 pb-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-semibold capitalize border border-white/20">
              {salon.type}
            </span>
            {salon.is_verified && (
              <span className="px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-lg text-xs font-semibold flex items-center gap-1 border border-green-400/30">
                <FiShield className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{salon.name}</h1>
          {salon.tagline && <p className="text-white/80 text-lg mb-4">{salon.tagline}</p>}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
            {salon.avg_rating && (
              <span className="flex items-center gap-1.5 font-medium">
                <FiStar className="fill-amber-400 text-amber-400 w-4 h-4" />
                {salon.avg_rating}
                <span className="text-white/60">({salon.total_ratings} reviews)</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <FiMapPin className="w-4 h-4 text-white/60" /> {salon.address}
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock className="w-4 h-4 text-white/60" /> {salon.opening_time?.slice(0, 5)} - {salon.closing_time?.slice(0, 5)}
            </span>
            {salon.phone && (
              <a href={`tel:${salon.phone}`} className="flex items-center gap-1.5 hover:text-white transition">
                <FiPhone className="w-4 h-4 text-white/60" /> {salon.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Amenities Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {amenities.map(a => (
              <span key={a} className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                <span>{amenityIcons[a] || '✓'}</span> {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {/* Services Tab */}
        {activeTab === 'services' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-4">
              {services.map(category => (
                <div key={category.name} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="text-left">
                        <span className="font-bold text-gray-900">{category.name}</span>
                        <span className="block text-sm text-gray-500">{category.services.length} services</span>
                      </div>
                    </span>
                    <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      expandedCategory === category.name ? 'rotate-180' : ''
                    }`} />
                  </button>
                  <AnimatePresence>
                    {expandedCategory === category.name && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2">
                          {category.services.map(service => (
                            <ServiceItem
                              key={service.id}
                              service={service}
                              selected={!!selectedServices.find(s => s.id === service.id)}
                              onToggle={toggleService}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {stylists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stylists.map(stylist => (
                  <div key={stylist.id} className="bg-white rounded-2xl p-5 text-center border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center mx-auto mb-3 text-3xl group-hover:scale-110 transition-transform">
                      {stylist.avatar_emoji || '💇'}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-0.5">{stylist.name}</h4>
                    <p className="text-xs text-brand-600 font-medium mb-1">{stylist.role}</p>
                    <p className="text-xs text-gray-500">{stylist.experience}</p>
                    {stylist.speciality && <p className="text-xs text-gray-400 mt-1">{stylist.speciality}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No team members listed yet.</div>
            )}
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {reviews.length > 0 ? (
              <>
                {/* Rating Summary */}
                {salon.avg_rating && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">{salon.avg_rating}</div>
                      <div className="flex gap-0.5 justify-center my-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <FiStar key={i} className={`w-4 h-4 ${i <= Math.round(salon.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">{salon.total_ratings} reviews</div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">No reviews yet. Be the first to review!</div>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Book Bar */}
      {selectedServices.length > 0 && !showBooking && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl shadow-black/10 p-4 z-40"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xl font-bold text-gray-900">₹{totalPrice}</p>
              <p className="text-sm text-gray-500">
                {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} &bull; {totalDuration} min
              </p>
            </div>
            <button
              onClick={() => setShowBooking(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-bold hover:from-brand-700 hover:to-accent-600 transition-all shadow-lg shadow-brand text-base"
            >
              Book Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Booking Modal */}
      <BookingModal
        show={showBooking}
        onClose={() => { setShowBooking(false); if (showBooking) setSelectedServices([]) }}
        salon={salon}
        selectedServices={selectedServices}
        stylists={stylists}
        totalPrice={totalPrice}
        totalDuration={totalDuration}
        slug={slug}
      />
    </div>
  )
}
