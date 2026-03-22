import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiCalendar, FiDollarSign, FiClock, FiStar, FiMail, FiExternalLink, FiCopy, FiCheck, FiPlus, FiArrowRight } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color, link }) {
  const Wrapper = link ? Link : 'div'
  return (
    <Wrapper to={link} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition group">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </Wrapper>
  )
}

const formatTimeDisplay = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default function SalonOwnerDashboard() {
  const navigate = useNavigate()
  const api = useSalonOwnerApi()
  const [dashboard, setDashboard] = useState(null)
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)
  // Quick walk-in state
  const [services, setServices] = useState([])
  const [stylists, setStylists] = useState([])
  const [quickServices, setQuickServices] = useState([])
  const [quickName, setQuickName] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [quickStylist, setQuickStylist] = useState(null)
  const [quickPayment, setQuickPayment] = useState('cash')
  const [quickBilling, setQuickBilling] = useState(false)
  const [quickSuccess, setQuickSuccess] = useState(null)
  // Customer autocomplete
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeField, setActiveField] = useState(null) // 'name' or 'phone'
  const searchTimer = useRef(null)
  const suggestRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [dashRes, salonRes, svcRes, styRes] = await Promise.all([
        api.get('/salon-owner/dashboard'),
        api.get('/salon-owner/salon'),
        api.get('/salon-owner/services'),
        api.get('/salon-owner/stylists'),
      ])
      setDashboard(dashRes.data)
      setSalon(salonRes.data.salon)
      setServices(svcRes.data.services || [])
      setStylists(styRes.data.stylists || [])
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('salonOwnerToken')
        navigate('/salon-owner/login')
      }
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Customer autocomplete search
  const searchCustomers = useCallback((query) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!query || query.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get('/salon-owner/customers/search', { params: { q: query } })
        setSuggestions(res.data.results || [])
        setShowSuggestions(res.data.results?.length > 0)
      } catch { setSuggestions([]) }
    }, 300)
  }, [api])

  const selectCustomer = (customer) => {
    setQuickName(customer.name)
    setQuickPhone(customer.phone)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const copyLink = () => {
    const url = `${window.location.origin}/salon/${salon?.slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  if (loading) {
    return (
      <SalonOwnerLayout title="Dashboard">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SalonOwnerLayout>
    )
  }

  const stats = dashboard?.stats || {}

  return (
    <SalonOwnerLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiCalendar} label="Today's Bookings" value={stats.today_bookings || 0} color="bg-brand-500" link="/salon-owner/bookings" />
        <StatCard icon={FiClock} label="Pending" value={stats.pending_bookings || 0} color="bg-yellow-500" link="/salon-owner/bookings" />
        <StatCard icon={FiDollarSign} label="Today's Revenue" value={`₹${stats.today_revenue || 0}`} color="bg-green-500" />
        <StatCard icon={FiStar} label="Rating" value={`${stats.avg_rating || 0} / 5`} color="bg-orange-500" link="/salon-owner/reviews" />
      </div>

      {/* Quick Walk-in Widget */}
      {services.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 mb-8 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                <FiPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quick Bill</h2>
                <p className="text-xs text-gray-500">Tap &rarr; Fill &rarr; Bill</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {quickServices.length > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">₹{quickServices.reduce((s, svc) => s + parseFloat(svc.discounted_price || svc.price), 0)}</p>
                  <p className="text-[10px] text-green-600 font-medium">{quickServices.length} service{quickServices.length > 1 ? 's' : ''}</p>
                </div>
              )}
              <Link to="/salon-owner/walkin" className="text-xs text-green-700 font-semibold hover:text-green-800 bg-white/60 px-3 py-1.5 rounded-lg border border-green-200">
                Full POS <FiArrowRight className="w-3 h-3 inline" />
              </Link>
            </div>
          </div>

          {quickSuccess ? (
            <div className="mx-5 mb-5 flex items-center justify-between bg-white rounded-xl p-4 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-800">₹{quickSuccess.final_price} billed!</p>
                  <p className="text-sm text-green-600">{quickSuccess.customer_name} &bull; <span className="font-mono">{quickSuccess.booking_code}</span></p>
                </div>
              </div>
              <button onClick={() => { setQuickSuccess(null); setQuickServices([]); setQuickName(''); setQuickPhone(''); setQuickStylist(null); setQuickPayment('cash') }}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-md shadow-green-200">
                + New Bill
              </button>
            </div>
          ) : (
            <div className="px-5 pb-5">
              {/* Step 1: Services - always visible */}
              <div className="mb-4">
                <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-2">1. Select Services</p>
                <div className="flex flex-wrap gap-1.5">
                  {services.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0)).map(svc => {
                    const selected = quickServices.find(s => s.id === svc.id)
                    return (
                      <button key={svc.id}
                        onClick={() => setQuickServices(prev => selected ? prev.filter(s => s.id !== svc.id) : [...prev, svc])}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          selected
                            ? 'bg-green-600 text-white shadow-md shadow-green-200 scale-[1.02]'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        {svc.icon} {svc.name} <span className={`text-xs ${selected ? 'text-green-100' : 'text-gray-400'}`}>₹{svc.discounted_price || svc.price}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Stylist - show after service selected */}
              {quickServices.length > 0 && stylists.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-2">2. Stylist</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {stylists.filter(s => s.is_active).map(st => (
                      <button key={st.id}
                        onClick={() => setQuickStylist(quickStylist === st.id ? null : st.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                          quickStylist === st.id
                            ? 'bg-green-600 text-white shadow-md shadow-green-200'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-green-300'
                        }`}
                      >
                        <span className="text-base">{st.avatar_emoji || '👤'}</span>
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Customer + Payment + Bill */}
              {quickServices.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-2">{stylists.length > 0 ? '3' : '2'}. Customer & Payment</p>
                  <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm" ref={suggestRef}>
                    {/* Row 1: Name + Phone with autocomplete */}
                    <div className="flex gap-2 mb-3 relative">
                      <div className="flex-1 relative">
                        <input type="text" value={quickName}
                          onChange={e => { setQuickName(e.target.value); setActiveField('name'); searchCustomers(e.target.value) }}
                          onFocus={() => { setActiveField('name'); if (suggestions.length > 0) setShowSuggestions(true) }}
                          placeholder="Customer name *"
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:bg-white text-gray-700 transition" />
                      </div>
                      <div className="w-[160px] relative">
                        <input type="tel" value={quickPhone}
                          onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setQuickPhone(v); setActiveField('phone'); searchCustomers(v) }}
                          onFocus={() => { setActiveField('phone'); if (suggestions.length > 0) setShowSuggestions(true) }}
                          placeholder="Phone"
                          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:bg-white text-gray-700 transition" />
                        {quickPhone.length === 10 && (
                          <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                        )}
                      </div>

                      {/* Autocomplete dropdown */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-green-200 shadow-xl z-20 overflow-hidden">
                          <div className="px-3 py-1.5 bg-green-50 border-b border-green-100">
                            <p className="text-[10px] font-bold text-green-600 uppercase">Returning Customers</p>
                          </div>
                          {suggestions.map((c, i) => (
                            <button key={i} onClick={() => selectCustomer(c)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-green-50 transition text-left border-b border-gray-50 last:border-0">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 shrink-0">
                                {c.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                                <p className="text-xs text-gray-500">{c.phone}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-green-600">{c.visits} visits</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Row 2: Payment + Bill */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[{v:'cash',l:'💵',t:'Cash'},{v:'upi',l:'📱',t:'UPI'},{v:'card',l:'💳',t:'Card'}].map(p => (
                          <button key={p.v} onClick={() => setQuickPayment(p.v)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                              quickPayment === p.v
                                ? 'bg-green-100 border-2 border-green-400 text-green-700'
                                : 'bg-gray-50 border-2 border-gray-100 text-gray-500 hover:border-green-200'
                            }`}>
                            {p.l} <span className="hidden sm:inline">{p.t}</span>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={async () => {
                          if (!quickName.trim()) { toast.error('Enter customer name'); return }
                          setQuickBilling(true)
                          try {
                            const res = await api.post('/salon-owner/walkin', {
                              customer_name: quickName.trim(),
                              customer_phone: quickPhone.trim() || undefined,
                              stylist_id: quickStylist || undefined,
                              services: quickServices.map(s => s.id),
                              payment_method: quickPayment,
                            })
                            setQuickSuccess(res.data.booking)
                            toast.success(`Billed ₹${res.data.booking.final_price}!`)
                            fetchData()
                          } catch (err) {
                            toast.error(err.response?.data?.error || 'Failed')
                          } finally { setQuickBilling(false) }
                        }}
                        disabled={quickBilling}
                        className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 shadow-md shadow-green-200 whitespace-nowrap"
                      >
                        {quickBilling ? (
                          <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          `Bill ₹${quickServices.reduce((s, svc) => s + parseFloat(svc.discounted_price || svc.price), 0)}`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
          <Link to="/salon-owner/bookings" className="text-sm text-brand-600 font-medium hover:text-brand-700">View All</Link>
        </div>

        {dashboard?.recent_bookings?.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recent_bookings.slice(0, 5).map(b => (
                    <tr key={b.id} className="border-t border-gray-50 text-sm hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-sm font-bold text-brand-600">{b.booking_code}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{b.customer_name}</td>
                      <td className="px-4 py-3 text-gray-600">{b.booking_date}</td>
                      <td className="px-4 py-3 text-gray-600">{formatTimeDisplay(b.start_time?.slice(0, 5))}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">₹{b.final_price}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          b.status === 'completed' ? 'bg-green-100 text-green-700' :
                          b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600 mb-1">No bookings yet</h3>
            <p className="text-sm text-gray-400">Bookings will appear here once customers start booking</p>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₹{stats.month_revenue || 0}</p>
          <p className="text-sm text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Unread Messages</h3>
          <p className="text-3xl font-bold text-brand-600">{stats.unread_messages || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Customer inquiries</p>
        </div>
      </div>

      {/* Salon URL */}
      {salon?.slug && (
        <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
          <h3 className="font-semibold text-purple-800 mb-2">Your Salon Page</h3>
          <p className="text-sm text-brand-600 mb-3">Share this link with your customers:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white px-4 py-2.5 rounded-xl text-brand-700 border border-brand-200 truncate">
              {window.location.origin}/salon/{salon.slug}
            </code>
            <button onClick={copyLink} className="p-2.5 bg-white border border-brand-200 rounded-xl text-brand-600 hover:bg-brand-100 transition" title="Copy link">
              <FiCopy className="w-4 h-4" />
            </button>
            <Link to={`/salon/${salon.slug}`} target="_blank" className="p-2.5 bg-white border border-brand-200 rounded-xl text-brand-600 hover:bg-brand-100 transition" title="Open page">
              <FiExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </SalonOwnerLayout>
  )
}
