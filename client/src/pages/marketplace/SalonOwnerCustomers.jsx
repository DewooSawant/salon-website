import { useState, useEffect } from 'react'
import { FiSearch, FiPhone, FiCalendar, FiDollarSign, FiUser, FiChevronRight, FiArrowLeft, FiClock, FiTrendingUp } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const segments = [
  { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700' },
  { key: 'frequent', label: 'Frequent (5+)', color: 'bg-green-100 text-green-700' },
  { key: 'vip', label: 'VIP (5K+)', color: 'bg-purple-100 text-purple-700' },
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { key: 'inactive', label: 'Inactive (30d)', color: 'bg-red-100 text-red-700' },
]

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const daysAgo = (d) => {
  if (!d) return null
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 30) return `${diff} days ago`
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`
  return `${Math.floor(diff / 365)}y ago`
}

export default function SalonOwnerCustomers() {
  const api = useSalonOwnerApi()
  const [customers, setCustomers] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('all')
  const [sort, setSort] = useState('recent')
  // Detail view
  const [selectedPhone, setSelectedPhone] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { fetchCustomers() }, [segment, sort])

  const fetchCustomers = async (q) => {
    try {
      setLoading(true)
      const params = { sort }
      if (segment !== 'all') params.segment = segment
      if (q || search) params.search = q || search
      const res = await api.get('/salon-owner/customers', { params })
      setCustomers(res.data.customers)
      setSummary(res.data.summary)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchCustomers(search)
  }

  const openDetail = async (phone) => {
    setSelectedPhone(phone)
    setDetailLoading(true)
    try {
      const res = await api.get(`/salon-owner/customers/${encodeURIComponent(phone)}/history`)
      setDetail(res.data)
    } catch {
      toast.error('Failed to load customer history')
    } finally {
      setDetailLoading(false)
    }
  }

  // Detail view
  if (selectedPhone && detail) {
    const c = detail.customer
    return (
      <SalonOwnerLayout title="Customer Details">
        <button onClick={() => { setSelectedPhone(null); setDetail(null) }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <FiArrowLeft className="w-4 h-4" /> Back to Customers
        </button>

        {/* Customer Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-600">
              {c.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{c.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><FiPhone className="w-3 h-3" /> {c.phone}</span>
                {c.phone && c.phone !== 'walk-in' && (
                  <a href={`https://wa.me/91${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium">
                    <FaWhatsapp className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{c.total_visits}</p>
              <p className="text-xs text-blue-600">Total Visits</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700">₹{Math.round(c.total_spent)}</p>
              <p className="text-xs text-green-600">Total Spent</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{formatDate(c.first_visit)}</p>
              <p className="text-xs text-purple-600">First Visit</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-700">{daysAgo(c.last_visit)}</p>
              <p className="text-xs text-orange-600">Last Visit</p>
            </div>
          </div>
        </div>

        {/* Favorite Services */}
        {c.top_services?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Favorite Services</h3>
            <div className="flex flex-wrap gap-2">
              {c.top_services.map(s => (
                <span key={s.name} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium">
                  {s.name} <span className="text-brand-400">x{s.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Visit History */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Visit History</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {detail.bookings.map(b => (
              <div key={b.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-brand-600">{b.booking_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      b.status === 'completed' ? 'bg-green-100 text-green-700' :
                      b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{b.status}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">₹{b.final_price}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{formatDate(b.booking_date)}</span>
                  {b.stylist_name && <span>by {b.stylist_name}</span>}
                  <span>{b.payment_method}</span>
                </div>
                {Array.isArray(b.services) && b.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {b.services.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-lg text-xs">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {detail.bookings.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No visit history</div>
            )}
          </div>
        </div>
      </SalonOwnerLayout>
    )
  }

  // Main customer list
  return (
    <SalonOwnerLayout title="Customers">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{summary.total_customers || 0}</p>
          <p className="text-xs text-gray-500">Total Customers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.frequent || 0}</p>
          <p className="text-xs text-gray-500">Frequent</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.new_this_month || 0}</p>
          <p className="text-xs text-gray-500">New This Month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{summary.inactive || 0}</p>
          <p className="text-xs text-gray-500">Inactive (30d+)</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3">
            <FiSearch className="w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="flex-1 px-3 py-2.5 outline-none text-sm text-gray-700" />
          </div>
        </form>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none">
          <option value="recent">Recent Visit</option>
          <option value="spent">Most Spent</option>
          <option value="visits">Most Visits</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Segment Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {segments.map(s => (
          <button key={s.key} onClick={() => setSegment(s.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              segment === s.key ? s.color + ' ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">No customers found</h3>
          <p className="text-sm text-gray-400">Customers will appear here once they book or walk in</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
            <button key={c.phone} onClick={() => openDetail(c.phone)}
              className="w-full bg-white rounded-xl border border-gray-100 p-4 hover:border-brand-200 hover:shadow-sm transition text-left flex items-center gap-4">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center text-lg font-bold text-brand-600 shrink-0">
                {c.name?.charAt(0)?.toUpperCase() || '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                  {parseInt(c.total_visits) >= 5 && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">REGULAR</span>
                  )}
                  {parseFloat(c.total_spent) >= 5000 && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md">VIP</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>{c.phone}</span>
                  <span>{daysAgo(c.last_visit)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-right shrink-0">
                <div>
                  <p className="text-sm font-bold text-gray-900">{c.total_visits}</p>
                  <p className="text-[10px] text-gray-400">visits</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-600">₹{Math.round(parseFloat(c.total_spent))}</p>
                  <p className="text-[10px] text-gray-400">spent</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">₹{c.avg_bill}</p>
                  <p className="text-[10px] text-gray-400">avg</p>
                </div>
              </div>

              <FiChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </SalonOwnerLayout>
  )
}
