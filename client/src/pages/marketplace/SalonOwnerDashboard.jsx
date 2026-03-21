import { useState, useEffect } from 'react'
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
  const [quickServices, setQuickServices] = useState([])
  const [quickName, setQuickName] = useState('')
  const [quickPayment, setQuickPayment] = useState('cash')
  const [quickBilling, setQuickBilling] = useState(false)
  const [quickSuccess, setQuickSuccess] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [dashRes, salonRes, svcRes] = await Promise.all([
        api.get('/salon-owner/dashboard'),
        api.get('/salon-owner/salon'),
        api.get('/salon-owner/services'),
      ])
      setDashboard(dashRes.data)
      setSalon(salonRes.data.salon)
      setServices(svcRes.data.services || [])
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
        <div className="bg-white rounded-2xl border-2 border-green-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quick Walk-in Bill</h2>
              <p className="text-sm text-gray-500">Tap services, enter name, bill in seconds</p>
            </div>
            <Link to="/salon-owner/walkin" className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
              Full POS <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {quickSuccess ? (
            <div className="flex items-center justify-between bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800">₹{quickSuccess.final_price} billed!</p>
                  <p className="text-sm text-green-600">{quickSuccess.customer_name} &bull; {quickSuccess.booking_code}</p>
                </div>
              </div>
              <button onClick={() => { setQuickSuccess(null); setQuickServices([]); setQuickName(''); setQuickPayment('cash') }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
                New Bill
              </button>
            </div>
          ) : (
            <>
              {/* Service Quick Select - show popular first, then all */}
              <div className="flex flex-wrap gap-2 mb-4">
                {services.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0)).slice(0, 10).map(svc => {
                  const selected = quickServices.find(s => s.id === svc.id)
                  return (
                    <button key={svc.id}
                      onClick={() => setQuickServices(prev => selected ? prev.filter(s => s.id !== svc.id) : [...prev, svc])}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                        selected
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-100 text-gray-700 hover:border-green-200'
                      }`}
                    >
                      {selected && <FiCheck className="w-3 h-3 inline mr-1" />}
                      {svc.icon} {svc.name} <span className="text-xs opacity-60">₹{svc.discounted_price || svc.price}</span>
                    </button>
                  )
                })}
              </div>

              {quickServices.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Customer Name */}
                  <input type="text" value={quickName} onChange={e => setQuickName(e.target.value)}
                    placeholder="Customer name" className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 text-gray-700" />

                  {/* Payment pills */}
                  <div className="flex gap-1">
                    {[{v:'cash',l:'💵'},{v:'upi',l:'📱'},{v:'card',l:'💳'}].map(p => (
                      <button key={p.v} onClick={() => setQuickPayment(p.v)}
                        className={`px-3 py-2.5 rounded-xl text-sm transition ${quickPayment === p.v ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-50 border-2 border-gray-100'}`}>
                        {p.l}
                      </button>
                    ))}
                  </div>

                  {/* Total + Bill button */}
                  <button
                    onClick={async () => {
                      if (!quickName.trim()) { toast.error('Enter customer name'); return }
                      setQuickBilling(true)
                      try {
                        const res = await api.post('/salon-owner/walkin', {
                          customer_name: quickName.trim(),
                          services: quickServices.map(s => s.id),
                          payment_method: quickPayment,
                        })
                        setQuickSuccess(res.data.booking)
                        toast.success(`Billed ₹${res.data.booking.final_price}!`)
                        fetchData() // Refresh dashboard stats
                      } catch (err) {
                        toast.error(err.response?.data?.error || 'Failed')
                      } finally { setQuickBilling(false) }
                    }}
                    disabled={quickBilling}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {quickBilling ? '...' : `Bill ₹${quickServices.reduce((s, svc) => s + parseFloat(svc.discounted_price || svc.price), 0)}`}
                  </button>
                </div>
              )}
            </>
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
