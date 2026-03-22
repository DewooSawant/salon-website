import { useState, useEffect, useRef } from 'react'
import { FiDollarSign, FiPercent, FiCheck, FiChevronLeft, FiChevronRight, FiPrinter, FiEdit3, FiX, FiUser } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const payTypeLabels = { salary: 'Salary', commission: 'Commission', both: 'Salary + Commission' }
const payTypeColors = { salary: 'bg-blue-100 text-blue-700', commission: 'bg-green-100 text-green-700', both: 'bg-purple-100 text-purple-700' }

export default function SalonOwnerStaffPay() {
  const api = useSalonOwnerApi()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [staff, setStaff] = useState([])
  const [totals, setTotals] = useState({})
  const [loading, setLoading] = useState(true)
  // Modals
  const [editingPay, setEditingPay] = useState(null) // stylist for pay settings edit
  const [editingPayment, setEditingPayment] = useState(null) // stylist for payment/slip
  const [slipData, setSlipData] = useState(null)
  const slipRef = useRef(null)

  useEffect(() => { fetchData() }, [month, year])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/salon-owner/staff-payments', { params: { month, year } })
      setStaff(res.data.staff)
      setTotals(res.data.totals)
    } catch {
      toast.error('Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const savePay = async (stylist, data) => {
    try {
      await api.patch(`/salon-owner/stylists/${stylist.id}/pay`, data)
      toast.success('Pay settings updated')
      setEditingPay(null)
      fetchData()
    } catch { toast.error('Failed to update') }
  }

  const savePayment = async (stylist, data) => {
    try {
      await api.post(`/salon-owner/staff-payments/${stylist.id}`, {
        month, year, ...data
      })
      toast.success(data.status === 'paid' ? 'Marked as paid!' : 'Payment updated')
      setEditingPayment(null)
      fetchData()
    } catch { toast.error('Failed to save') }
  }

  const openSlip = async (stylist) => {
    try {
      const res = await api.get(`/salon-owner/staff-payments/${stylist.id}/slip`, { params: { month, year } })
      setSlipData({ ...res.data, staffRow: staff.find(s => s.id === stylist.id) })
    } catch { toast.error('Failed to load slip') }
  }

  const printSlip = () => {
    const content = slipRef.current
    if (!content) return
    const win = window.open('', '_blank')
    win.document.write(`<html><head><title>Salary Slip</title><style>
      body{font-family:Inter,system-ui,sans-serif;padding:40px;color:#111}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      td,th{padding:8px 12px;text-align:left;border-bottom:1px solid #eee}
      th{font-weight:600;background:#f9fafb}
      .header{text-align:center;margin-bottom:24px}
      .total-row td{font-weight:700;border-top:2px solid #333;font-size:16px}
      .badge{display:inline-block;padding:2px 8px;border-radius:8px;font-size:12px;font-weight:600}
    </style></head><body>${content.innerHTML}</body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <SalonOwnerLayout title="Staff Pay">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50">
          <FiChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{monthNames[month - 1]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
          disabled={month === now.getMonth() + 1 && year === now.getFullYear()}>
          <FiChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Salary</p>
          <p className="text-xl font-bold text-blue-600">₹{Math.round(totals.total_salary || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Commission</p>
          <p className="text-xl font-bold text-green-600">₹{Math.round(totals.total_commission || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Payable</p>
          <p className="text-xl font-bold text-gray-900">₹{Math.round(totals.total_payable || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Revenue Generated</p>
          <p className="text-xl font-bold text-purple-600">₹{Math.round(totals.total_revenue || 0)}</p>
        </div>
      </div>

      {/* Payment Status */}
      <div className="flex items-center gap-3 mb-5 text-sm">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-medium">
          <FiCheck className="w-3.5 h-3.5" /> {totals.paid_count || 0} Paid
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg font-medium">
          ⏳ {totals.pending_count || 0} Pending
        </span>
      </div>

      {/* Staff Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">No staff members</h3>
          <p className="text-sm text-gray-400">Add stylists first, then manage their pay here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {s.avatar_emoji || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${payTypeColors[s.pay_type] || payTypeColors.salary}`}>
                      {payTypeLabels[s.pay_type] || 'Salary'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{s.role} {s.phone ? `• ${s.phone}` : ''}</p>
                </div>
                <button onClick={() => setEditingPay(s)}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition" title="Edit pay settings">
                  <FiEdit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Pay Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Bookings</p>
                  <p className="text-sm font-bold text-gray-800">{s.total_bookings}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Revenue</p>
                  <p className="text-sm font-bold text-gray-800">₹{Math.round(parseFloat(s.revenue_generated))}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-blue-500">Salary</p>
                  <p className="text-sm font-bold text-blue-700">₹{Math.round(s.base_salary)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-500">Commission ({s.commission_rate}%)</p>
                  <p className="text-sm font-bold text-green-700">₹{Math.round(s.commission_amount)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <p className="text-xs text-purple-500">Total</p>
                  <p className="text-sm font-bold text-purple-700">₹{Math.round(s.total_payable)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {s.payment_status === 'paid' ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                    <FiCheck className="w-3.5 h-3.5" /> Paid {s.paid_date ? `on ${new Date(s.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                  </span>
                ) : (
                  <button onClick={() => setEditingPayment(s)}
                    className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition">
                    Mark as Paid
                  </button>
                )}
                <button onClick={() => openSlip(s)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                  <FiPrinter className="w-3 h-3" /> Salary Slip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Pay Settings Modal */}
      {editingPay && <PaySettingsModal stylist={editingPay} onSave={savePay} onClose={() => setEditingPay(null)} />}

      {/* Mark as Paid Modal */}
      {editingPayment && <MarkPaidModal stylist={editingPayment} month={month} year={year} onSave={savePayment} onClose={() => setEditingPayment(null)} />}

      {/* Salary Slip Modal */}
      {slipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Salary Slip</h3>
              <div className="flex gap-2">
                <button onClick={printSlip} className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold">
                  <FiPrinter className="w-3 h-3" /> Print
                </button>
                <button onClick={() => setSlipData(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div ref={slipRef} className="p-6">
              <SalarySlipContent data={slipData} month={month} year={year} />
            </div>
          </div>
        </div>
      )}
    </SalonOwnerLayout>
  )
}

function PaySettingsModal({ stylist, onSave, onClose }) {
  const [payType, setPayType] = useState(stylist.pay_type || 'salary')
  const [salary, setSalary] = useState(stylist.monthly_salary || 0)
  const [rate, setRate] = useState(stylist.commission_rate || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="font-bold text-gray-900 mb-4">Pay Settings — {stylist.name}</h3>

        <label className="block text-sm font-medium text-gray-700 mb-1">Pay Type</label>
        <div className="flex gap-2 mb-4">
          {['salary', 'commission', 'both'].map(t => (
            <button key={t} onClick={() => setPayType(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                payType === t ? payTypeColors[t] + ' ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-50 text-gray-500'
              }`}>
              {payTypeLabels[t]}
            </button>
          ))}
        </div>

        {(payType === 'salary' || payType === 'both') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
            <input type="number" value={salary} onChange={e => setSalary(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400" />
          </div>
        )}

        {(payType === 'commission' || payType === 'both') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)} min="0" max="100"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400" />
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={() => onSave(stylist, { pay_type: payType, monthly_salary: salary, commission_rate: rate })}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold">Save</button>
        </div>
      </div>
    </div>
  )
}

function MarkPaidModal({ stylist, month, year, onSave, onClose }) {
  const [bonus, setBonus] = useState(stylist.bonus || 0)
  const [deductions, setDeductions] = useState(stylist.deductions || 0)
  const [method, setMethod] = useState('cash')
  const [notes, setNotes] = useState(stylist.notes || '')

  const total = stylist.base_salary + stylist.commission_amount + parseFloat(bonus || 0) - parseFloat(deductions || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="font-bold text-gray-900 mb-1">Pay {stylist.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{monthNames[month - 1]} {year}</p>

        <div className="space-y-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Base Salary</span>
            <span className="font-medium">₹{Math.round(stylist.base_salary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Commission</span>
            <span className="font-medium">₹{Math.round(stylist.commission_amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Bonus</span>
            <input type="number" value={bonus} onChange={e => setBonus(e.target.value)}
              className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right outline-none" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Deductions</span>
            <input type="number" value={deductions} onChange={e => setDeductions(e.target.value)}
              className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right outline-none" />
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-900">Total Payable</span>
            <span className="font-bold text-brand-600 text-lg">₹{Math.round(total)}</span>
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <div className="flex gap-2 mb-4">
          {[{ v: 'cash', l: '💵 Cash' }, { v: 'upi', l: '📱 UPI' }, { v: 'bank', l: '🏦 Bank' }].map(p => (
            <button key={p.v} onClick={() => setMethod(p.v)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                method === p.v ? 'bg-brand-100 border-2 border-brand-400 text-brand-700' : 'bg-gray-50 border-2 border-gray-100 text-gray-600'
              }`}>
              {p.l}
            </button>
          ))}
        </div>

        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optional)" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none mb-4" />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={() => onSave(stylist, {
            base_salary: stylist.base_salary,
            commission_earned: stylist.commission_amount,
            bonus: parseFloat(bonus || 0),
            deductions: parseFloat(deductions || 0),
            payment_method: method,
            notes, status: 'paid',
          })} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold">
            <FiCheck className="w-4 h-4 inline mr-1" /> Mark Paid
          </button>
        </div>
      </div>
    </div>
  )
}

function SalarySlipContent({ data, month, year }) {
  const { stylist, payment, performance, staffRow } = data
  const row = staffRow || {}
  const p = payment || {}

  const baseSalary = parseFloat(p.base_salary || row.base_salary || 0)
  const commission = parseFloat(p.commission_earned || row.commission_amount || 0)
  const bonus = parseFloat(p.bonus || 0)
  const deductions = parseFloat(p.deductions || 0)
  const total = baseSalary + commission + bonus - deductions

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{stylist.salon_name}</h2>
        <p className="text-sm text-gray-500">{stylist.address}, {stylist.city}</p>
        <p className="text-sm text-gray-500 mt-1">Salary Slip — {monthNames[month - 1]} {year}</p>
      </div>

      {/* Employee Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p className="text-gray-500">Employee Name</p>
          <p className="font-semibold text-gray-900">{stylist.name}</p>
        </div>
        <div>
          <p className="text-gray-500">Role</p>
          <p className="font-semibold text-gray-900">{stylist.role}</p>
        </div>
        <div>
          <p className="text-gray-500">Pay Type</p>
          <p className="font-semibold text-gray-900">{payTypeLabels[stylist.pay_type] || 'Salary'}</p>
        </div>
        <div>
          <p className="text-gray-500">Phone</p>
          <p className="font-semibold text-gray-900">{stylist.phone || '-'}</p>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h4 className="font-semibold text-gray-700 text-sm mb-2">Performance</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Total Bookings</p>
            <p className="font-bold text-gray-900">{performance?.total_bookings || row.total_bookings || 0}</p>
          </div>
          <div>
            <p className="text-gray-500">Revenue Generated</p>
            <p className="font-bold text-gray-900">₹{Math.round(parseFloat(performance?.total_revenue || row.revenue_generated || 0))}</p>
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-2">Base Salary</td>
            <td className="py-2 text-right font-medium">₹{Math.round(baseSalary)}</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-2">Commission ({stylist.commission_rate || 0}%)</td>
            <td className="py-2 text-right font-medium">₹{Math.round(commission)}</td>
          </tr>
          {bonus > 0 && (
            <tr className="border-b border-gray-100">
              <td className="py-2 text-green-600">Bonus</td>
              <td className="py-2 text-right font-medium text-green-600">+₹{Math.round(bonus)}</td>
            </tr>
          )}
          {deductions > 0 && (
            <tr className="border-b border-gray-100">
              <td className="py-2 text-red-600">Deductions</td>
              <td className="py-2 text-right font-medium text-red-600">-₹{Math.round(deductions)}</td>
            </tr>
          )}
          <tr className="font-bold text-base border-t-2 border-gray-300">
            <td className="py-3">Net Payable</td>
            <td className="py-3 text-right">₹{Math.round(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* Payment Status */}
      {p.status === 'paid' && (
        <div className="bg-green-50 rounded-xl p-3 text-center text-sm">
          <span className="font-bold text-green-700">PAID</span>
          {p.paid_date && <span className="text-green-600 ml-2">on {new Date(p.paid_date).toLocaleDateString('en-IN')}</span>}
          {p.payment_method && <span className="text-green-600 ml-2">via {p.payment_method}</span>}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        This is a computer-generated salary slip. No signature required.
      </div>
    </div>
  )
}
