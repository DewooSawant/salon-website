import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiSave, FiMapPin, FiPhone, FiMail, FiClock, FiGlobe } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Settings() {
  const { api, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    salon_name: '',
    tagline: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    google_maps_url: '',
    opening_time: '10:00',
    closing_time: '21:00',
    slot_duration: 30,
    lunch_start: '13:00',
    lunch_end: '14:00',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    social_facebook: '',
    social_instagram: '',
    social_twitter: ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      if (response.data) {
        setSettings(prev => ({
          ...prev,
          ...response.data,
          working_days: response.data.working_days ? 
            (typeof response.data.working_days === 'string' ? 
              JSON.parse(response.data.working_days) : response.data.working_days) 
            : prev.working_days
        }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings', settings)
      toast.success('Settings saved successfully!')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success('Password updated successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password')
    }
  }

  const toggleWorkingDay = (day) => {
    setSettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }))
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'contact', label: 'Contact' },
    { id: 'hours', label: 'Working Hours' },
    { id: 'account', label: 'My Account' }
  ]

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Settings">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'text-gray-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card p-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiGlobe /> General Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Salon Name</label>
                <input
                  type="text"
                  value={settings.salon_name}
                  onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                  placeholder="e.g., Premium Hair Salon"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                  rows={3}
                  placeholder="Tell customers about your salon..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact Settings */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiPhone /> Contact Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                  placeholder="919876543210 (with country code, no +)"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Website</label>
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                  placeholder="https://..."
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white flex items-center gap-2 pt-4">
              <FiMapPin /> Address
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Street Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">City</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">State</label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pincode</label>
                <input
                  type="text"
                  value={settings.pincode}
                  onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Google Maps URL</label>
                <input
                  type="url"
                  value={settings.google_maps_url}
                  onChange={(e) => setSettings({ ...settings, google_maps_url: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white pt-4">Social Media</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Facebook</label>
                <input
                  type="url"
                  value={settings.social_facebook}
                  onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Instagram</label>
                <input
                  type="url"
                  value={settings.social_instagram}
                  onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Twitter</label>
                <input
                  type="url"
                  value={settings.social_twitter}
                  onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Working Hours */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiClock /> Working Hours
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Opening Time</label>
                <input
                  type="time"
                  value={settings.opening_time?.substring(0, 5)}
                  onChange={(e) => setSettings({ ...settings, opening_time: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Closing Time</label>
                <input
                  type="time"
                  value={settings.closing_time?.substring(0, 5)}
                  onChange={(e) => setSettings({ ...settings, closing_time: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Lunch Start</label>
                <input
                  type="time"
                  value={settings.lunch_start?.substring(0, 5)}
                  onChange={(e) => setSettings({ ...settings, lunch_start: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Lunch End</label>
                <input
                  type="time"
                  value={settings.lunch_end?.substring(0, 5)}
                  onChange={(e) => setSettings({ ...settings, lunch_end: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Slot Duration (minutes)</label>
              <select
                value={settings.slot_duration}
                onChange={(e) => setSettings({ ...settings, slot_duration: parseInt(e.target.value) })}
                className="px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      settings.working_days?.includes(day)
                        ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                        : 'bg-dark-800 text-gray-400 border border-white/10'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="p-4 bg-dark-800/50 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-2">Account Details</h3>
              <p className="text-gray-400">Name: {user?.name}</p>
              <p className="text-gray-400">Email: {user?.email}</p>
              <p className="text-gray-400">Role: <span className="capitalize">{user?.role}</span></p>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gold-500 text-dark-950 rounded-lg font-medium hover:bg-gold-400"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Save Button (for non-account tabs) */}
        {activeTab !== 'account' && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-gold-500 text-dark-950 rounded-lg font-medium hover:bg-gold-400 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

