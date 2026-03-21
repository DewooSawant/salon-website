import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend } from 'react-icons/fi'
import toast from 'react-hot-toast'

const contactInfo = [
  {
    icon: FiMapPin,
    title: 'Visit Us',
    lines: [
      'Glamour Cuts Salon',
      'Shop No. 5, Keshav Park',
      'Near Keshav Nagar Chowk',
      'Keshav Nagar, Pune - 411036'
    ]
  },
  {
    icon: FiPhone,
    title: 'Call Us',
    lines: [
      '+91 98765 43210',
      '+91 87654 32109'
    ]
  },
  {
    icon: FiMail,
    title: 'Email Us',
    lines: [
      'hello@glamourcuts.in',
      'booking@glamourcuts.in'
    ]
  },
  {
    icon: FiClock,
    title: 'Working Hours',
    lines: [
      'Monday - Saturday',
      '10:00 AM - 9:00 PM',
      'Sunday: Closed'
    ]
  }
]

export default function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Message sent successfully! We\'ll get back to you soon.')
    setFormData({ name: '', phone: '', email: '', message: '' })
    setIsSubmitting(false)
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <section id="contact" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="section-subtitle">Get In Touch</span>
          <h2 className="section-title text-white mt-2">
            Contact <span className="text-gradient">Us</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Have questions or want to book an appointment? Reach out to us 
            and we'll be happy to help you.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {contactInfo.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="glass-card p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4">
                    <item.icon className="text-gold-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  {item.lines.map((line, i) => (
                    <p key={i} className="text-gray-400 text-sm">{line}</p>
                  ))}
                </motion.div>
              ))}
            </div>

            {/* Map placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="glass-card h-64 overflow-hidden"
            >
              <div className="w-full h-full bg-gradient-to-br from-gold-500/10 to-gold-600/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-gray-400">Keshav Nagar, Pune</p>
                  <a 
                    href="https://maps.google.com/?q=Keshav+Nagar,+Pune" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gold-400 text-sm hover:text-gold-300 transition-colors mt-2 inline-block"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass-card p-8">
              <h3 className="text-2xl font-display font-semibold text-white mb-6">
                Send us a Message
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Your Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10 text-white placeholder-gray-500 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      Send Message
                      <FiSend />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

