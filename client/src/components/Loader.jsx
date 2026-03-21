import { motion } from 'framer-motion'

export default function Loader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-950"
    >
      <div className="relative">
        {/* Animated scissors */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -20, 0, 20, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-6xl"
        >
          ✂️
        </motion.div>
        
        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <span className="font-display text-xl text-gold-400 italic">
            Glamour Cuts
          </span>
        </motion.div>
        
        {/* Decorative circles */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 -m-8 rounded-full border border-gold-500/30"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          className="absolute inset-0 -m-16 rounded-full border border-gold-500/20"
        />
      </div>
    </motion.div>
  )
}

