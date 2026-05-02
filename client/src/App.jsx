import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CustomerProvider } from './context/CustomerContext'

// Marketplace Pages
import Landing from './pages/marketplace/Landing'
import SalonProfile from './pages/marketplace/SalonProfile'
import BookingStatus from './pages/marketplace/BookingStatus'
import SalonOwnerRegister from './pages/marketplace/SalonOwnerRegister'
import SalonOwnerLogin from './pages/marketplace/SalonOwnerLogin'
import SalonOwnerDashboard from './pages/marketplace/SalonOwnerDashboard'
import SalonOwnerServices from './pages/marketplace/SalonOwnerServices'
import SalonOwnerStylists from './pages/marketplace/SalonOwnerStylists'
import SalonOwnerBookings from './pages/marketplace/SalonOwnerBookings'
import SalonOwnerReviews from './pages/marketplace/SalonOwnerReviews'
import SalonOwnerSettings from './pages/marketplace/SalonOwnerSettings'
import SalonOwnerWalkin from './pages/marketplace/SalonOwnerWalkin'
import SalonOwnerDailyReport from './pages/marketplace/SalonOwnerDailyReport'
import SalonOwnerCustomers from './pages/marketplace/SalonOwnerCustomers'
import SalonOwnerStaffPay from './pages/marketplace/SalonOwnerStaffPay'
import SalonOwnerAnalytics from './pages/marketplace/SalonOwnerAnalytics'

// Admin Pages (salon owner dashboard - reuse existing)
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Bookings from './pages/admin/Bookings'
import AdminServices from './pages/admin/Services'
import Stylists from './pages/admin/Stylists'
import Messages from './pages/admin/Messages'
import Settings from './pages/admin/Settings'

// Legacy single-salon components
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Services from './components/Services'
import Pricing from './components/Pricing'
import Gallery from './components/Gallery'
import Team from './components/Team'
import Testimonials from './components/Testimonials'
import BookingModal from './components/BookingModal'
import Contact from './components/Contact'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import Loader from './components/Loader'
import InstallPrompt from './components/marketplace/InstallPrompt'

// Protected Route for salon owner admin
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/admin" replace />
  return children
}

// Legacy single-salon website
function PublicWebsite() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 2000); return () => clearTimeout(t) }, [])
  return (
    <div className="legacy-dark-theme">
      <AnimatePresence>{isLoading && <Loader />}</AnimatePresence>
      <div className="noise-overlay" />
      <Navbar onBookClick={() => setIsBookingOpen(true)} />
      <main>
        <Hero onBookClick={() => setIsBookingOpen(true)} />
        <About />
        <Services />
        <Pricing onBookClick={() => setIsBookingOpen(true)} />
        <Gallery />
        <Team />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <AnimatePresence>{isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}</AnimatePresence>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* ========== PUBLIC ========== */}
      <Route path="/" element={<Landing />} />
      <Route path="/salon/:slug" element={<SalonProfile />} />
      <Route path="/booking/:code" element={<BookingStatus />} />

      {/* Redirects for removed marketplace/for-salon-owners pages */}
      <Route path="/discover" element={<Navigate to="/" replace />} />
      <Route path="/for-salon-owners" element={<Navigate to="/" replace />} />

      {/* ========== SALON OWNER ========== */}
      <Route path="/salon-owner/register" element={<SalonOwnerRegister />} />
      <Route path="/salon-owner/login" element={<SalonOwnerLogin />} />
      <Route path="/salon-owner/dashboard" element={<SalonOwnerDashboard />} />
      <Route path="/salon-owner/services" element={<SalonOwnerServices />} />
      <Route path="/salon-owner/stylists" element={<SalonOwnerStylists />} />
      <Route path="/salon-owner/bookings" element={<SalonOwnerBookings />} />
      <Route path="/salon-owner/reviews" element={<SalonOwnerReviews />} />
      <Route path="/salon-owner/settings" element={<SalonOwnerSettings />} />
      <Route path="/salon-owner/walkin" element={<SalonOwnerWalkin />} />
      <Route path="/salon-owner/daily-report" element={<SalonOwnerDailyReport />} />
      <Route path="/salon-owner/customers" element={<SalonOwnerCustomers />} />
      <Route path="/salon-owner/staff-pay" element={<SalonOwnerStaffPay />} />
      <Route path="/salon-owner/analytics" element={<SalonOwnerAnalytics />} />

      {/* ========== ADMIN (legacy salon owner dashboard) ========== */}
      <Route path="/admin" element={<Login />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/stylists" element={<ProtectedRoute><Stylists /></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      {/* ========== LEGACY ========== */}
      <Route path="/legacy" element={<PublicWebsite />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <CustomerProvider>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(147, 51, 234, 0.3)',
            },
          }}
        />
        <AppRoutes />
        <InstallPrompt />
      </AuthProvider>
    </CustomerProvider>
  )
}

export default App
