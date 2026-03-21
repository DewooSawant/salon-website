import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function WhatsAppButton() {
  const [phoneNumber, setPhoneNumber] = useState('917249838616')
  
  useEffect(() => {
    // Fetch salon WhatsApp number from settings
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/services/salon/settings`)
        if (response.data?.whatsapp) {
          setPhoneNumber(response.data.whatsapp)
        }
      } catch (error) {
        console.error('Failed to fetch salon settings')
      }
    }
    fetchSettings()
  }, [])

  const message = 'Hi! I would like to book an appointment at Glamour Cuts.'
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: 'spring' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 transition-shadow"
      style={{ 
        bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px) + 1rem)',
        right: 'max(1.5rem, env(safe-area-inset-right, 0px) + 0.5rem)'
      }}
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp className="text-white text-2xl sm:text-3xl" />
      
      {/* Ping animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
    </motion.a>
  )
}

