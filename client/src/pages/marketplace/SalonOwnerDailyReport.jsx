import { useState, useEffect } from 'react'
import { FiCalendar, FiDollarSign, FiUsers, FiTrendingUp, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const formatTimeDisplay = (time) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default function SalonOwnerDailyReport() {
  const api = useSalonOwnerApi()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReport() }, [date])

  const fetchReport = async () => {
    setLoading(true)
    try {
      // Use /today endpoint for today, /bookings for other dates
      const isToday = date === new Date().toISOString().split('T')[0]
      if (isToday) {
        const res = await api.get('/salon-owner/today')
        setData(res.data)
      } else {
        // For past dates, fetch bookings for that date
        const res = await api.get('/salon-owner/bookings', { params: { date, limit: 200 } })
        const bookings = res.data.bookings || []
        const completed = bookings.filter(b => b.status === 'completed')

        setData({
          bookings,
          queue: {
            waiting: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
            in_progress: bookings.filter(b => b.status === 'in_progress').length,
            completed: completed.length,
          },
          revenue: {
            total: completed.reduce((s, b) => s + parseFloat(b.final_price || 0), 0),
            cash: completed.filter(b => b.payment_method === 'cash').reduce((s, b) => s + parseFloat(b.final_price || 0), 0),
            upi: completed.filter(b => b.payment_method === 'upi').reduce((s, b) => s + parseFloat(b.final_price || 0), 0),
            card: completed.filter(b => b.payment_method === 'card').reduce((s, b) => s + parseFloat(b.final_price || 0), 0),
          },
          counts: {
            walkin: completed.filter(b => b.booking_code?.startsWith('WI')).length,
            online: completed.filter(b => !b.booking_code?.startsWith('WI')).length,
            total: completed.length,
          },
          stylists: [],
        })
      }
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  const navigateDate = (dir) => {
    const d = new Date(date)
    d.setDate(d.getDate() + dir)
    const today = new Date().toISOString().split('T')[0]
    if (d.toISOString().split('T')[0] <= today) {
      setDate(d.toISOString().split('T')[0])
    }
  }

  const isToday = date === new Date().toISOString().split('T')[0]

  // Service popularity from bookings
  const serviceCount = {}
  if (data?.bookings) {
    for (const b of data.bookings) {
      if (b.status === 'completed' && b.services) {
        for (const s of b.services) {
          const name = s.service_name || s.name
          serviceCount[name] = (serviceCount[name] || 0) + 1
        }
      }
    }
  }
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Stylist performance
  const stylistPerf = {}
  if (data?.bookings) {
    for (const b of data.bookings.filter(b => b.status === 'completed')) {
      const name = b.stylist_name || 'Unassigned'
      if (!stylistPerf[name]) stylistPerf[name] = { count: 0, revenue: 0 }
      stylistPerf[name].count++
      stylistPerf[name].revenue += parseFloat(b.final_price || 0)
    }
  }
  const topStylists = Object.entries(stylistPerf).sort((a, b) => b[1].revenue - a[1].revenue)

  // Hourly breakdown
  const hourlyMap = {}
  if (data?.bookings) {
    for (const b of data.bookings.filter(b => b.status === 'completed')) {
      const h = parseInt(b.start_time?.split(':')[0] || '0')
      hourlyMap[h] = (hourlyMap[h] || 0) + 1
    }
  }
  const peakHour = Object.entries(hourlyMap).sort((a, b) => b[1] - a[1])[0]

  return (
    <SalonOwnerLayout title="Daily Register">
      {/* Date Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <FiChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-purple-500" />
          <input type="date" value={date} max={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-brand-400 text-gray-700" />
          {isToday && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">Today</span>}
        </div>
        <button onClick={() => navigateDate(1)} disabled={isToday}
          className="p-2 hover:bg-gray-100 rounded-xl transition disabled:opacity-30">
          <FiChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        {!isToday && (
          <button onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="text-sm text-brand-600 font-medium hover:text-brand-700">Go to Today</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No data for this date</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Total Revenue" value={`₹${data.revenue?.total || 0}`} icon="💰" color="bg-green-50 border-green-200" valueColor="text-green-700" />
            <StatBox label="Total Bookings" value={data.queue?.completed || 0} icon="📋" color="bg-brand-50 border-purple-200" valueColor="text-brand-700" />
            <StatBox label="Walk-ins" value={data.counts?.walkin || 0} icon="🚶" color="bg-blue-50 border-blue-200" valueColor="text-blue-700" />
            <StatBox label="Online Bookings" value={data.counts?.online || 0} icon="🌐" color="bg-amber-50 border-amber-200" valueColor="text-amber-700" />
          </div>

          {/* Payment Method Breakdown */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Payment Breakdown</h3>
              <div className="space-y-3">
                <PaymentRow label="Cash" icon="💵" amount={data.revenue?.cash || 0} total={data.revenue?.total || 1} color="bg-green-500" />
                <PaymentRow label="UPI" icon="📱" amount={data.revenue?.upi || 0} total={data.revenue?.total || 1} color="bg-blue-500" />
                <PaymentRow label="Card" icon="💳" amount={data.revenue?.card || 0} total={data.revenue?.total || 1} color="bg-brand-500" />
              </div>
            </div>

            {/* Top Services */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Popular Services</h3>
              {topServices.length > 0 ? (
                <div className="space-y-2.5">
                  {topServices.map(([name, count], i) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">{i + 1}</span>
                        <span className="text-sm text-gray-700">{name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No services data</p>
              )}
            </div>

            {/* Stylist Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Stylist Performance</h3>
              {topStylists.length > 0 ? (
                <div className="space-y-3">
                  {topStylists.map(([name, perf]) => (
                    <div key={name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500">{perf.count} booking{perf.count > 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600">₹{perf.revenue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No stylist data</p>
              )}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Quick Insights</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Avg Bill Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{(data.queue?.completed || 0) > 0 ? Math.round((data.revenue?.total || 0) / data.queue.completed) : 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Peak Hour</p>
                <p className="text-2xl font-bold text-gray-900">
                  {peakHour ? formatTimeDisplay(`${peakHour[0]}:00`) : 'N/A'}
                </p>
                {peakHour && <p className="text-xs text-gray-400">{peakHour[1]} bookings</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Walk-in %</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(data.counts?.total || 0) > 0 ? Math.round(((data.counts?.walkin || 0) / data.counts.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Log */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Transaction Log</h3>
            </div>
            {(data.bookings?.filter(b => b.status === 'completed') || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Services</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.filter(b => b.status === 'completed').map(b => (
                      <tr key={b.id} className="border-t border-gray-50 text-sm hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`font-mono font-bold ${b.booking_code?.startsWith('WI') ? 'text-blue-600' : 'text-brand-600'}`}>
                            {b.booking_code}
                          </span>
                          {b.booking_code?.startsWith('WI') && (
                            <span className="ml-1.5 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Walk-in</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{b.customer_name}</td>
                        <td className="px-4 py-3 text-gray-600">{formatTimeDisplay(b.start_time?.slice(0, 5))}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {b.services?.map(s => s.service_name || s.name).join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            b.payment_method === 'cash' ? 'bg-green-50 text-green-700' :
                            b.payment_method === 'upi' ? 'bg-blue-50 text-blue-700' :
                            'bg-brand-50 text-brand-700'
                          }`}>
                            {b.payment_method === 'cash' ? '💵' : b.payment_method === 'upi' ? '📱' : '💳'} {b.payment_method?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹{b.final_price}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={5} className="px-4 py-3 text-gray-700">Total</td>
                      <td className="px-4 py-3 text-right text-green-700 text-lg">₹{data.revenue?.total || 0}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-gray-400">No completed transactions</div>
            )}
          </div>
        </div>
      )}
    </SalonOwnerLayout>
  )
}

function StatBox({ label, value, icon, color, valueColor }) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

function PaymentRow({ label, icon, amount, total, color }) {
  const pct = total > 0 ? (amount / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{icon} {label}</span>
        <span className="font-semibold text-gray-900">₹{amount}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
