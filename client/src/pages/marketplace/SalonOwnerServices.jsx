import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const emptyService = { name: '', description: '', price: '', discounted_price: '', duration: '30', icon: '', category_id: '', gender: 'unisex', is_popular: false }

export default function SalonOwnerServices() {
  const api = useSalonOwnerApi()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form, setForm] = useState(emptyService)
  const [saving, setSaving] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', icon: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get('/salon-owner/services'),
        api.get('/salon-owner/categories')
      ])
      setServices(svcRes.data.services)
      setCategories(catRes.data.categories)
    } catch { toast.error('Failed to load services') }
    finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditingService(null)
    setForm(emptyService)
    setShowModal(true)
  }

  const openEdit = (svc) => {
    setEditingService(svc)
    setForm({
      name: svc.name, description: svc.description || '', price: svc.price,
      discounted_price: svc.discounted_price || '', duration: svc.duration,
      icon: svc.icon || '', category_id: svc.category_id || '', gender: svc.gender || 'unisex',
      is_popular: svc.is_popular || false,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration) { toast.error('Name, price, and duration are required'); return }
    setSaving(true)
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        discounted_price: form.discounted_price ? parseFloat(form.discounted_price) : null,
        duration: parseInt(form.duration),
        category_id: form.category_id || null,
      }
      if (editingService) {
        await api.put(`/salon-owner/services/${editingService.id}`, data)
        toast.success('Service updated')
      } else {
        await api.post('/salon-owner/services', data)
        toast.success('Service created')
      }
      setShowModal(false)
      fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return
    try {
      await api.delete(`/salon-owner/services/${id}`)
      toast.success('Service deleted')
      fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const handleAddCategory = async () => {
    if (!catForm.name) { toast.error('Category name required'); return }
    try {
      await api.post('/salon-owner/categories', catForm)
      toast.success('Category created')
      setShowCatModal(false)
      setCatForm({ name: '', icon: '' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create category') }
  }

  // Group services by category
  const grouped = categories.map(cat => ({
    ...cat,
    services: services.filter(s => s.category_id === cat.id)
  }))
  const uncategorized = services.filter(s => !s.category_id)

  if (loading) {
    return (
      <SalonOwnerLayout title="Manage Services">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SalonOwnerLayout>
    )
  }

  return (
    <SalonOwnerLayout title="Manage Services">
      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition shadow-sm">
          <FiPlus className="w-4 h-4" /> Add Service
        </button>
        <button onClick={() => setShowCatModal(true)} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
          <FiPlus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Services by Category */}
      {grouped.map(cat => (
        cat.services.length > 0 && (
          <div key={cat.id} className="mb-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              <span className="text-lg">{cat.icon}</span> {cat.name}
              <span className="text-xs font-normal text-gray-400">({cat.services.length})</span>
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {cat.services.map((svc, i) => (
                <ServiceRow key={svc.id} svc={svc} onEdit={() => openEdit(svc)} onDelete={() => handleDelete(svc.id)} isLast={i === cat.services.length - 1} />
              ))}
            </div>
          </div>
        )
      ))}

      {uncategorized.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Uncategorized</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {uncategorized.map((svc, i) => (
              <ServiceRow key={svc.id} svc={svc} onEdit={() => openEdit(svc)} onDelete={() => handleDelete(svc.id)} isLast={i === uncategorized.length - 1} />
            ))}
          </div>
        </div>
      )}

      {services.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">✂️</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No services yet</h3>
          <p className="text-gray-500 mb-4">Add your first service to start getting bookings</p>
          <button onClick={openAdd} className="px-5 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition">
            Add Your First Service
          </button>
        </div>
      )}

      {/* Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold">{editingService ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Service Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Premium Haircut" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400">
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="300" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Discounted Price</label>
                  <input type="number" value={form.discounted_price} onChange={e => setForm(f => ({ ...f, discounted_price: e.target.value }))}
                    placeholder="250" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (min) *</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="30" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Icon (emoji)</label>
                  <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="✂️" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Brief description..." className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Gender</label>
                <div className="flex gap-2">
                  {['unisex', 'men', 'women'].map(g => (
                    <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition ${form.gender === g ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-gray-700">Mark as Popular</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : editingService ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCatModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold">Add Category</h3>
              <button onClick={() => setShowCatModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category Name *</label>
                <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Hair Treatments" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Icon (emoji)</label>
                <input type="text" value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🧴" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowCatModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddCategory} className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700">Create</button>
            </div>
          </div>
        </div>
      )}
    </SalonOwnerLayout>
  )
}

function ServiceRow({ svc, onEdit, onDelete, isLast }) {
  return (
    <div className={`flex items-center justify-between p-4 hover:bg-gray-50 transition ${!isLast ? 'border-b border-gray-50' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl">{svc.icon || '✂️'}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">{svc.name}</h4>
            {svc.is_popular && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Popular</span>}
          </div>
          <p className="text-sm text-gray-500">{svc.duration} min &bull; {svc.gender}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          {svc.discounted_price ? (
            <div>
              <span className="text-xs text-gray-400 line-through">₹{svc.price}</span>
              <span className="ml-1 font-bold text-brand-600">₹{svc.discounted_price}</span>
            </div>
          ) : (
            <span className="font-bold text-gray-900">₹{svc.price}</span>
          )}
        </div>
        <button onClick={onEdit} className="p-2 hover:bg-brand-50 rounded-lg text-gray-400 hover:text-brand-600 transition">
          <FiEdit2 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition">
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
