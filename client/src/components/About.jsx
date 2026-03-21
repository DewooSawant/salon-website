import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { FiCheckCircle, FiScissors, FiHeart, FiStar } from 'react-icons/fi'

const features = [
  {
    icon: FiScissors,
    title: 'Expert Stylists',
    description: 'Our team brings years of experience and training from top institutes.'
  },
  {
    icon: FiHeart,
    title: 'Premium Products',
    description: 'We use only the finest professional-grade products for your hair.'
  },
  {
    icon: FiStar,
    title: 'Personalized Care',
    description: 'Every service is tailored to match your unique style and preferences.'
  }
]

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="about" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
              {/* Decorative frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold-400/20 to-gold-600/20 rounded-3xl" />
              <div className="absolute inset-4 rounded-2xl bg-dark-800 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-9xl mb-6">✂️</div>
                  <div className="font-display text-3xl text-gradient italic mb-2">
                    Since 2014
                  </div>
                  <p className="text-gray-400">
                    Crafting perfect styles in Keshav Nagar
                  </p>
                </div>
              </div>
              
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-gold-500/50 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-gold-500/50 rounded-br-3xl" />
            </div>
            
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -right-6 glass-card p-6 text-center"
            >
              <div className="text-4xl font-bold text-gradient">10+</div>
              <div className="text-sm text-gray-400">Years of Excellence</div>
            </motion.div>
          </motion.div>

          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="section-subtitle">Our Story</span>
            <h2 className="section-title text-white mt-2 mb-6">
              Where Style
              <span className="text-gradient"> Meets Tradition</span>
            </h2>
            
            <p className="text-gray-400 text-lg mb-6 leading-relaxed">
              Welcome to Glamour Cuts, Keshav Nagar's premier destination for men's grooming. 
              Since 2014, we've been transforming looks and boosting confidence with our 
              exceptional services.
            </p>
            
            <p className="text-gray-400 mb-8 leading-relaxed">
              Our salon combines traditional barbering techniques with modern styling trends, 
              ensuring you always leave looking and feeling your best. From classic cuts to 
              contemporary styles, our expert team is dedicated to delivering perfection.
            </p>

            {/* Features */}
            <div className="space-y-6 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="text-gold-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-gray-500 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-3">
              {['Hygienic Environment', 'AC Salon', 'Easy Parking', 'Card Accepted'].map((item) => (
                <div key={item} className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-white/5">
                  <FiCheckCircle className="text-gold-400 text-sm" />
                  <span className="text-sm text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

