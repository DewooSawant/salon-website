import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const services = [
  {
    id: 1,
    name: 'Classic Haircut',
    description: 'Traditional cuts with a modern touch, tailored to your face shape',
    price: '₹150',
    duration: '30 min',
    icon: '✂️',
    popular: false
  },
  {
    id: 2,
    name: 'Premium Haircut',
    description: 'Includes consultation, cut, wash, and styling with premium products',
    price: '₹300',
    duration: '45 min',
    icon: '💇‍♂️',
    popular: true
  },
  {
    id: 3,
    name: 'Beard Styling',
    description: 'Perfect shaping and trimming for a well-groomed beard',
    price: '₹100',
    duration: '20 min',
    icon: '🧔',
    popular: false
  },
  {
    id: 4,
    name: 'Royal Shave',
    description: 'Hot towel treatment with precision shaving and aftercare',
    price: '₹200',
    duration: '30 min',
    icon: '🪒',
    popular: false
  },
  {
    id: 5,
    name: 'Hair Color',
    description: 'Professional coloring with ammonia-free premium dyes',
    price: '₹500',
    duration: '60 min',
    icon: '🎨',
    popular: true
  },
  {
    id: 6,
    name: 'Hair Spa',
    description: 'Deep conditioning treatment for healthy, shiny hair',
    price: '₹400',
    duration: '45 min',
    icon: '🧴',
    popular: false
  },
  {
    id: 7,
    name: 'Head Massage',
    description: 'Relaxing scalp massage to relieve stress and promote growth',
    price: '₹150',
    duration: '20 min',
    icon: '💆‍♂️',
    popular: false
  },
  {
    id: 8,
    name: 'Facial',
    description: 'Deep cleansing facial for glowing, refreshed skin',
    price: '₹350',
    duration: '40 min',
    icon: '✨',
    popular: false
  }
]

export default function Services() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="services" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dark-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-500/5 via-transparent to-transparent" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="section-subtitle">What We Offer</span>
          <h2 className="section-title text-white mt-2">
            Our <span className="text-gradient">Services</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            From classic cuts to modern styles, we offer a comprehensive range of 
            grooming services to keep you looking your best.
          </p>
        </motion.div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative glass-card p-6 hover:border-gold-500/30 transition-all duration-300 ${
                service.popular ? 'ring-1 ring-gold-500/30' : ''
              }`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full text-xs font-semibold text-dark-950">
                  Popular
                </div>
              )}
              
              <div className="text-4xl mb-4">{service.icon}</div>
              
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                {service.name}
              </h3>
              
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                {service.description}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-2xl font-bold text-gradient">{service.price}</span>
                <span className="text-sm text-gray-500">{service.duration}</span>
              </div>
              
              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold-500/0 to-gold-500/0 group-hover:from-gold-500/5 group-hover:to-transparent transition-all duration-300" />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">
            Can't find what you're looking for? We offer custom services too!
          </p>
          <a href="#contact" className="btn-secondary inline-block">
            Contact Us
          </a>
        </motion.div>
      </div>
    </section>
  )
}

