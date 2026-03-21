import { useState, useEffect, useRef, useCallback } from 'react'
import { FiBell, FiCheck, FiX, FiClock, FiExternalLink } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const POLL_INTERVAL = 15000 // 15 seconds

// Notification sound - short pleasant chime (base64 encoded tiny audio)
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(830, ctx.currentTime)
    osc.frequency.setValueAtTime(990, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(830, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch {}
}

const requestBrowserNotificationPermission = async () => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

const showBrowserNotification = (title, body, onClick) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'salon-booking',
      requireInteraction: true,
    })
    notif.onclick = () => {
      window.focus()
      onClick?.()
      notif.close()
    }
    // Auto-close after 30s
    setTimeout(() => notif.close(), 30000)
  } catch {}
}

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const prevUnreadRef = useRef(0)
  const dropdownRef = useRef(null)
  const token = localStorage.getItem('salonOwnerToken')

  const api = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await api.get('/salon-owner/notifications', { params: { limit: 15 } })
      setNotifications(res.data.notifications)
      const newUnread = res.data.unread_count

      // If unread count increased, we have a new booking!
      if (newUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
        const latestNotif = res.data.notifications[0]
        playNotificationSound()
        showBrowserNotification(
          latestNotif?.title || 'New Booking!',
          latestNotif?.message || 'You have a new booking',
          () => setIsOpen(true)
        )
        toast.success(latestNotif?.title || 'New booking received!', { duration: 5000 })
      }

      prevUnreadRef.current = newUnread
      setUnreadCount(newUnread)
    } catch {}
  }, [token])

  // Initial fetch + request browser notification permission
  useEffect(() => {
    fetchNotifications()
    requestBrowserNotificationPermission()
  }, [])

  // Poll every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    try {
      await api.patch('/salon-owner/notifications/read', {})
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  const confirmBooking = async (bookingId, notifId) => {
    try {
      await api.patch(`/salon-owner/bookings/${bookingId}/confirm`)
      toast.success('Booking confirmed!')
      // Mark notification as read
      await api.patch('/salon-owner/notifications/read', { ids: [notifId] })
      fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to confirm')
    }
  }

  const declineBooking = async (bookingId, notifId) => {
    if (!confirm('Decline this booking?')) return
    try {
      await api.patch(`/salon-owner/bookings/${bookingId}/decline`, { reason: 'Declined by salon owner' })
      toast.success('Booking declined')
      await api.patch('/salon-owner/notifications/read', { ids: [notifId] })
      fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to decline')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition"
      >
        <FiBell className={`w-5 h-5 ${unreadCount > 0 ? 'text-brand-600' : 'text-gray-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-600 font-medium hover:text-brand-700">
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FiBell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">You'll be notified when customers book</p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onConfirm={confirmBooking}
                  onDecline={declineBooking}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notif, onConfirm, onDecline }) {
  const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : (notif.data || {})
  const isNewBooking = notif.type === 'new_booking'
  const isPending = isNewBooking && !data.auto_confirmed

  // Build WhatsApp link for owner to message customer
  const customerPhone = data.customer_phone?.replace(/\D/g, '')
  const whatsappLink = customerPhone
    ? `https://wa.me/91${customerPhone}?text=${encodeURIComponent(
        `Hi ${data.customer_name}! Your booking at our salon is confirmed.\nCode: ${data.booking_code}\nDate: ${data.booking_date}\nServices: ${data.services}\nTotal: ₹${data.total_price}\n\nSee you soon!`
      )}`
    : null

  return (
    <div className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition ${!notif.is_read ? 'bg-brand-50/50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isNewBooking ? 'bg-brand-100' : 'bg-gray-100'
        }`}>
          <span className="text-lg">{isNewBooking ? '📅' : '🔔'}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + time */}
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notif.title}
            </p>
            <span className="text-xs text-gray-400 shrink-0">{formatTimeAgo(notif.created_at)}</span>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>

          {/* Booking code badge */}
          {data.booking_code && (
            <span className="inline-block mt-1.5 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-mono font-bold rounded">
              {data.booking_code}
            </span>
          )}

          {/* Actions for pending bookings */}
          {isPending && notif.booking_id && !notif.is_read && (
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => onConfirm(notif.booking_id, notif.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition"
              >
                <FiCheck className="w-3.5 h-3.5" /> Confirm
              </button>
              <button
                onClick={() => onDecline(notif.booking_id, notif.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition"
              >
                <FiX className="w-3.5 h-3.5" /> Decline
              </button>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition"
                >
                  <FaWhatsapp className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Auto-confirmed badge */}
          {data.auto_confirmed && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
              <FiCheck className="w-3 h-3" /> Auto-confirmed
            </span>
          )}

          {/* WhatsApp link for confirmed bookings */}
          {!isPending && whatsappLink && notif.is_read && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-green-600 font-medium hover:text-green-700"
            >
              <FaWhatsapp className="w-3 h-3" /> Message customer
            </a>
          )}
        </div>

        {/* Unread dot */}
        {!notif.is_read && (
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  )
}
