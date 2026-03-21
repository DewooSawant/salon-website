import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiPhone, FiX } from 'react-icons/fi'
import { useCustomer } from '../../context/CustomerContext'
import toast from 'react-hot-toast'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-700',
}

export default function MyBookings() {
  const { api, isAuthenticated, loading: authLoading } = useCustomer()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchBookings()
  }, [authLoading, isAuthenticated, filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = filter ? { status: filter } : {}
      const res = await api.get('/customers/bookings', { params })
      setBookings(res.data.bookings)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    try {
      await api.patch(`/marketplace/bookings/${id}/cancel`, { reason: 'Cancelled by customer' })
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-500 text-sm mb-6">Please login to view your bookings</p>
          <Link to="/login" className="block w-full py-3 bg-gradient-to-r from-brand-600 to-accent-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-600 transition shadow-lg shadow-brand">
            Login with Phone
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/discover" className="text-gray-600 hover:text-gray-900"><FiArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold">My Bookings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === s ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              {s ? s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No bookings yet</h3>
            <Link to="/discover" className="text-brand-600 hover:underline">Find salons near you</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link to={`/salon/${booking.salon_slug}`} className="font-bold text-lg hover:text-brand-600 transition">
                      {booking.salon_name}
                    </Link>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || ''}`}>
                      {booking.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-gray-400">{booking.booking_code}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> {booking.booking_date}</span>
                  <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" /> {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</span>
                  <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5" /> {booking.salon_address}</span>
                  <a href={`tel:${booking.salon_phone}`} className="flex items-center gap-1 text-brand-600"><FiPhone className="w-3.5 h-3.5" /> {booking.salon_phone}</a>
                </div>

                {booking.services && (
                  <div className="text-sm text-gray-500 mb-3">
                    {booking.services.map(s => s.service_name).join(', ')}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-bold text-lg">₹{booking.final_price}</span>
                  {['pending', 'confirmed'].includes(booking.status) && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                    >
                      <FiX className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
