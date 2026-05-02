import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiUser, FiLock, FiPhone, FiMapPin, FiScissors, FiArrowLeft, FiArrowRight, FiCheck, FiAlertCircle } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Indian mobile: starts with 6-9, 10 digits
const PHONE_RE = /^[6-9]\d{9}$/
const phoneIsValid = (p) => PHONE_RE.test(p.replace(/\D/g, ''))

export default function SalonOwnerRegister() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    // Step 1: Owner
    owner_name: '',
    phone: '',
    password: '',
    // Step 2: Salon
    salon_name: '',
    type: 'unisex',
    address: '',
    city: '',
  })
  const [touched, setTouched] = useState({})

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const markTouched = (field) => setTouched(t => ({ ...t, [field]: true }))

  // Per-step validity + friendly error text for the Next button tooltip/explainer
  const stepValidation = () => {
    if (step === 1) {
      if (!form.owner_name.trim()) return 'Enter your full name'
      if (!phoneIsValid(form.phone)) return 'Enter a valid 10-digit Indian mobile number (starts with 6-9)'
      if (form.password.length < 6) return 'Password must be at least 6 characters'
      return null
    }
    if (step === 2) {
      if (!form.salon_name.trim()) return 'Enter your salon name'
      if (!form.address.trim()) return 'Enter your salon address'
      if (!form.city.trim()) return 'Enter your city'
      return null
    }
    return null
  }
  const stepError = stepValidation()
  const canProceed = !stepError

  const tryNext = () => {
    if (!canProceed) {
      // Mark all fields on this step as touched so inline errors show
      const fields = step === 1 ? ['owner_name', 'phone', 'password'] : ['salon_name', 'address', 'city']
      setTouched(t => ({ ...t, ...Object.fromEntries(fields.map(f => [f, true])) }))
      toast.error(stepError)
      return
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/salon-owner/register`, {
        owner_name: form.owner_name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        password: form.password,
        salon_name: form.salon_name.trim(),
        type: form.type,
        address: form.address.trim(),
        city: form.city.trim(),
        salon_phone: form.phone.replace(/\D/g, ''),
      })
      localStorage.setItem('salonOwnerToken', res.data.token)
      localStorage.setItem('salonInfo', JSON.stringify(res.data.salon))
      toast.success('Salon registered! Welcome to Stylo.')
      navigate('/salon-owner/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  // ===== Per-field validation helpers =====
  const nameError = touched.owner_name && !form.owner_name.trim() ? 'Enter your full name' : null
  const phoneDigits = form.phone.replace(/\D/g, '')
  const phoneError = touched.phone && phoneDigits.length === 0
    ? 'Enter your phone number'
    : touched.phone && phoneDigits.length < 10
      ? `${10 - phoneDigits.length} more digit${10 - phoneDigits.length === 1 ? '' : 's'} needed`
      : touched.phone && !phoneIsValid(form.phone)
        ? 'Indian mobile numbers start with 6, 7, 8, or 9'
        : null
  const phoneOk = phoneIsValid(form.phone)
  const passwordError = touched.password && form.password.length === 0
    ? 'Create a password'
    : touched.password && form.password.length < 6
      ? `${6 - form.password.length} more character${6 - form.password.length === 1 ? '' : 's'} needed`
      : null
  const passwordOk = form.password.length >= 6
  const salonNameError = touched.salon_name && !form.salon_name.trim() ? 'Enter your salon name' : null
  const addressError = touched.address && !form.address.trim() ? 'Enter the salon address' : null
  const cityError = touched.city && !form.city.trim() ? 'Enter the city' : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <FiArrowLeft /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Register your salon</h1>
            <p className="text-gray-500 text-sm">Free, forever. Takes under a minute.</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-6">
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

          <div className="flex items-center justify-center gap-6 sm:gap-8 mb-6 text-xs text-gray-500">
            <span className={step === 1 ? 'text-brand-600 font-semibold' : ''}>You</span>
            <span className={step === 2 ? 'text-brand-600 font-semibold' : ''}>Salon</span>
            <span className={step === 3 ? 'text-brand-600 font-semibold' : ''}>Review</span>
          </div>

          <AnimatePresence mode="wait">
            {/* ============ STEP 1 — Owner ============ */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Name */}
                <FieldWrap error={nameError}>
                  <FiUser className="field-icon" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.owner_name}
                    onChange={e => update('owner_name', e.target.value)}
                    onBlur={() => markTouched('owner_name')}
                    className={`field-input ${nameError ? 'field-error' : ''}`}
                    autoFocus
                  />
                </FieldWrap>

                {/* Phone */}
                <div>
                  <FieldWrap error={phoneError}>
                    <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pr-2 border-r border-gray-200 text-gray-500 text-sm font-medium pointer-events-none">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={() => markTouched('phone')}
                      maxLength={10}
                      className={`w-full pl-20 pr-10 py-3 border rounded-xl focus:ring-2 outline-none transition ${
                        phoneError
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 focus:border-brand-500 focus:ring-brand-200'
                      }`}
                    />
                    {phoneOk && <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />}
                  </FieldWrap>
                  {!phoneError && (
                    <p className="text-xs text-gray-400 mt-1 ml-1">You'll use this to log in.</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <FieldWrap error={passwordError}>
                    <FiLock className="field-icon" />
                    <input
                      type="password"
                      placeholder="Create password"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      onBlur={() => markTouched('password')}
                      minLength={6}
                      className={`field-input ${passwordError ? 'field-error' : ''} pr-10`}
                    />
                    {passwordOk && <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />}
                  </FieldWrap>
                  {!passwordError && (
                    <p className="text-xs text-gray-400 mt-1 ml-1">Minimum 6 characters.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ============ STEP 2 — Salon ============ */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Salon name */}
                <FieldWrap error={salonNameError}>
                  <FiScissors className="field-icon" />
                  <input
                    type="text"
                    placeholder="Salon name"
                    value={form.salon_name}
                    onChange={e => update('salon_name', e.target.value)}
                    onBlur={() => markTouched('salon_name')}
                    className={`field-input ${salonNameError ? 'field-error' : ''}`}
                    autoFocus
                  />
                </FieldWrap>

                {/* Salon type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Salon type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['men', 'women', 'unisex'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update('type', t)}
                        className={`py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                          form.type === t
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {t === 'men' ? '👨 Men' : t === 'women' ? '👩 Women' : '👫 Unisex'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Address */}
                <FieldWrap error={addressError}>
                  <FiMapPin className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" />
                  <textarea
                    placeholder="Shop address (e.g. Shop 5, Lane 7, Koregaon Park)"
                    value={form.address}
                    onChange={e => update('address', e.target.value)}
                    onBlur={() => markTouched('address')}
                    rows={2}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 outline-none resize-none transition ${
                      addressError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-brand-500 focus:ring-brand-200'
                    }`}
                  />
                </FieldWrap>

                {/* City */}
                <FieldWrap error={cityError}>
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={e => update('city', e.target.value)}
                    onBlur={() => markTouched('city')}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition ${
                      cityError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-brand-500 focus:ring-brand-200'
                    }`}
                  />
                </FieldWrap>

                <p className="text-xs text-gray-400 mt-1">You can add hours, working days, and pin your exact location on a map later from your dashboard.</p>
              </motion.div>
            )}

            {/* ============ STEP 3 — Review ============ */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="bg-brand-50 rounded-2xl p-4 space-y-2 border border-brand-100">
                  <div className="flex items-start gap-3">
                    <FiUser className="w-4 h-4 text-brand-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Owner</p>
                      <p className="text-sm font-semibold text-gray-900">{form.owner_name}</p>
                      <p className="text-xs text-gray-600">+91 {form.phone}</p>
                    </div>
                  </div>
                  <div className="border-t border-brand-100" />
                  <div className="flex items-start gap-3">
                    <FiScissors className="w-4 h-4 text-brand-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Salon</p>
                      <p className="text-sm font-semibold text-gray-900">{form.salon_name}</p>
                      <p className="text-xs text-gray-600 capitalize">{form.type} salon</p>
                    </div>
                  </div>
                  <div className="border-t border-brand-100" />
                  <div className="flex items-start gap-3">
                    <FiMapPin className="w-4 h-4 text-brand-600 mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Location</p>
                      <p className="text-sm text-gray-700">{form.address}</p>
                      <p className="text-xs text-gray-600">{form.city}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex items-start gap-2">
                  <FiCheck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-700 leading-relaxed">
                    Your salon page goes live instantly. Add services, staff, working hours, and pin your exact location on a map anytime from your dashboard.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Helper below field group (step 1 / 2) */}
          {stepError && step < 3 && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
              <FiAlertCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>{stepError}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={tryNext}
                className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  canProceed
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-500/30'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating…' : 'Create my salon'} {!loading && <FiArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/salon-owner/login" className="text-sm text-brand-600 hover:underline">
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>

      {/* Small utility classes (Tailwind @apply alternative via inline style element kept out — use actual classes in components) */}
      <style>{`
        .field-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .field-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; outline: none; transition: all 0.15s; }
        .field-input:focus { border-color: #9333ea; box-shadow: 0 0 0 2px rgba(147,51,234,0.15); }
        .field-input.field-error { border-color: #fca5a5; }
        .field-input.field-error:focus { border-color: #f87171; box-shadow: 0 0 0 2px rgba(248,113,113,0.15); }
      `}</style>
    </div>
  )
}

function FieldWrap({ children, error }) {
  return (
    <div>
      <div className="relative">{children}</div>
      {error && (
        <p className="text-xs text-red-500 mt-1 ml-1 flex items-center gap-1">
          <FiAlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}
