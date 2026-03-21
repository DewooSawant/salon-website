import { useState, useEffect } from 'react'
import { FiPlus, FiTrash2, FiX, FiUser } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const emptyForm = { name: '', email: '', phone: '', role: 'Stylist', experience: '', speciality: '', bio: '', avatar_emoji: '' }

const avatarOptions = ['💇', '💇‍♂️', '💇‍♀️', '🧔‍♂️', '👨‍🎨', '👩‍🎨', '👨‍💼', '👩‍💼', '🧑‍🎤', '✂️']

export default function SalonOwnerStylists() {
  const api = useSalonOwnerApi()
  const [stylists, setStylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchStylists() }, [])

  const fetchStylists = async () => {
    try {
      const res = await api.get('/salon-owner/stylists')
      setStylists(res.data.stylists)
    } catch { toast.error('Failed to load stylists') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      await api.post('/salon-owner/stylists', form)
      toast.success('Stylist added')
      setShowModal(false)
      setForm(emptyForm)
      fetchStylists()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add stylist') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name} from your team?`)) return
    try {
      await api.delete(`/salon-owner/stylists/${id}`)
      toast.success('Stylist removed')
      fetchStylists()
    } catch { toast.error('Failed to remove stylist') }
  }

  if (loading) {
    return (
      <SalonOwnerLayout title="Manage Stylists">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SalonOwnerLayout>
    )
  }

  return (
    <SalonOwnerLayout title="Manage Stylists">
      <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition shadow-sm mb-6">
        <FiPlus className="w-4 h-4" /> Add Stylist
      </button>

      {stylists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No team members yet</h3>
          <p className="text-gray-500 mb-4">Add your stylists so customers can choose their preferred professional</p>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition">
            Add Your First Stylist
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stylists.map(stylist => (
            <div key={stylist.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-3xl">
                  {stylist.avatar_emoji || '💇'}
                </div>
                <button onClick={() => handleDelete(stylist.id, stylist.name)}
                  className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 mb-0.5">{stylist.name}</h3>
              <p className="text-sm text-brand-600 font-medium mb-1">{stylist.role}</p>
              {stylist.experience && <p className="text-xs text-gray-500 mb-1">{stylist.experience} experience</p>}
              {stylist.speciality && <p className="text-xs text-gray-500">{stylist.speciality}</p>}
              {stylist.phone && <p className="text-xs text-gray-400 mt-2">{stylist.phone}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add Stylist Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold">Add Stylist</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {avatarOptions.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setForm(f => ({ ...f, avatar_emoji: emoji }))}
                      className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition ${form.avatar_emoji === emoji ? 'bg-brand-100 ring-2 ring-brand-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
                <input type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Senior Stylist" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91..." className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@..." className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Experience</label>
                <input type="text" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
                  placeholder="e.g. 5 years" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Speciality</label>
                <input type="text" value={form.speciality} onChange={e => setForm(f => ({ ...f, speciality: e.target.value }))}
                  placeholder="e.g. Hair Color & Styling" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Stylist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SalonOwnerLayout>
  )
}
