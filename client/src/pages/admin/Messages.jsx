import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiMail, FiPhone, FiCheck, FiTrash2, FiMessageCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Messages() {
  const { api } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await api.get('/admin/messages')
      setMessages(response.data)
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.patch(`/admin/messages/${id}/read`)
      setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, is_read: true } : m
      ))
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const deleteMessage = async (id) => {
    if (!confirm('Delete this message?')) return
    try {
      await api.delete(`/admin/messages/${id}`)
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Message deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.is_read
    if (filter === 'read') return m.is_read
    return true
  })

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffHours = (now - date) / (1000 * 60 * 60)
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <AdminLayout title="Messages">
      <div className="glass-card">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Contact Messages</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-sm rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {['all', 'unread', 'read'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                  filter === f
                    ? 'bg-gold-500/20 text-gold-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FiMail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredMessages.map((message) => (
              <motion.div
                key={message.id}
                layout
                className={`p-6 transition-colors ${
                  !message.is_read ? 'bg-gold-500/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {!message.is_read && (
                        <span className="w-2 h-2 bg-gold-500 rounded-full" />
                      )}
                      <h3 className={`font-medium ${message.is_read ? 'text-gray-300' : 'text-white'}`}>
                        {message.name}
                      </h3>
                      <span className="text-gray-500 text-sm">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiPhone size={14} />
                        {message.phone}
                      </span>
                      {message.email && (
                        <span className="flex items-center gap-1">
                          <FiMail size={14} />
                          {message.email}
                        </span>
                      )}
                    </div>

                    {message.subject && (
                      <p className="text-gray-300 font-medium mb-1">{message.subject}</p>
                    )}
                    <p className="text-gray-400">{message.message}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!message.is_read && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        title="Mark as read"
                      >
                        <FiCheck size={16} />
                      </button>
                    )}
                    <a
                      href={`https://wa.me/${message.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      title="Reply on WhatsApp"
                    >
                      <FiMessageCircle size={16} />
                    </a>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

