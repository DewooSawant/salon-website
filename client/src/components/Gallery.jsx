import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const galleryImages = [
  {
    id: 1,
    title: 'Classic Fade',
    category: 'Haircuts',
    emoji: '💇‍♂️',
    color: 'from-amber-500/20 to-orange-500/20'
  },
  {
    id: 2,
    title: 'Beard Styling',
    category: 'Beard',
    emoji: '🧔',
    color: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    id: 3,
    title: 'Modern Pompadour',
    category: 'Haircuts',
    emoji: '✨',
    color: 'from-blue-500/20 to-indigo-500/20'
  },
  {
    id: 4,
    title: 'Hair Coloring',
    category: 'Color',
    emoji: '🎨',
    color: 'from-purple-500/20 to-pink-500/20'
  },
  {
    id: 5,
    title: 'Salon Interior',
    category: 'Ambiance',
    emoji: '🏪',
    color: 'from-gold-500/20 to-amber-500/20'
  },
  {
    id: 6,
    title: 'Relaxation Zone',
    category: 'Ambiance',
    emoji: '🛋️',
    color: 'from-rose-500/20 to-red-500/20'
  }
]

const categories = ['All', 'Haircuts', 'Beard', 'Color', 'Ambiance']

export default function Gallery() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedImage, setSelectedImage] = useState(null)

  const filteredImages = activeCategory === 'All' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === activeCategory)

  const navigateImage = (direction) => {
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id)
    let newIndex
    if (direction === 'next') {
      newIndex = currentIndex === filteredImages.length - 1 ? 0 : currentIndex + 1
    } else {
      newIndex = currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1
    }
    setSelectedImage(filteredImages[newIndex])
  }

  return (
    <section id="gallery" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dark-950" />
      
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="section-subtitle">Our Work</span>
          <h2 className="section-title text-white mt-2">
            Style <span className="text-gradient">Gallery</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Browse through our collection of transformations and get inspired 
            for your next visit.
          </p>
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950'
                  : 'bg-dark-800 text-gray-400 hover:text-gold-400 border border-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Gallery grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onClick={() => setSelectedImage(image)}
                className="group cursor-pointer"
              >
                <div className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${image.color} border border-white/10`}>
                  {/* Emoji placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-7xl md:text-8xl transition-transform duration-300 group-hover:scale-110">
                    {image.emoji}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold">{image.title}</h3>
                    <p className="text-gold-400 text-sm">{image.category}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/95 backdrop-blur-xl p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close button */}
            <button 
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white"
              onClick={() => setSelectedImage(null)}
            >
              <FiX size={32} />
            </button>
            
            {/* Navigation */}
            <button 
              className="absolute left-4 md:left-8 p-2 text-white/70 hover:text-white"
              onClick={(e) => { e.stopPropagation(); navigateImage('prev') }}
            >
              <FiChevronLeft size={40} />
            </button>
            <button 
              className="absolute right-4 md:right-8 p-2 text-white/70 hover:text-white"
              onClick={(e) => { e.stopPropagation(); navigateImage('next') }}
            >
              <FiChevronRight size={40} />
            </button>

            {/* Image */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-2xl aspect-square rounded-3xl bg-gradient-to-br ${selectedImage.color} border border-white/20 overflow-hidden`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-[12rem]">
                {selectedImage.emoji}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-dark-950 to-transparent">
                <h3 className="text-2xl font-display font-semibold text-white">{selectedImage.title}</h3>
                <p className="text-gold-400">{selectedImage.category}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

