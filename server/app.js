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
import salonOwnerRouter from './routes/salon-owner.js'
import marketplaceBookingsRouter from './routes/marketplace-bookings.js'

dotenv.config()

const app = express()

// CORS: allow local dev, Vercel previews, and any domain listed in FRONTEND_URL
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    const allowed = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
      : ['http://localhost:3000']
    if (
      allowed.some(u => origin === u) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.stylo.sbs') ||
      origin === 'https://stylo.sbs' ||
      origin.startsWith('http://localhost')
    ) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}
app.use(cors(corsOptions))
app.use(express.json())

// =====================================================
// V2 MARKETPLACE ROUTES
// =====================================================
app.use('/api/salons', salonsRouter)
app.use('/api/salon-owner', salonOwnerRouter)
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
    database: dbStatus ? 'connected' : 'disconnected',
    version: '3.1.0',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api', (req, res) => {
  res.json({
    name: 'Stylo Marketplace API',
    version: '3.1.0',
    endpoints: {
      marketplace: {
        nearbySalons: 'GET /api/salons/nearby?lat=&lng=&radius=5',
        salonProfile: 'GET /api/salons/:slug',
        availableSlots: 'GET /api/salons/:slug/available-slots/:date',
        createBooking: 'POST /api/marketplace/bookings',
        trackBooking: 'GET /api/marketplace/bookings/track/:code',
      },
      salonOwner: {
        register: 'POST /api/salon-owner/register',
        login: 'POST /api/salon-owner/login',
        dashboard: 'GET /api/salon-owner/dashboard',
      },
    },
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

export default app
