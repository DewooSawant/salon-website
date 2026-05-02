import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import db, { testConnection } from './db/config_pg.js'

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

// =====================================================
// SEO / SOCIAL PREVIEW ROUTES
// Serve the SPA shell with per-page Open Graph meta tags injected server-side.
// WhatsApp, Twitter, iMessage, Slack scrape these without JS — so dynamic
// unfurls require real HTML <meta> tags in the initial response.
// =====================================================
const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Load the built SPA shell (client/dist/index.html) once at cold-start.
// On Vercel the function runs from /var/task/api; the client build lives at
// /var/task/client/dist/index.html (Vercel includes the outputDirectory for rewrites).
const __dirname = dirname(fileURLToPath(import.meta.url))
const SHELL_CANDIDATES = [
  join(__dirname, '..', 'client', 'dist', 'index.html'),
  join(__dirname, '..', '..', 'client', 'dist', 'index.html'),
  join(process.cwd(), 'client', 'dist', 'index.html'),
]
let cachedShell = null
function loadShell() {
  if (cachedShell) return cachedShell
  for (const p of SHELL_CANDIDATES) {
    try {
      if (existsSync(p)) {
        cachedShell = readFileSync(p, 'utf8')
        return cachedShell
      }
    } catch {}
  }
  return null
}

// Rewrite <title> + inject/replace OG meta tags in the shell for a specific page.
function renderShellWithOg({ title, description, url, image = 'https://www.stylo.sbs/icons/icon-512.png' }) {
  let html = loadShell()
  if (!html) return null

  const t = escapeHtml(title)
  const d = escapeHtml(description)
  const u = escapeHtml(url)
  const img = escapeHtml(image)

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${t}</title>`)
  html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${d}" />`)

  // Strip any existing og:/twitter: tags (defensive — build HTML shouldn't have them, but be safe)
  html = html.replace(/<meta\s+(?:property|name)=["'](?:og|twitter):[^"']+["'][^>]*>\s*/gi, '')

  // Inject fresh og/twitter tags right before </head>
  const ogBlock = `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Stylo" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:alt" content="${t}" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />
  `
  html = html.replace('</head>', `${ogBlock}</head>`)
  return html
}

// GET /booking/:code — inject booking-specific OG tags
app.get('/booking/:code', async (req, res, next) => {
  try {
    const origin = `${req.protocol}://${req.get('host')}`
    const url = `${origin}/booking/${req.params.code}`
    const [rows] = await db.query(
      `SELECT b.booking_code, b.customer_name, b.booking_date, b.start_time, b.final_price, b.status,
              s.name as salon_name, s.address as salon_address
       FROM bookings b JOIN salons s ON s.id = b.salon_id
       WHERE b.booking_code = $1`,
      [req.params.code]
    )
    if (rows.length === 0) return next()
    const b = rows[0]
    const dateStr = new Date(b.booking_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    const timeParts = String(b.start_time).split(':')
    const hour = parseInt(timeParts[0] || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const timeStr = `${hour % 12 || 12}:${timeParts[1] || '00'} ${ampm}`

    const title = `Appointment at ${b.salon_name}`
    const description = `${b.customer_name} · ${dateStr} at ${timeStr} · Code ${b.booking_code}`

    const html = renderShellWithOg({ title, description, url })
    if (!html) return next()
    res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')
    res.set('Content-Type', 'text/html; charset=utf-8')
    return res.send(html)
  } catch (err) {
    console.error('OG booking route error:', err.message)
    next()
  }
})

// GET /salon/:slug — inject salon-specific OG tags so owner-shared links unfurl nicely
app.get('/salon/:slug', async (req, res, next) => {
  try {
    const origin = `${req.protocol}://${req.get('host')}`
    const url = `${origin}/salon/${req.params.slug}`
    const [rows] = await db.query(
      'SELECT name, tagline, address, city, cover_image_url, logo_url FROM salons WHERE slug = $1 AND is_active = TRUE',
      [req.params.slug]
    )
    if (rows.length === 0) return next()
    const s = rows[0]
    const title = `${s.name} · Book an appointment`
    const descBits = [s.tagline, s.address, s.city].filter(Boolean).join(' · ')
    const description = descBits || `Book your appointment at ${s.name} on Stylo.`
    const image = s.cover_image_url || s.logo_url || 'https://www.stylo.sbs/icons/icon-512.png'
    const html = renderShellWithOg({ title, description, url, image })
    if (!html) return next()
    res.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600')
    res.set('Content-Type', 'text/html; charset=utf-8')
    return res.send(html)
  } catch (err) {
    console.error('OG salon route error:', err.message)
    next()
  }
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
