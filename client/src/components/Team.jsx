import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { FiInstagram, FiPhone } from 'react-icons/fi'

const team = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    role: 'Master Stylist',
    experience: '15 years',
    speciality: 'Classic Cuts & Styling',
    avatar: '👨‍🦱',
    color: 'from-amber-500/20 to-orange-500/20'
  },
  {
    id: 2,
    name: 'Amit Sharma',
    role: 'Senior Barber',
    experience: '10 years',
    speciality: 'Beard Styling & Shaves',
    avatar: '🧔‍♂️',
    color: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    id: 3,
    name: 'Priya Deshmukh',
    role: 'Color Specialist',
    experience: '8 years',
    speciality: 'Hair Coloring & Treatments',
    avatar: '👩‍🦰',
    color: 'from-purple-500/20 to-pink-500/20'
  },
  {
    id: 4,
    name: 'Vikram Patel',
    role: 'Junior Stylist',
    experience: '3 years',
    speciality: 'Modern & Trendy Cuts',
    avatar: '👨‍🎨',
    color: 'from-blue-500/20 to-indigo-500/20'
  }
]

export default function Team() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="team" className="relative py-24 overflow-hidden">
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
          <span className="section-subtitle">Meet The Experts</span>
          <h2 className="section-title text-white mt-2">
            Our <span className="text-gradient">Team</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Our skilled team of professionals are dedicated to giving you the 
            perfect look. Each stylist brings their unique expertise and passion.
          </p>
        </motion.div>

        {/* Team grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative glass-card overflow-hidden hover:border-gold-500/30 transition-all duration-300">
                {/* Avatar area */}
                <div className={`relative h-48 bg-gradient-to-br ${member.color} flex items-center justify-center`}>
                  <span className="text-8xl transition-transform duration-300 group-hover:scale-110">
                    {member.avatar}
                  </span>
                  
                  {/* Social overlay */}
                  <div className="absolute inset-0 bg-dark-950/80 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 hover:bg-gold-500 hover:text-dark-950 transition-colors">
                      <FiInstagram size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 hover:bg-gold-500 hover:text-dark-950 transition-colors">
                      <FiPhone size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-white group-hover:text-gold-400 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-gold-500 text-sm font-medium mb-3">{member.role}</p>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>{member.experience} experience</p>
                    <p className="text-gray-400">{member.speciality}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Join team CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-dark-800 border border-white/5">
            <span className="text-gray-400">Want to join our team?</span>
            <a href="#contact" className="text-gold-400 font-semibold hover:text-gold-300 transition-colors">
              Get in touch →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

