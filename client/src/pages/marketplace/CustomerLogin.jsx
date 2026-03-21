import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPhone, FiArrowLeft, FiArrowRight, FiShield, FiCheck } from 'react-icons/fi'
import { useCustomer } from '../../context/CustomerContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const { isAuthenticated } = useCustomer()
  const [step, setStep] = useState(1) // 1=phone, 2=otp, 3=name(new user)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef([])

  useEffect(() => { if (isAuthenticated) navigate('/discover') }, [isAuthenticated])
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length !== 10) { toast.error('Enter a valid 10-digit number'); return }
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/otp/send`, { phone: cleaned, role: 'customer' })
      toast.success(res.data.message)
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp)
        toast(`Dev OTP: ${res.data.dev_otp}`, { icon: '🔑', duration: 10000 })
      }
      setStep(2)
      setCountdown(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    if (newOtp.every(d => d) && newOtp.join('').length === 6) handleVerifyOTP(newOtp.join(''))
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) { setOtp(pasted.split('')); handleVerifyOTP(pasted) }
  }

  const handleVerifyOTP = async (otpValue) => {
    const otpStr = otpValue || otp.join('')
    if (otpStr.length !== 6) { toast.error('Enter the 6-digit OTP'); return }
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/otp/verify/customer`, {
        phone: phone.replace(/\D/g, ''), otp: otpStr, name: name || undefined,
      })
      localStorage.setItem('customerToken', res.data.token)
      if (res.data.is_new_user) {
        toast.success('Welcome! Account created.')
        setStep(3)
      } else {
        toast.success(`Welcome back, ${res.data.user.name}!`)
        window.location.href = '/discover'
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleSetName = () => { window.location.href = '/discover' }
  const handleResendOTP = () => { if (countdown <= 0) { setOtp(['','','','','','']); handleSendOTP() } }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <FiArrowLeft /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Phone */}
            {step === 1 && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiPhone className="w-7 h-7 text-brand-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to SalonNear</h1>
                  <p className="text-gray-500 text-sm">Enter your phone number to continue</p>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-3.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 border border-gray-200">+91</span>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210" maxLength={10} autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                      className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl text-lg font-medium tracking-wider outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 text-gray-800" />
                  </div>
                </div>

                <button onClick={handleSendOTP} disabled={loading || phone.replace(/\D/g, '').length !== 10}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <>Send OTP <FiArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">New users are auto-registered. No password needed.</p>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <Link to="/salon-owner/login" className="text-sm text-brand-600 hover:underline font-medium">Salon Owner? Login here</Link>
                </div>
              </motion.div>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiShield className="w-7 h-7 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Verify OTP</h1>
                  <p className="text-gray-500 text-sm">
                    Code sent to <span className="font-semibold text-gray-700">+91 {phone}</span>
                  </p>
                  <button onClick={() => { setStep(1); setOtp(['','','','','','']) }} className="text-brand-600 text-sm font-medium mt-1 hover:underline">Change</button>
                </div>

                <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric"
                      value={digit} onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      maxLength={1} className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                        digit ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-800 focus:border-brand-400'
                      }`} />
                  ))}
                </div>

                {devOtp && (
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <p className="text-xs text-amber-600">Dev Mode OTP: <span className="font-mono font-bold text-amber-800">{devOtp}</span></p>
                  </div>
                )}

                <button onClick={() => handleVerifyOTP()} disabled={loading || otp.join('').length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <>Verify <FiCheck className="w-4 h-4" /></>}
                </button>

                <div className="text-center mt-4">
                  {countdown > 0 ? <p className="text-sm text-gray-400">Resend in {countdown}s</p>
                    : <button onClick={handleResendOTP} className="text-sm text-brand-600 font-medium hover:underline">Resend OTP</button>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Name (new user) */}
            {step === 3 && (
              <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome!</h1>
                  <p className="text-gray-500 text-sm">What should we call you?</p>
                </div>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  autoFocus onKeyDown={e => e.key === 'Enter' && handleSetName()}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-lg outline-none focus:border-brand-400 mb-4 text-gray-800" />
                <button onClick={handleSetName} className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold shadow-lg shadow-brand">
                  Let's Go!
                </button>
                <button onClick={handleSetName} className="w-full py-3 text-gray-400 text-sm mt-1">Skip for now</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
