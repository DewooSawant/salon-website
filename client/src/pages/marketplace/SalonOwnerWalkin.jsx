import { useState, useEffect, useRef } from 'react'
import { FiUser, FiPhone, FiCheck, FiX, FiPrinter, FiRefreshCw, FiClock, FiDollarSign, FiPercent } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: '💵', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'upi', label: 'UPI', icon: '📱', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'card', label: 'Card', icon: '💳', color: 'bg-brand-100 text-brand-700 border-brand-300' },
]

export default function SalonOwnerWalkin() {
  const api = useSalonOwnerApi()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [stylists, setStylists] = useState([])
  const [todayData, setTodayData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [selectedServices, setSelectedServices] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedStylist, setSelectedStylist] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')
  const [billing, setBilling] = useState(false)

  // Success state
  const [lastBill, setLastBill] = useState(null)

  const nameRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [svcRes, catRes, styRes, todayRes] = await Promise.all([
        api.get('/salon-owner/services'),
        api.get('/salon-owner/categories'),
        api.get('/salon-owner/stylists'),
        api.get('/salon-owner/today'),
      ])
      setServices(svcRes.data.services)
      setCategories(catRes.data.categories)
      setStylists(styRes.data.stylists || todayRes.data.stylists || [])
      setTodayData(todayRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const toggleService = (svc) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === svc.id)
        ? prev.filter(s => s.id !== svc.id)
        : [...prev, svc]
    )
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.discounted_price || s.price), 0)
  const discountAmt = parseFloat(discount) || 0
  const finalPrice = Math.max(0, totalPrice - discountAmt)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  const handleBill = async () => {
    if (!customerName.trim()) { toast.error('Enter customer name'); return }
    if (selectedServices.length === 0) { toast.error('Select at least one service'); return }

    setBilling(true)
    try {
      const res = await api.post('/salon-owner/walkin', {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        services: selectedServices.map(s => s.id),
        stylist_id: selectedStylist || null,
        payment_method: paymentMethod,
        discount_amount: discountAmt,
        notes: notes.trim() || null,
      })
      setLastBill(res.data.booking)
      toast.success(`Bill generated! ₹${res.data.booking.final_price}`)
      // Clear form immediately after success
      setSelectedServices([])
      setCustomerName('')
      setCustomerPhone('')
      setSelectedStylist('')
      setPaymentMethod('cash')
      setDiscount('')
      setNotes('')
      // Refresh today data
      const todayRes = await api.get('/salon-owner/today')
      setTodayData(todayRes.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Billing failed')
    } finally {
      setBilling(false)
    }
  }

  const resetForm = () => {
    setSelectedServices([])
    setCustomerName('')
    setCustomerPhone('')
    setSelectedStylist('')
    setPaymentMethod('cash')
    setDiscount('')
    setNotes('')
    setLastBill(null)
    nameRef.current?.focus()
  }

  // Group services by category
  const grouped = categories.map(cat => ({
    ...cat,
    services: services.filter(s => s.category_id === cat.id && s.is_active !== false)
  })).filter(g => g.services.length > 0)

  if (loading) {
    return (
      <SalonOwnerLayout title="Walk-in Billing">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SalonOwnerLayout>
    )
  }

  return (
    <SalonOwnerLayout title="Walk-in Billing">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Service Selection */}
        <div className="lg:col-span-2 space-y-4">

          {/* Success Banner */}
          {lastBill && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800">Bill Generated Successfully!</p>
                  <p className="text-sm text-green-600">
                    {lastBill.customer_name} &bull; Code: <span className="font-mono font-bold">{lastBill.booking_code}</span> &bull; ₹{lastBill.final_price}
                  </p>
                </div>
              </div>
              <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition text-sm">
                <FiRefreshCw className="w-4 h-4" /> New Bill
              </button>
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Customer</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input ref={nameRef} type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer Name *" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700" />
              </div>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Phone (optional)" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700" />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Select Services</h3>
            {grouped.map(cat => (
              <div key={cat.id} className="mb-4 last:mb-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>{cat.icon}</span> {cat.name}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cat.services.map(svc => {
                    const isSelected = selectedServices.find(s => s.id === svc.id)
                    const price = svc.discounted_price || svc.price
                    return (
                      <button
                        key={svc.id}
                        onClick={() => toggleService(svc)}
                        className={`relative p-3 rounded-xl text-left transition-all border-2 ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 shadow-sm'
                            : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                            <FiCheck className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <p className="font-medium text-sm text-gray-900 pr-6">{svc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-brand-600 text-sm">₹{price}</span>
                          {svc.discounted_price && svc.discounted_price < svc.price && (
                            <span className="text-xs text-gray-400 line-through">₹{svc.price}</span>
                          )}
                          <span className="text-xs text-gray-400">{svc.duration}m</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Stylist & Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign Stylist</label>
                <select value={selectedStylist} onChange={e => setSelectedStylist(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700">
                  <option value="">Any / Not assigned</option>
                  {(todayData?.stylists || stylists).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.avatar_emoji} {s.name} {s.status === 'busy' ? '(Busy)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests..." className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Right - Bill Summary & Today's Stats */}
        <div className="space-y-4">
          {/* Bill Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4">Bill Summary</h3>

            {selectedServices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Select services to see bill</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {selectedServices.map(svc => (
                    <div key={svc.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate text-gray-700">{svc.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{svc.duration}m</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-medium text-gray-900">₹{svc.discounted_price || svc.price}</span>
                        <button onClick={() => toggleService(svc)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal ({selectedServices.length} items)</span>
                    <span className="text-gray-700">₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duration</span>
                    <span className="text-gray-700">{totalDuration} min</span>
                  </div>

                  {/* Discount */}
                  <div className="flex items-center gap-2">
                    <FiPercent className="w-4 h-4 text-gray-400 shrink-0" />
                    <input type="number" value={discount} onChange={e => setDiscount(e.target.value)}
                      placeholder="Discount ₹" className="flex-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-400 text-gray-700" />
                  </div>

                  {discountAmt > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{discountAmt}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-brand-600">₹{finalPrice}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(pm => (
                      <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                        className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-center ${
                          paymentMethod === pm.value
                            ? pm.color + ' shadow-sm'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        <span className="text-lg block">{pm.icon}</span>
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bill Button */}
                <button
                  onClick={handleBill}
                  disabled={billing || !customerName.trim()}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {billing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiDollarSign className="w-5 h-5" />
                      Generate Bill &bull; ₹{finalPrice}
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Today's Quick Stats */}
          {todayData && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Today's Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">₹{todayData.revenue?.total || 0}</p>
                  <p className="text-xs text-green-600">Revenue</p>
                </div>
                <div className="bg-brand-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-brand-700">{todayData.queue?.completed || 0}</p>
                  <p className="text-xs text-brand-600">Completed</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{todayData.counts?.walkin || 0}</p>
                  <p className="text-xs text-blue-600">Walk-ins</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{todayData.counts?.online || 0}</p>
                  <p className="text-xs text-amber-600">Online</p>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="mt-3 space-y-1.5">
                {todayData.revenue?.cash > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">💵 Cash</span>
                    <span className="font-medium text-gray-700">₹{todayData.revenue.cash}</span>
                  </div>
                )}
                {todayData.revenue?.upi > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">📱 UPI</span>
                    <span className="font-medium text-gray-700">₹{todayData.revenue.upi}</span>
                  </div>
                )}
                {todayData.revenue?.card > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">💳 Card</span>
                    <span className="font-medium text-gray-700">₹{todayData.revenue.card}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stylist Status */}
          {todayData?.stylists?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Stylist Status</h3>
              <div className="space-y-2.5">
                {todayData.stylists.map(s => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <span className="text-xl">{s.avatar_emoji || '💇'}</span>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          s.status === 'available' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        {s.current_booking ? (
                          <p className="text-xs text-red-500">Serving: {s.current_booking.customer}</p>
                        ) : (
                          <p className="text-xs text-green-600">Available</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{s.today_completed} done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SalonOwnerLayout>
  )
}
