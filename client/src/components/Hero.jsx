import { motion } from 'framer-motion'
import { FiArrowRight, FiStar, FiAward, FiUsers } from 'react-icons/fi'

export default function Hero({ onBookClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
        
        {/* Decorative circles */}
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(201, 160, 62, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(201, 160, 62, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-32 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 mb-6"
            >
              <FiStar className="text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">
                #1 Rated Salon in Keshav Nagar
              </span>
            </motion.div>
            
            <h1 className="section-title text-white mb-6">
              Elevate Your
              <span className="block text-gradient">Style Game</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-8 max-w-lg leading-relaxed">
              Experience premium grooming services in the heart of Pune. 
              Where tradition meets modern style, and every cut tells your story.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <button onClick={onBookClick} className="btn-primary flex items-center gap-2">
                Book Your Slot
                <FiArrowRight />
              </button>
              <a href="#services" className="btn-secondary">
                Explore Services
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gradient mb-1">10+</div>
                <div className="text-sm text-gray-500">Years Experience</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gradient mb-1">5K+</div>
                <div className="text-sm text-gray-500">Happy Clients</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gradient mb-1">4.9</div>
                <div className="text-sm text-gray-500">Rating</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Hero image/visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square">
              {/* Main circle */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/20 backdrop-blur-xl border border-gold-500/20" />
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-12 right-12 glass-card p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <FiAward className="text-gold-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Award Winning</div>
                  <div className="text-xs text-gray-500">Best Salon 2024</div>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute bottom-20 left-0 glass-card p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center">
                  <FiUsers className="text-gold-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Expert Stylists</div>
                  <div className="text-xs text-gray-500">Professional Team</div>
                </div>
              </motion.div>
              
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">💇‍♂️</div>
                  <div className="font-display text-2xl text-gradient italic">
                    Premium Grooming
                  </div>
                </div>
              </div>
              
              {/* Rotating border */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-gold-500/20"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-gold-500/30 flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-gold-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}

