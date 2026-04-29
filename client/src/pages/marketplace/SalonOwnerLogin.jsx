import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiScissors, FiLock } from 'react-icons/fi'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function SalonOwnerLogin() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('salonOwnerToken')) navigate('/salon-owner/dashboard')
  }, [])

  const handleLogin = async (e) => {
    e?.preventDefault()
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length !== 10 || !/^[6-9]/.test(cleaned)) {
      toast.error('Enter a valid 10-digit mobile number')
      return
    }
    if (!password) {
      toast.error('Enter your password')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/salon-owner/login`, { phone: cleaned, password })
      localStorage.setItem('salonOwnerToken', res.data.token)
      localStorage.setItem('salonInfo', JSON.stringify(res.data.salon))
      toast.success(`Welcome, ${res.data.user.name}!`)
      navigate('/salon-owner/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <FiArrowLeft /> Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiScissors className="w-7 h-7 text-brand-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Salon Owner Login</h1>
              <p className="text-gray-500 text-sm">Sign in to manage your salon</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Phone Number</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-3.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 border border-gray-200">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    maxLength={10}
                    autoFocus
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl text-lg font-medium tracking-wider outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 text-gray-800"
                  />
                </div>
              </div>

              <div className="mb-6 relative">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 text-gray-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10 || !password}
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-600 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <>Login <FiArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <Link to="/salon-owner/register" className="block text-sm text-brand-600 hover:underline font-medium">
                Don't have a salon? Register for free
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
