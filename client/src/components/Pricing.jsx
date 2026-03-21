import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { FiCheck, FiStar } from 'react-icons/fi'

const packages = [
  {
    id: 1,
    name: 'Basic',
    subtitle: 'Quick Refresh',
    price: '₹199',
    features: [
      'Classic Haircut',
      'Basic Styling',
      'Face Wash'
    ],
    popular: false
  },
  {
    id: 2,
    name: 'Premium',
    subtitle: 'Most Popular',
    price: '₹499',
    features: [
      'Premium Haircut',
      'Beard Styling',
      'Head Massage',
      'Face Wash',
      'Hair Styling'
    ],
    popular: true
  },
  {
    id: 3,
    name: 'Royal',
    subtitle: 'Complete Package',
    price: '₹999',
    features: [
      'Premium Haircut',
      'Royal Shave',
      'Beard Styling',
      'Hair Spa',
      'Head Massage',
      'Facial',
      'Complimentary Beverage'
    ],
    popular: false
  }
]

export default function Pricing({ onBookClick }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
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
          <span className="section-subtitle">Affordable Luxury</span>
          <h2 className="section-title text-white mt-2">
            Our <span className="text-gradient">Packages</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Choose from our carefully curated packages designed to give you the 
            complete grooming experience at great value.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative group ${pkg.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              <div className={`h-full glass-card p-8 transition-all duration-300 ${
                pkg.popular 
                  ? 'border-gold-500/50 bg-gradient-to-b from-gold-500/10 to-transparent' 
                  : 'hover:border-gold-500/30'
              }`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full flex items-center gap-1">
                    <FiStar className="text-dark-950" size={14} />
                    <span className="text-sm font-semibold text-dark-950">Most Popular</span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-display font-semibold text-white mb-1">
                    {pkg.name}
                  </h3>
                  <p className="text-gold-400 text-sm italic">{pkg.subtitle}</p>
                </div>
                
                <div className="text-center mb-8">
                  <span className="text-5xl font-bold text-gradient">{pkg.price}</span>
                  <span className="text-gray-500 ml-2">/ visit</span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                        <FiCheck className="text-gold-400 text-xs" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={onBookClick}
                  className={`w-full py-4 rounded-full font-semibold transition-all duration-300 ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-dark-950 hover:shadow-lg hover:shadow-gold-500/25'
                      : 'border-2 border-gold-500/50 text-gold-400 hover:bg-gold-500/10'
                  }`}
                >
                  Book Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center text-gray-500 text-sm mt-12"
        >
          * All prices are inclusive of GST. Walk-in customers welcome!
        </motion.p>
      </div>
    </section>
  )
}

