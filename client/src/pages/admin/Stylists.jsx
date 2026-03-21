import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Stylists() {
  const { api } = useAuth()
  const [stylists, setStylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStylist, setEditingStylist] = useState(null)

  useEffect(() => {
    fetchStylists()
  }, [])

  const fetchStylists = async () => {
    try {
      const response = await api.get('/admin/stylists')
      setStylists(response.data)
    } catch (error) {
      toast.error('Failed to load stylists')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingStylist) {
        await api.put(`/admin/stylists/${editingStylist.id}`, formData)
        toast.success('Stylist updated')
      } else {
        await api.post('/admin/stylists', formData)
        toast.success('Stylist added')
      }
      fetchStylists()
      setShowModal(false)
      setEditingStylist(null)
    } catch (error) {
      toast.error('Failed to save stylist')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this stylist? Their future bookings will be unassigned.')) return
    try {
      await api.delete(`/admin/stylists/${id}`)
      toast.success('Stylist deleted')
      fetchStylists()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const toggleActive = async (stylist) => {
    try {
      await api.put(`/admin/stylists/${stylist.id}`, {
        ...stylist,
        is_active: !stylist.is_active
      })
      fetchStylists()
      toast.success(stylist.is_active ? 'Stylist deactivated' : 'Stylist activated')
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  return (
    <AdminLayout title="Stylists">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Team Members</h2>
          <button
            onClick={() => { setEditingStylist(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-dark-950 rounded-lg font-medium hover:bg-gold-400 transition-colors"
          >
            <FiPlus /> Add Stylist
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stylists.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FiUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No stylists added yet</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stylists.map((stylist) => (
              <motion.div
                key={stylist.id}
                layout
                className={`p-6 bg-dark-800/50 rounded-xl border transition-all ${
                  stylist.is_active ? 'border-white/10' : 'border-red-500/30 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{stylist.avatar_emoji || '👨‍🦱'}</span>
                    <div>
                      <h3 className="text-white font-semibold">{stylist.name}</h3>
                      <p className="text-gold-400 text-sm">{stylist.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingStylist(stylist); setShowModal(true) }}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(stylist.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-gray-400">
                    <span className="text-gray-500">Experience:</span> {stylist.experience || 'N/A'}
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Speciality:</span> {stylist.speciality || 'N/A'}
                  </p>
                  {stylist.phone && (
                    <p className="text-gray-400">
                      <span className="text-gray-500">Phone:</span> {stylist.phone}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => toggleActive(stylist)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      stylist.is_active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {stylist.is_active ? '✓ Active' : 'Inactive - Click to Activate'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <StylistModal
            stylist={editingStylist}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingStylist(null) }}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}

function StylistModal({ stylist, onSave, onClose }) {
  const [form, setForm] = useState({
    name: stylist?.name || '',
    email: stylist?.email || '',
    phone: stylist?.phone || '',
    role: stylist?.role || 'Stylist',
    experience: stylist?.experience || '',
    speciality: stylist?.speciality || '',
    bio: stylist?.bio || '',
    avatar_emoji: stylist?.avatar_emoji || '👨‍🦱',
    is_active: stylist?.is_active ?? true
  })

  const emojis = ['👨‍🦱', '👩‍🦰', '🧔‍♂️', '👨‍🎨', '💇‍♂️', '💇‍♀️', '👱‍♂️', '👱‍♀️']

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-dark-900 rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-dark-900">
          <h2 className="text-xl font-semibold text-white">
            {stylist ? 'Edit Stylist' : 'Add Stylist'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Avatar</label>
            <div className="flex gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, avatar_emoji: emoji })}
                  className={`text-3xl p-2 rounded-lg transition-all ${
                    form.avatar_emoji === emoji
                      ? 'bg-gold-500/20 ring-2 ring-gold-500'
                      : 'bg-dark-800 hover:bg-dark-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Role/Title</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                placeholder="e.g., Senior Stylist"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Experience</label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                placeholder="e.g., 5 years"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Speciality</label>
              <input
                type="text"
                value={form.speciality}
                onChange={(e) => setForm({ ...form, speciality: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                placeholder="e.g., Hair Coloring, Beard Styling"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                rows={3}
                placeholder="Brief description about the stylist..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-gold-500 text-dark-950 rounded-lg font-medium hover:bg-gold-400"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

