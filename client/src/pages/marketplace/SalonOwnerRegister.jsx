import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiUser, FiLock, FiPhone, FiMapPin, FiScissors, FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function SalonOwnerRegister() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    // Step 1: Owner info
    owner_name: '', password: '', phone: '',
    // Step 2: Salon info
    salon_name: '', type: 'unisex', address: '', city: '', state: '', pincode: '',
    // Step 3: Location & Hours
    latitude: '', longitude: '',
    opening_time: '10:00', closing_time: '21:00',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('latitude', pos.coords.latitude.toFixed(6))
        update('longitude', pos.coords.longitude.toFixed(6))
        toast.success('Location detected!')
      },
      () => toast.error('Could not get location. Please enter manually.')
    )
  }

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      working_days: f.working_days.includes(day)
        ? f.working_days.filter(d => d !== day)
        : [...f.working_days, day]
    }))
  }

  const handleSubmit = async () => {
    const cleanedPhone = form.phone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      toast.error('Enter a valid 10-digit Indian mobile number')
      setStep(1)
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      setStep(1)
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/salon-owner/register`, {
        ...form,
        phone: cleanedPhone,
        salon_phone: cleanedPhone,
        opening_time: form.opening_time + ':00',
        closing_time: form.closing_time + ':00',
      })
      localStorage.setItem('salonOwnerToken', res.data.token)
      localStorage.setItem('salonInfo', JSON.stringify(res.data.salon))
      toast.success('Salon registered successfully! Please login to your dashboard.')
      navigate('/salon-owner/login')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: {
        const p = form.phone.replace(/\D/g, '')
        return form.owner_name && /^[6-9]\d{9}$/.test(p) && form.password.length >= 6
      }
      case 2: return form.salon_name && form.address && form.city
      case 3: return form.latitude && form.longitude
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <FiArrowLeft /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Register Your Salon</h1>
            <p className="text-gray-500 text-sm">Start getting bookings online in minutes</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s ? 'bg-green-500 text-white' :
                  step === s ? 'bg-brand-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <FiCheck className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-8 mb-6 text-xs text-gray-500">
            <span className={step === 1 ? 'text-brand-600 font-semibold' : ''}>Your Info</span>
            <span className={step === 2 ? 'text-brand-600 font-semibold' : ''}>Salon Details</span>
            <span className={step === 3 ? 'text-brand-600 font-semibold' : ''}>Location & Hours</span>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Owner Info */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Your Full Name *" value={form.owner_name}
                    onChange={e => update('owner_name', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" placeholder="Phone Number (10 digits) *" value={form.phone}
                    onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" placeholder="Create Password (min 6 chars) *" value={form.password}
                    onChange={e => update('password', e.target.value)} minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>
                <p className="text-xs text-gray-500">Your phone number will be your login ID. Use a 10-digit Indian mobile number.</p>
              </motion.div>
            )}

            {/* Step 2: Salon Info */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="relative">
                  <FiScissors className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Salon Name *" value={form.salon_name}
                    onChange={e => update('salon_name', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Salon Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['men', 'women', 'unisex'].map(t => (
                      <button key={t} type="button" onClick={() => update('type', t)}
                        className={`py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                          form.type === t ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {t === 'men' ? '👨 Men' : t === 'women' ? '👩 Women' : '👫 Unisex'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3.5 text-gray-400" />
                  <textarea placeholder="Full Address *" value={form.address}
                    onChange={e => update('address', e.target.value)} rows={2}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City *" value={form.city}
                    onChange={e => update('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
                  <input type="text" placeholder="State" value={form.state}
                    onChange={e => update('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
                </div>
                <input type="text" placeholder="Pincode" value={form.pincode}
                  onChange={e => update('pincode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none" />
              </motion.div>
            )}

            {/* Step 3: Location & Hours */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Salon Location *</label>
                  <button type="button" onClick={getLocation}
                    className="w-full py-3 bg-brand-50 text-brand-600 rounded-xl font-medium hover:bg-brand-100 transition flex items-center justify-center gap-2 mb-3">
                    <FiMapPin /> Detect My Location Automatically
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" step="any" placeholder="Latitude *" value={form.latitude}
                      onChange={e => update('latitude', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 outline-none text-sm" />
                    <input type="number" step="any" placeholder="Longitude *" value={form.longitude}
                      onChange={e => update('longitude', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 outline-none text-sm" />
                  </div>
                  {form.latitude && form.longitude && (
                    <p className="text-xs text-green-600 mt-1">Location set: {form.latitude}, {form.longitude}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Working Hours</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Opening Time</label>
                      <input type="time" value={form.opening_time} onChange={e => update('opening_time', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Closing Time</label>
                      <input type="time" value={form.closing_time} onChange={e => update('closing_time', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-500 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {WORKING_DAYS.map(day => (
                      <button key={day} type="button" onClick={() => toggleDay(day)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                          form.working_days.includes(day) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition">
                Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Next <FiArrowRight />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading || !canProceed()}
                className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? 'Creating...' : 'Register Salon'}
              </button>
            )}
          </div>

          {/* What happens next */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">What happens after registration?</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>1. Your salon page goes live immediately</li>
              <li>2. Add your services and pricing from the dashboard</li>
              <li>3. Add your team members / stylists</li>
              <li>4. Customers can find and book you!</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <Link to="/salon-owner/login" className="text-sm text-brand-600 hover:underline">
              Already registered? Login to your dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
