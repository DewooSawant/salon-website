import { useState, useEffect } from 'react'
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiCalendar, FiUsers, FiBarChart2, FiClock } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const periods = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
]

const formatCurrency = (n) => {
  const num = parseFloat(n) || 0
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`
  return `₹${Math.round(num)}`
}

const dayLabel = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const hourLabel = (h) => {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

// Simple bar chart component (no dependencies)
function BarChart({ data, valueKey, labelKey, color = 'bg-green-500', maxBars }) {
  const items = maxBars ? data.slice(0, maxBars) : data
  const max = Math.max(...items.map(d => parseFloat(d[valueKey]) || 0), 1)
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const val = parseFloat(item[valueKey]) || 0
        const pct = (val / max) * 100
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-24 truncate shrink-0">{item[labelKey]}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
              <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-gray-700">
                {valueKey === 'revenue' || valueKey === 'total_spent' || valueKey === 'amount' ? formatCurrency(val) : val}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Mini line/area chart using SVG
function RevenueChart({ data }) {
  if (!data || data.length === 0) return null

  const values = data.map(d => parseFloat(d.revenue) || 0)
  const max = Math.max(...values, 1)
  const w = 600
  const h = 160
  const padding = { top: 10, right: 10, bottom: 30, left: 10 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  const points = values.map((v, i) => ({
    x: padding.left + (i / Math.max(values.length - 1, 1)) * chartW,
    y: padding.top + chartH - (v / max) * chartH,
    value: v,
    label: dayLabel(data[i].date),
    bookings: parseInt(data[i].bookings) || 0,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  return (
    <div className="relative overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line key={pct} x1={padding.left} x2={w - padding.right}
            y1={padding.top + chartH * (1 - pct)} y2={padding.top + chartH * (1 - pct)}
            stroke="#f3f4f6" strokeWidth="1" />
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#22c55e" strokeWidth="2" />
            {/* Labels on x-axis */}
            {(data.length <= 8 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
              <text x={p.x} y={h - 5} textAnchor="middle" className="text-[10px]" fill="#9ca3af">{p.label}</text>
            )}
          </g>
        ))}

        {/* Value labels for key points */}
        {points.filter((_, i) => i === 0 || i === points.length - 1 || values[i] === Math.max(...values)).map((p, i) => (
          <text key={`val-${i}`} x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px] font-bold" fill="#16a34a">
            {formatCurrency(p.value)}
          </text>
        ))}
      </svg>
    </div>
  )
}

// Peak hours heatmap
function PeakHoursChart({ data }) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8am to 9pm
  const hourMap = {}
  data.forEach(d => { hourMap[d.hour] = parseInt(d.count) })
  const max = Math.max(...Object.values(hourMap), 1)

  return (
    <div className="flex gap-1 flex-wrap">
      {hours.map(h => {
        const count = hourMap[h] || 0
        const intensity = count / max
        return (
          <div key={h} className="text-center">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
              style={{
                backgroundColor: count > 0 ? `rgba(34, 197, 94, ${0.15 + intensity * 0.85})` : '#f9fafb',
                color: intensity > 0.5 ? 'white' : intensity > 0 ? '#16a34a' : '#d1d5db',
              }}
              title={`${hourLabel(h)}: ${count} bookings`}
            >
              {count || '-'}
            </div>
            <p className="text-[9px] text-gray-400 mt-1">{hourLabel(h)}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function SalonOwnerAnalytics() {
  const api = useSalonOwnerApi()
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await api.get('/salon-owner/analytics', { params: { period } })
      setData(res.data)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SalonOwnerLayout title="Analytics">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SalonOwnerLayout>
    )
  }

  if (!data) return <SalonOwnerLayout title="Analytics"><p className="text-gray-500">No data available</p></SalonOwnerLayout>

  const { comparison, channel_split } = data
  const walkinPct = channel_split.total > 0 ? Math.round((parseInt(channel_split.walkin) / parseInt(channel_split.total)) * 100) : 0

  return (
    <SalonOwnerLayout title="Analytics">
      {/* Period Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                period === p.key ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards with Growth */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(comparison.current.revenue)}</p>
          {comparison.revenue_growth !== null && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${comparison.revenue_growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {comparison.revenue_growth >= 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
              {comparison.revenue_growth >= 0 ? '+' : ''}{comparison.revenue_growth}% vs prev
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FiCalendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Bookings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{comparison.current.bookings}</p>
          {comparison.bookings_growth !== null && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${comparison.bookings_growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {comparison.bookings_growth >= 0 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
              {comparison.bookings_growth >= 0 ? '+' : ''}{comparison.bookings_growth}% vs prev
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <FiUsers className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Walk-in vs Online</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{walkinPct}% <span className="text-sm font-normal text-gray-400">walk-in</span></p>
          <p className="text-xs text-gray-500 mt-1">{channel_split.walkin} walk-in &bull; {channel_split.online} online</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <FiBarChart2 className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-gray-500">Avg per Booking</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {comparison.current.bookings > 0 ? formatCurrency(comparison.current.revenue / comparison.current.bookings) : '₹0'}
          </p>
          <p className="text-xs text-gray-500 mt-1">avg ticket size</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Revenue Trend</h3>
        {data.daily_revenue.length > 0 ? (
          <RevenueChart data={data.daily_revenue} />
        ) : (
          <p className="text-gray-400 text-sm py-8 text-center">No revenue data for this period</p>
        )}
      </div>

      {/* Two Column: Top Services + Top Customers */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Top Services */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Top Services</h3>
          {data.top_services.length > 0 ? (
            <BarChart data={data.top_services} valueKey="revenue" labelKey="name" color="bg-green-500" />
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No data yet</p>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Top Customers</h3>
          {data.top_customers.length > 0 ? (
            <div className="space-y-3">
              {data.top_customers.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.visits} visits</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(c.total_spent)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No data yet</p>
          )}
        </div>
      </div>

      {/* Two Column: Peak Hours + Payment Split */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiClock className="w-4 h-4 text-gray-400" />
            <h3 className="font-bold text-gray-900">Peak Hours</h3>
          </div>
          {data.peak_hours.length > 0 ? (
            <PeakHoursChart data={data.peak_hours} />
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No data yet</p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Payment Methods</h3>
          {data.payment_split.length > 0 ? (
            <div className="space-y-3">
              {data.payment_split.map(p => {
                const total = data.payment_split.reduce((s, x) => s + parseFloat(x.amount), 0)
                const pct = total > 0 ? Math.round((parseFloat(p.amount) / total) * 100) : 0
                const icons = { cash: '💵', upi: '📱', card: '💳', online: '🌐' }
                return (
                  <div key={p.payment_method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {icons[p.payment_method] || '💰'} {p.payment_method}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(p.amount)} <span className="text-xs font-normal text-gray-400">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No data yet</p>
          )}
        </div>
      </div>

      {/* Stylist Performance */}
      {data.stylist_performance.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Stylist Performance</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.stylist_performance.map((st, i) => (
              <div key={i} className={`rounded-xl p-4 border ${i === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{st.avatar_emoji || '👤'}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{st.name}</p>
                    {i === 0 && <span className="text-[10px] font-bold text-green-600 uppercase">Top Performer</span>}
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Bookings</p>
                    <p className="font-bold text-gray-900">{st.bookings}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Revenue</p>
                    <p className="font-bold text-green-600">{formatCurrency(st.revenue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SalonOwnerLayout>
  )
}
