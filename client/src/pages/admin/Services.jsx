import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiFolder, FiScissors } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Services() {
  const { api } = useAuth()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeTab, setActiveTab] = useState('services')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/categories')
      ])
      setServices(servicesRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveService = async (formData) => {
    try {
      if (editingItem) {
        await api.put(`/admin/services/${editingItem.id}`, formData)
        toast.success('Service updated')
      } else {
        await api.post('/admin/services', formData)
        toast.success('Service created')
      }
      fetchData()
      setShowModal(false)
      setEditingItem(null)
    } catch (error) {
      toast.error('Failed to save service')
    }
  }

  const handleDeleteService = async (id) => {
    if (!confirm('Delete this service?')) return
    try {
      await api.delete(`/admin/services/${id}`)
      toast.success('Service deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleSaveCategory = async (formData) => {
    try {
      if (editingItem) {
        await api.put(`/admin/categories/${editingItem.id}`, formData)
        toast.success('Category updated')
      } else {
        await api.post('/admin/categories', formData)
        toast.success('Category created')
      }
      fetchData()
      setShowCategoryModal(false)
      setEditingItem(null)
    } catch (error) {
      toast.error('Failed to save category')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? Services in this category will be unassigned.')) return
    try {
      await api.delete(`/admin/categories/${id}`)
      toast.success('Category deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  return (
    <AdminLayout title="Services & Categories">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'services'
              ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FiScissors className="inline mr-2" />
          Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'categories'
              ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FiFolder className="inline mr-2" />
          Categories ({categories.length})
        </button>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">All Services</h2>
            <button
              onClick={() => { setEditingItem(null); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-dark-950 rounded-lg font-medium hover:bg-gold-400 transition-colors"
            >
              <FiPlus /> Add Service
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{service.icon || '✂️'}</span>
                    <div>
                      <h3 className="text-white font-medium">{service.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {service.category_name || 'Uncategorized'} • {service.duration} mins
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-gold-400 font-semibold">₹{service.price}</p>
                      {service.is_popular && (
                        <span className="text-xs text-amber-400">Popular</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingItem(service); setShowModal(true) }}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">All Categories</h2>
            <button
              onClick={() => { setEditingItem(null); setShowCategoryModal(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-dark-950 rounded-lg font-medium hover:bg-gold-400 transition-colors"
            >
              <FiPlus /> Add Category
            </button>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <div>
                    <h3 className="text-white font-medium">{category.name}</h3>
                    <p className="text-gray-400 text-sm">{category.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingItem(category); setShowCategoryModal(true) }}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Modal */}
      <AnimatePresence>
        {showModal && (
          <ServiceModal
            service={editingItem}
            categories={categories}
            onSave={handleSaveService}
            onClose={() => { setShowModal(false); setEditingItem(null) }}
          />
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <CategoryModal
            category={editingItem}
            onSave={handleSaveCategory}
            onClose={() => { setShowCategoryModal(false); setEditingItem(null) }}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}

function ServiceModal({ service, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: service?.name || '',
    description: service?.description || '',
    category_id: service?.category_id || '',
    price: service?.price || '',
    duration: service?.duration || 30,
    icon: service?.icon || '✂️',
    is_popular: service?.is_popular || false,
    is_active: service?.is_active ?? true
  })

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
        className="w-full max-w-lg bg-dark-900 rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {service ? 'Edit Service' : 'Add Service'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Service Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icon (Emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (mins)</label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                required
              />
            </div>
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_popular}
                  onChange={(e) => setForm({ ...form, is_popular: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-300">Popular Service</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-300">Active</span>
              </label>
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

function CategoryModal({ category, onSave, onClose }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '📁',
    display_order: category?.display_order || 0,
    is_active: category?.is_active ?? true
  })

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
        className="w-full max-w-md bg-dark-900 rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icon (Emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
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

