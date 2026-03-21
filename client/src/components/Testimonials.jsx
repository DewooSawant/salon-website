import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiStar } from 'react-icons/fi'

const testimonials = [
  {
    id: 1,
    name: 'Aniket Patil',
    location: 'Keshav Nagar',
    rating: 5,
    text: 'Best salon in the area! The staff is professional and the haircut quality is always top-notch. Been coming here for 2 years now.',
    avatar: '👨'
  },
  {
    id: 2,
    name: 'Sneha Kulkarni',
    location: 'Mundhwa',
    rating: 5,
    text: 'Amazing experience! The hair spa treatment was so relaxing and my hair feels incredible. The ambiance is premium.',
    avatar: '👩'
  },
  {
    id: 3,
    name: 'Rahul Joshi',
    location: 'Hadapsar',
    rating: 5,
    text: 'Rajesh sir is an amazing stylist. He understood exactly what I wanted and delivered perfectly. Highly recommended!',
    avatar: '👨‍💼'
  },
  {
    id: 4,
    name: 'Prashant More',
    location: 'Keshav Nagar',
    rating: 4,
    text: 'Great service and reasonable prices. The Royal package is worth every rupee. Clean and hygienic salon.',
    avatar: '🧑'
  },
  {
    id: 5,
    name: 'Vikash Singh',
    location: 'Wagholi',
    rating: 5,
    text: 'The beard styling here is exceptional. They take their time and ensure perfection. Love this place!',
    avatar: '🧔'
  },
  {
    id: 6,
    name: 'Ananya Desai',
    location: 'Viman Nagar',
    rating: 5,
    text: 'Got my hair colored here and it turned out beautiful! Priya is so talented. Will definitely come back.',
    avatar: '👩‍🦰'
  }
]

export default function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dark-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/5 via-transparent to-transparent" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="section-subtitle">Client Love</span>
          <h2 className="section-title text-white mt-2">
            What People <span className="text-gradient">Say</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our valued clients 
            have to say about their experience at Glamour Cuts.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 hover:border-gold-500/30 transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`${
                      i < testimonial.rating 
                        ? 'text-gold-400 fill-gold-400' 
                        : 'text-gray-600'
                    }`}
                    size={16}
                  />
                ))}
              </div>
              
              {/* Text */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Google rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-16"
        >
          <div className="flex items-center gap-3">
            <div className="text-4xl">⭐</div>
            <div>
              <div className="text-2xl font-bold text-gradient">4.9/5</div>
              <div className="text-sm text-gray-500">Google Rating</div>
            </div>
          </div>
          <div className="w-px h-12 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-3">
            <div className="text-4xl">💬</div>
            <div>
              <div className="text-2xl font-bold text-gradient">500+</div>
              <div className="text-sm text-gray-500">Reviews</div>
            </div>
          </div>
          <div className="w-px h-12 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-3">
            <div className="text-4xl">👥</div>
            <div>
              <div className="text-2xl font-bold text-gradient">5000+</div>
              <div className="text-sm text-gray-500">Happy Clients</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

