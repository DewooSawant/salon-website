import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCalendar, FiClock, FiUser, FiPhone, FiCheck, FiX, 
  FiMessageCircle, FiFilter, FiSearch, FiExternalLink
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Bookings() {
  const { api } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    search: ''
  })

  useEffect(() => {
    fetchBookings()
  }, [filters.date, filters.status])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.date) params.append('date', filters.date)
      if (filters.status) params.append('status', filters.status)
      
      const response = await api.get(`/bookings?${params}`)
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (bookingId, status) => {
    try {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status })
      
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status } : b
      ))
      
      toast.success(`Booking ${status}`)

      // Show WhatsApp notification link if available
      if (response.data.notifications?.customerWhatsAppLink) {
        toast((t) => (
          <div className="flex items-center gap-3">
            <span>Send WhatsApp notification?</span>
            <a
              href={response.data.notifications.customerWhatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-green-500 text-white rounded-full text-sm"
            >
              Send
            </a>
          </div>
        ), { duration: 10000 })
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      no_show: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return colors[status] || colors.pending
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const filteredBookings = bookings.filter(booking => {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        booking.customer_name.toLowerCase().includes(search) ||
        booking.customer_phone.includes(search) ||
        booking.booking_code.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <AdminLayout title="Bookings">
      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or code..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-white/10 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>
          
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            className="px-4 py-2 bg-dark-800 border border-white/10 rounded-lg
                     text-white focus:outline-none focus:border-gold-500/50"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 bg-dark-800 border border-white/10 rounded-lg
                     text-white focus:outline-none focus:border-gold-500/50"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => setFilters({ date: '', status: '', search: '' })}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FiCalendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Booking</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Customer</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Date & Time</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Services</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Amount</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-gold-400">{booking.booking_code}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white font-medium">{booking.customer_name}</p>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <FiPhone size={12} />
                          {booking.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white">{formatDate(booking.booking_date)}</p>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <FiClock size={12} />
                          {formatTime(booking.start_time)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-[200px]">
                        {booking.services?.slice(0, 2).map((s, i) => (
                          <span key={i} className="text-gray-300 text-sm">
                            {s.service_name}{i < Math.min(booking.services.length, 2) - 1 && ', '}
                          </span>
                        ))}
                        {booking.services?.length > 2 && (
                          <span className="text-gray-500 text-sm"> +{booking.services.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-semibold">₹{booking.final_price}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                              title="Confirm"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              title="Cancel"
                            >
                              <FiX size={16} />
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(booking.id, 'completed')}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            title="Mark Completed"
                          >
                            <FiCheck size={16} />
                          </button>
                        )}
                        <a
                          href={`https://wa.me/${booking.customer_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          title="WhatsApp"
                        >
                          <FiMessageCircle size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

