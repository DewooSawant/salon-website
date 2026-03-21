import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection } from './db/config_pg.js'

// Legacy routes (single-salon, kept for backward compatibility)
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import bookingsRouter from './routes/bookings.js'
import servicesRouter from './routes/services.js'
import contactRouter from './routes/contact.js'

// V2 Marketplace routes
import salonsRouter from './routes/salons.js'
import customersRouter from './routes/customers.js'
import salonOwnerRouter from './routes/salon-owner.js'
import marketplaceBookingsRouter from './routes/marketplace-bookings.js'
import otpAuthRouter from './routes/otp-auth.js'
import { authenticateCustomer, optionalAuth } from './middleware/auth_v2.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
    : 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Serve uploaded images as static files
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

// Test database connection
const dbConnected = await testConnection()

if (!dbConnected) {
  console.error(`
  Database Connection Failed! Check your MySQL configuration.
  Run 'npm run setup' to initialize the database.
  `)
}

// =====================================================
// V2 MARKETPLACE ROUTES
// =====================================================

// Public: Salon discovery
app.use('/api/salons', salonsRouter)

// Customer auth & profile
app.use('/api/customers', optionalAuth, customersRouter)

// Salon owner management
app.use('/api/salon-owner', salonOwnerRouter)

// OTP Authentication (phone-based login)
app.use('/api/otp', otpAuthRouter)

// Marketplace bookings (cross-salon)
app.use('/api/marketplace/bookings', marketplaceBookingsRouter)

// =====================================================
// LEGACY ROUTES (single-salon, backward compatible)
// =====================================================
app.use('/api/services', servicesRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/contact', contactRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)

// =====================================================
// HEALTH & INFO
// =====================================================
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection()
  res.json({
    status: dbStatus ? 'ok' : 'degraded',
    message: 'SalonNear Marketplace API',
    database: dbStatus ? 'connected' : 'disconnected',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/api', (req, res) => {
  res.json({
    name: 'SalonNear Marketplace API',
    version: '3.0.0',
    description: 'Multi-salon marketplace platform',
    endpoints: {
      marketplace: {
        nearbySalons: 'GET /api/salons/nearby?lat=&lng=&radius=5',
        salonProfile: 'GET /api/salons/:slug',
        availableSlots: 'GET /api/salons/:slug/available-slots/:date',
        createBooking: 'POST /api/marketplace/bookings',
        trackBooking: 'GET /api/marketplace/bookings/track/:code',
        cancelBooking: 'PATCH /api/marketplace/bookings/:id/cancel'
      },
      customer: {
        register: 'POST /api/customers/register',
        login: 'POST /api/customers/login',
        profile: 'GET /api/customers/me',
        myBookings: 'GET /api/customers/bookings',
        favorites: 'GET/POST /api/customers/favorites',
        submitReview: 'POST /api/customers/reviews'
      },
      salonOwner: {
        register: 'POST /api/salon-owner/register',
        login: 'POST /api/salon-owner/login',
        dashboard: 'GET /api/salon-owner/dashboard',
        manageSalon: 'GET/PUT /api/salon-owner/salon',
        services: 'CRUD /api/salon-owner/services',
        stylists: 'CRUD /api/salon-owner/stylists',
        categories: 'CRUD /api/salon-owner/categories',
        bookings: 'GET /api/salon-owner/bookings',
        reviews: 'GET /api/salon-owner/reviews'
      },
      legacy: {
        note: 'Original single-salon routes still available at /api/services, /api/bookings, /api/auth, /api/admin'
      }
    }
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │   SalonNear Marketplace API v3.0                 │
  │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │
  │                                                  │
  │   Server:   http://localhost:${PORT}               │
  │   Database: ${dbConnected ? 'Connected' : 'Disconnected'}                        │
  │   Mode:     ${process.env.NODE_ENV || 'development'}                            │
  │   API Docs: http://localhost:${PORT}/api            │
  │                                                  │
  └──────────────────────────────────────────────────┘
  `)
})
