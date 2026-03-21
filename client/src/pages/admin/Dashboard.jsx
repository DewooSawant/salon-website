import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiCalendar, FiClock, FiDollarSign, FiMessageSquare, FiArrowRight } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Dashboard() {
  const { api } = useAuth()
  const [stats, setStats] = useState({
    todayBookings: 0,
    pendingBookings: 0,
    monthRevenue: 0,
    unreadMessages: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data.stats)
      setRecentBookings(response.data.recentBookings)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      label: "Today's Bookings", 
      value: stats.todayBookings, 
      icon: FiCalendar,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Pending Confirmation', 
      value: stats.pendingBookings, 
      icon: FiClock,
      color: 'from-amber-500 to-amber-600'
    },
    { 
      label: 'This Month Revenue', 
      value: `₹${stats.monthRevenue?.toLocaleString() || 0}`, 
      icon: FiDollarSign,
      color: 'from-green-500 to-green-600'
    },
    { 
      label: 'Unread Messages', 
      value: stats.unreadMessages, 
      icon: FiMessageSquare,
      color: 'from-purple-500 to-purple-600'
    },
  ]

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-500/20 text-amber-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-purple-500/20 text-purple-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      no_show: 'bg-gray-500/20 text-gray-400'
    }
    return colors[status] || colors.pending
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
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

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {loading ? '...' : stat.value}
            </h3>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Bookings</h2>
          <a 
            href="/admin/bookings"
            className="text-gold-400 hover:text-gold-300 text-sm flex items-center gap-1 transition-colors"
          >
            View All <FiArrowRight />
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No bookings yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Services</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{booking.customer_name}</p>
                        <p className="text-gray-400 text-sm">{booking.customer_phone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {formatDate(booking.booking_date)}
                    </td>
                    <td className="py-4 px-4 text-gray-300">
                      {formatTime(booking.start_time)}
                    </td>
                    <td className="py-4 px-4 text-gray-300 max-w-[200px] truncate">
                      {booking.services?.map(s => s.service_name).join(', ') || '-'}
                    </td>
                    <td className="py-4 px-4 text-white font-medium">
                      ₹{booking.final_price}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  )
}

