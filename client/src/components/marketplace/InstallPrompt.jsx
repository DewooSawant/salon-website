import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi'

let deferredPrompt = null

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    // iOS detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Android/Desktop - listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      deferredPrompt = e
      // Show after 30 seconds of browsing
      setTimeout(() => setShowPrompt(true), 30000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For iOS, show after 60 seconds
    if (ios) {
      setTimeout(() => setShowPrompt(true), 60000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      deferredPrompt = null
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-dismissed', Date.now().toString())
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-float border border-gray-200 p-4 flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shrink-0">
              <FiSmartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm">Install SalonNear</h3>
              {isIOS ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  Tap <span className="inline-flex items-center"><svg className="w-4 h-4 inline text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></svg></span> then "Add to Home Screen"
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">Get the app experience - quick access from your home screen</p>
              )}
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="mt-2 px-4 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition flex items-center gap-1"
                >
                  <FiDownload className="w-3 h-3" /> Install App
                </button>
              )}
            </div>
            <button onClick={handleDismiss} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 shrink-0">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
