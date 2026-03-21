import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiCalendar, FiClock, FiUser, FiPhone, FiCheck } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const defaultTimeSlots = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30',
]

// Convert 24h time to 12h display format
const formatTimeDisplay = (time) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default function BookingModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [stylists, setStylists] = useState([])
  const [availableSlots, setAvailableSlots] = useState(defaultTimeSlots)
  const [formData, setFormData] = useState({
    services: [],
    date: '',
    time: '',
    stylist_id: null,
    name: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)

  // Fetch services and stylists on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, stylistsRes] = await Promise.all([
          axios.get(`${API_URL}/services`),
          axios.get(`${API_URL}/services/stylists`)
        ])
        setServices(servicesRes.data)
        setStylists(stylistsRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    fetchData()
  }, [])

  // Fetch available slots when date or stylist changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (formData.date) {
        try {
          const totalDuration = formData.services.reduce((sum, s) => sum + s.duration, 0) || 30
          const params = new URLSearchParams({ duration: totalDuration })
          if (formData.stylist_id) {
            params.append('stylist_id', formData.stylist_id)
          }
          const response = await axios.get(`${API_URL}/bookings/available-slots/${formData.date}?${params}`)
          setAvailableSlots(response.data.availableSlots.map(s => s.time))
        } catch (error) {
          console.error('Failed to fetch slots:', error)
        }
      }
    }
    fetchSlots()
  }, [formData.date, formData.stylist_id, formData.services])

  const toggleService = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.find(s => s.id === service.id)
        ? prev.services.filter(s => s.id !== service.id)
        : [...prev.services, service]
    }))
  }

  const totalPrice = formData.services.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = formData.services.reduce((sum, s) => sum + s.duration, 0)

  const nextStep = () => {
    if (step === 1 && formData.services.length === 0) {
      toast.error('Please select at least one service')
      return
    }
    if (step === 2 && (!formData.date || !formData.time)) {
      toast.error('Please select date and time')
      return
    }
    setStep(prev => prev + 1)
  }

  const prevStep = () => setStep(prev => prev - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare booking data for API
      const bookingData = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || null,
        booking_date: formData.date,
        start_time: formData.time,
        stylist_id: formData.stylist_id || null,
        services: formData.services.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        })),
        notes: formData.notes || null
      }

      const response = await axios.post(`${API_URL}/bookings`, bookingData)
      
      setBookingResult(response.data)
      setStep(4) // Show success step
      
      toast.success('Booking confirmed!')
    } catch (error) {
      console.error('Booking error:', error)
      const errorMsg = error.response?.data?.error || 'Failed to create booking. Please try again.'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/90 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-dark-900/95 backdrop-blur border-b border-white/5">
          <div>
            <h2 className="text-2xl font-display font-semibold text-white">
              {step === 4 ? 'Booking Confirmed' : 'Book Appointment'}
            </h2>
            {step < 4 && <p className="text-gray-400 text-sm">Step {step} of 3</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Progress bar */}
        {step < 4 && (
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i <= step ? 'bg-gold-500' : 'bg-dark-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Services */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 text-sm">1</span>
                Select Services
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] sm:max-h-80 overflow-y-auto pr-2">
                {services.map((service) => {
                  const isSelected = formData.services.find(s => s.id === service.id)
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-gold-500/20 border border-gold-500/50'
                          : 'bg-dark-800 border border-white/5 hover:border-gold-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-white text-sm">{service.name}</h4>
                          <p className="text-xs text-gray-500">{service.duration} min</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center">
                            <FiCheck className="text-dark-950 text-xs" />
                          </div>
                        )}
                      </div>
                      <p className="text-gold-400 font-semibold mt-2">₹{service.price}</p>
                    </button>
                  )
                })}
              </div>
              
              {formData.services.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Duration:</span>
                    <span className="text-white">{totalDuration} min</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Total Price:</span>
                    <span className="text-gold-400 font-semibold">₹{totalPrice}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 text-sm">2</span>
                Select Date & Time
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <FiCalendar className="text-gold-400" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:border-gold-500/50 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <FiUser className="text-gold-400" />
                    Preferred Stylist
                  </label>
                  <select
                    value={formData.stylist_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, stylist_id: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white focus:border-gold-500/50 focus:outline-none"
                  >
                    <option value="">Any Available</option>
                    {stylists.map((stylist) => (
                      <option key={stylist.id} value={stylist.id}>
                        {stylist.avatar_emoji} {stylist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <FiClock className="text-gold-400" />
                    Select Time
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-amber-400 text-sm p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      No available slots for this date. Please select another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                          className={`py-2 px-3 rounded-lg text-sm transition-all ${
                            formData.time === slot
                              ? 'bg-gold-500 text-dark-950'
                              : 'bg-dark-800 text-gray-300 hover:bg-dark-700 border border-white/5'
                          }`}
                        >
                          {formatTimeDisplay(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Your Details */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 text-sm">3</span>
                Your Details
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <FiUser className="text-gold-400" />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <FiPhone className="text-gold-400" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Special Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none resize-none"
                    placeholder="Any special requests?"
                  />
                </div>

                {/* Booking summary */}
                <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/20">
                  <h4 className="font-semibold text-white mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Services:</span>
                      <span className="text-white text-right max-w-[200px]">{formData.services.map(s => s.name).join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date & Time:</span>
                      <span className="text-white">{formData.date} at {formData.time ? formatTimeDisplay(formData.time) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stylist:</span>
                      <span className="text-white">
                        {formData.stylist_id 
                          ? stylists.find(s => s.id === formData.stylist_id)?.name || 'Selected'
                          : 'Any Available'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gold-500/20">
                      <span className="text-gold-400 font-semibold">Total:</span>
                      <span className="text-gold-400 font-semibold">₹{totalPrice}</span>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && bookingResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <FiCheck className="w-10 h-10 text-green-400" />
              </div>
              
              <h3 className="text-2xl font-semibold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-gray-400 mb-6">Your appointment has been successfully booked.</p>
              
              <div className="p-4 rounded-xl bg-dark-800 border border-white/10 mb-6 text-left">
                <div className="text-center mb-4">
                  <span className="text-gold-400 font-mono text-2xl font-bold">
                    {bookingResult.booking?.booking_code}
                  </span>
                  <p className="text-gray-500 text-sm mt-1">Booking Code</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{bookingResult.booking?.booking_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white">{formatTimeDisplay(bookingResult.booking?.start_time?.substring(0, 5) || formData.time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-gold-400 font-semibold">₹{bookingResult.booking?.final_price}</span>
                  </div>
                </div>
              </div>

              {bookingResult.notifications?.customerWhatsAppLink && (
                <a
                  href={bookingResult.notifications.customerWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-500 transition-colors mb-4"
                >
                  <FaWhatsapp size={20} />
                  Get Confirmation on WhatsApp
                </a>
              )}

              <p className="text-gray-500 text-sm">
                Please arrive 5-10 minutes before your appointment.
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-4 p-6 bg-dark-900/95 backdrop-blur border-t border-white/5">
          {step === 4 ? (
            <button onClick={onClose} className="flex-1 btn-primary">
              Done
            </button>
          ) : (
            <>
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="flex-1 py-4 rounded-full border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button onClick={nextStep} className="flex-1 btn-primary">
                  Continue
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

