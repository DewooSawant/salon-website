import { useState, useEffect, useRef } from 'react'
import { FiSave, FiMapPin, FiUpload, FiCamera, FiX } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function SalonOwnerSettings() {
  const api = useSalonOwnerApi()
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => { fetchSalon() }, [])

  const fetchSalon = async () => {
    try {
      const res = await api.get('/salon-owner/salon')
      const s = res.data.salon
      setSalon(s)
      setForm({
        name: s.name || '',
        tagline: s.tagline || '',
        description: s.description || '',
        address: s.address || '',
        city: s.city || '',
        state: s.state || '',
        pincode: s.pincode || '',
        phone: s.phone || '',
        whatsapp: s.whatsapp || '',
        email: s.email || '',
        website: s.website || '',
        type: s.type || 'unisex',
        opening_time: s.opening_time?.slice(0, 5) || '10:00',
        closing_time: s.closing_time?.slice(0, 5) || '21:00',
        slot_duration: s.slot_duration || 30,
        working_days: (() => {
          try { return typeof s.working_days === 'string' ? JSON.parse(s.working_days) : (s.working_days || []) }
          catch { return [] }
        })(),
        logo_url: s.logo_url || '',
        cover_image_url: s.cover_image_url || '',
        google_maps_url: s.google_maps_url || '',
        social_instagram: s.social_instagram || '',
        social_facebook: s.social_facebook || '',
        latitude: s.latitude || '',
        longitude: s.longitude || '',
        auto_confirm_bookings: s.auto_confirm_bookings || false,
      })
    } catch { toast.error('Failed to load salon info') }
    finally { setLoading(false) }
  }

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      working_days: f.working_days.includes(day)
        ? f.working_days.filter(d => d !== day)
        : [...f.working_days, day]
    }))
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('latitude', pos.coords.latitude.toFixed(6))
        update('longitude', pos.coords.longitude.toFixed(6))
        toast.success('Location updated!')
      },
      () => toast.error('Could not get location')
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = {
        ...form,
        opening_time: form.opening_time + ':00',
        closing_time: form.closing_time + ':00',
        slot_duration: parseInt(form.slot_duration),
      }
      await api.put('/salon-owner/salon', data)
      // Update local storage
      const info = JSON.parse(localStorage.getItem('salonInfo') || '{}')
      info.name = form.name
      localStorage.setItem('salonInfo', JSON.stringify(info))
      toast.success('Salon settings saved!')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <SalonOwnerLayout title="Salon Settings">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SalonOwnerLayout>
    )
  }

  return (
    <SalonOwnerLayout title="Salon Settings">
      <div className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <Section title="Basic Information">
          <div className="space-y-4">
            <Field label="Salon Name *" value={form.name} onChange={v => update('name', v)} placeholder="Your Salon Name" />
            <Field label="Tagline" value={form.tagline} onChange={v => update('tagline', v)} placeholder="e.g. Premium Grooming Experience" />
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                rows={3} placeholder="Tell customers about your salon..."
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 resize-none text-gray-700" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Salon Type</label>
              <div className="flex gap-2">
                {['men', 'women', 'unisex'].map(t => (
                  <button key={t} type="button" onClick={() => update('type', t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition ${form.type === t ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t === 'men' ? '👨 Men' : t === 'women' ? '👩 Women' : '👫 Unisex'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="+91..." />
            <Field label="WhatsApp" value={form.whatsapp} onChange={v => update('whatsapp', v)} placeholder="+91..." />
            <Field label="Email" value={form.email} onChange={v => update('email', v)} placeholder="salon@email.com" type="email" />
            <Field label="Website" value={form.website} onChange={v => update('website', v)} placeholder="https://..." />
          </div>
        </Section>

        {/* Address */}
        <Section title="Address & Location">
          <div className="space-y-4">
            <Field label="Address *" value={form.address} onChange={v => update('address', v)} placeholder="Full street address" />
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="City *" value={form.city} onChange={v => update('city', v)} placeholder="Pune" />
              <Field label="State" value={form.state} onChange={v => update('state', v)} placeholder="Maharashtra" />
              <Field label="Pincode" value={form.pincode} onChange={v => update('pincode', v)} placeholder="411036" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">GPS Location</label>
              <button type="button" onClick={detectLocation}
                className="w-full sm:w-auto mb-3 px-4 py-2.5 bg-brand-50 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-100 transition flex items-center gap-2">
                <FiMapPin className="w-4 h-4" /> Auto-Detect Location
              </button>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude" value={form.latitude} onChange={v => update('latitude', v)} placeholder="18.5204" />
                <Field label="Longitude" value={form.longitude} onChange={v => update('longitude', v)} placeholder="73.8567" />
              </div>
            </div>
            <Field label="Google Maps URL" value={form.google_maps_url} onChange={v => update('google_maps_url', v)} placeholder="https://maps.google.com/..." />
          </div>
        </Section>

        {/* Working Hours */}
        <Section title="Working Hours">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Opening Time</label>
                <input type="time" value={form.opening_time} onChange={e => update('opening_time', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Closing Time</label>
                <input type="time" value={form.closing_time} onChange={e => update('closing_time', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Slot Duration (minutes)</label>
              <select value={form.slot_duration} onChange={e => update('slot_duration', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {WORKING_DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      form.working_days.includes(day) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Booking Settings */}
        <Section title="Booking & Notifications">
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h4 className="font-medium text-gray-900">Auto-Confirm Bookings</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Automatically confirm new online bookings without manual approval.
                  Customers will see their booking as "Confirmed" immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => update('auto_confirm_bookings', !form.auto_confirm_bookings)}
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                  form.auto_confirm_bookings ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.auto_confirm_bookings ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-1">How notifications work</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• You'll see a 🔔 notification bell in the top bar with a badge count</li>
                <li>• A sound will play when a new booking arrives</li>
                <li>• Browser notifications will pop up (allow when prompted)</li>
                <li>• You can Confirm or Decline bookings from the notification dropdown</li>
                <li>• Quick WhatsApp link to message the customer directly</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Images */}
        <Section title="Salon Images">
          <div className="space-y-6">
            <ImageUpload
              label="Cover Photo"
              hint="This is the main banner image customers see. Recommended: 1200x400px"
              currentUrl={form.cover_image_url}
              field="cover_image_url"
              api={api}
              onUploaded={(url) => update('cover_image_url', url)}
              aspectRatio="aspect-[3/1]"
            />
            <ImageUpload
              label="Salon Logo"
              hint="Your salon's logo or profile picture. Recommended: 200x200px"
              currentUrl={form.logo_url}
              field="logo_url"
              api={api}
              onUploaded={(url) => update('logo_url', url)}
              aspectRatio="aspect-square w-40"
            />
          </div>
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <div className="space-y-4">
            <Field label="Instagram" value={form.social_instagram} onChange={v => update('social_instagram', v)} placeholder="@yoursalon" />
            <Field label="Facebook" value={form.social_facebook} onChange={v => update('social_facebook', v)} placeholder="https://facebook.com/..." />
          </div>
        </Section>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-gray-50 py-4 border-t border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition disabled:opacity-50 shadow-sm">
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </SalonOwnerLayout>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-brand-400 text-gray-700" />
    </div>
  )
}

function ImageUpload({ label, hint, currentUrl, field, api, onUploaded, aspectRatio = 'aspect-video' }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)

  const imageUrl = preview || currentUrl
  // Build full URL for display
  const displayUrl = imageUrl
    ? imageUrl.startsWith('http') ? imageUrl : `${API_URL.replace('/api', '')}${imageUrl}`
    : null

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('field', field)
      const res = await api.post('/salon-owner/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onUploaded(res.data.url)
      setPreview(null) // Clear preview, use actual URL now
      toast.success('Image uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    onUploaded('')
    setPreview(null)
    try {
      await api.put('/salon-owner/salon', { [field]: '' })
    } catch {}
  }

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}

      <div className={`relative ${aspectRatio} rounded-xl overflow-hidden border-2 border-dashed transition-colors ${
        displayUrl ? 'border-transparent' : 'border-gray-200 hover:border-purple-300'
      } bg-gray-50`}>
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
              <button
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 bg-white rounded-xl text-sm font-medium text-gray-700 shadow-lg flex items-center gap-2 hover:bg-gray-100 transition"
              >
                <FiCamera className="w-4 h-4" /> Change
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 hover:bg-red-600 transition"
              >
                <FiX className="w-4 h-4" /> Remove
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition"
          >
            {uploading ? (
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                  <FiUpload className="w-5 h-5 text-brand-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Click to upload</span>
                <span className="text-xs text-gray-400">JPG, PNG, WebP up to 5MB</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
