import { useState, useEffect } from 'react'
import { FiCalendar, FiClock, FiPhone, FiFilter, FiChevronDown } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-brand-100 text-brand-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-700',
}

const statusActions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed'],
}

const formatTimeDisplay = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default function SalonOwnerBookings() {
  const api = useSalonOwnerApi()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => { fetchBookings() }, [statusFilter, dateFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (dateFilter) params.date = dateFilter
      const res = await api.get('/salon-owner/bookings', { params })
      setBookings(res.data.bookings)
    } catch { toast.error('Failed to load bookings') }
    finally { setLoading(false) }
  }

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await api.patch(`/salon-owner/bookings/${bookingId}/status`, { status: newStatus })
      toast.success(`Booking ${newStatus}`)
      fetchBookings()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update status') }
  }

  return (
    <SalonOwnerLayout title="Bookings">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-700 outline-none focus:border-brand-400 cursor-pointer">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-700 outline-none focus:border-brand-400" />
        {(statusFilter || dateFilter) && (
          <button onClick={() => { setStatusFilter(''); setDateFilter('') }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50 transition">
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No bookings found</h3>
          <p className="text-gray-500">{statusFilter || dateFilter ? 'Try adjusting your filters' : 'Bookings will appear here once customers start booking'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} onUpdateStatus={updateStatus} />
          ))}
        </div>
      )}
    </SalonOwnerLayout>
  )
}

function BookingCard({ booking, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false)
  const actions = statusActions[booking.status] || []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition">
      <div className="p-4 sm:p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm font-bold text-brand-600">{booking.booking_code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                {booking.status?.replace('_', ' ')}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{booking.customer_name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <FiCalendar className="w-3.5 h-3.5" /> {booking.booking_date}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5" /> {formatTimeDisplay(booking.start_time?.slice(0, 5))}
              </span>
              {booking.customer_phone && (
                <a href={`tel:${booking.customer_phone}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                  <FiPhone className="w-3.5 h-3.5" /> {booking.customer_phone}
                </a>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-gray-900">₹{booking.final_price}</p>
            {booking.stylist_name && <p className="text-xs text-gray-500">{booking.stylist_name}</p>}
          </div>
        </div>

        {/* Services summary */}
        {booking.services?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {booking.services.map((s, i) => (
              <span key={i} className="px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                {s.service_name || s.name} &bull; ₹{s.price}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Actions */}
      {expanded && actions.length > 0 && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex flex-wrap gap-2 border-t border-gray-50 pt-3">
          {actions.map(status => (
            <button
              key={status}
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(booking.id, status) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                status === 'cancelled' || status === 'no_show'
                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {status === 'confirmed' ? 'Confirm' : status === 'in_progress' ? 'Start Service' : status === 'completed' ? 'Mark Complete' : status === 'cancelled' ? 'Cancel' : 'No Show'}
            </button>
          ))}
        </div>
      )}

      {booking.notes && expanded && (
        <div className="px-4 sm:px-5 pb-4 text-sm text-gray-500 italic">
          Note: {booking.notes}
        </div>
      )}
    </div>
  )
}
