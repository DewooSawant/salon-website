import { Router } from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import db, { pool } from '../db/config_pg.js'
import { generateToken, authenticateSalonOwner } from '../middleware/auth_v2.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = `salon-${req.user.salon_id}-${Date.now()}${ext}`
    cb(null, name)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Only .jpg, .png, .webp images allowed'))
  }
})

const router = Router()

// POST /api/salon-owner/register
router.post('/register', async (req, res) => {
  try {
    const { owner_name, email, password, phone, salon_name, address, city, state, pincode, latitude, longitude, salon_phone, whatsapp, type, opening_time, closing_time, working_days } = req.body

    if (!owner_name || !email || !password || !salon_name || !address || !city || !latitude || !longitude) {
      return res.status(400).json({ error: 'Required: owner_name, email, password, salon_name, address, city, latitude, longitude' })
    }

    const [existing] = await db.query('SELECT id FROM salon_owners WHERE email = $1', [email])
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' })

    const baseSlug = salon_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    let slug = `${baseSlug}-${citySlug}`

    const [slugCheck] = await db.query('SELECT id FROM salons WHERE slug = $1', [slug])
    if (slugCheck.length > 0) slug = `${slug}-${Date.now()}`

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const { rows: [salon] } = await client.query(
        `INSERT INTO salons (name, slug, address, city, state, pincode, latitude, longitude, phone, whatsapp, type, opening_time, closing_time, working_days)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
        [salon_name, slug, address, city, state || null, pincode || null, parseFloat(latitude), parseFloat(longitude),
         salon_phone || phone, whatsapp || null, type || 'unisex', opening_time || '10:00:00', closing_time || '21:00:00',
         JSON.stringify(working_days || ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])]
      )

      const hashedPassword = await bcrypt.hash(password, 12)
      const { rows: [owner] } = await client.query(
        `INSERT INTO salon_owners (salon_id, name, email, password, phone, role)
         VALUES ($1,$2,$3,$4,$5,'owner') RETURNING id`,
        [salon.id, owner_name, email, hashedPassword, phone || null]
      )

      // Default categories
      const cats = [['Haircut','haircut','✂️',1],['Beard','beard','🧔',2],['Hair Color','color','🎨',3],['Treatments','treatment','🧴',4],['Facial','facial','✨',5]]
      for (const [name, catSlug, icon, order] of cats) {
        await client.query(
          'INSERT INTO service_categories (salon_id, name, slug, icon, display_order) VALUES ($1,$2,$3,$4,$5)',
          [salon.id, name, catSlug, icon, order]
        )
      }

      await client.query('COMMIT')

      const token = generateToken({ id: owner.id, salon_id: salon.id, type: 'salon_owner' })
      res.status(201).json({ message: 'Salon registered', token, salon: { id: salon.id, name: salon_name, slug }, owner: { id: owner.id, name: owner_name, email } })
    } catch (err) { await client.query('ROLLBACK'); throw err }
    finally { client.release() }
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /api/salon-owner/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const [users] = await db.query(
      `SELECT so.*, s.name as salon_name, s.slug as salon_slug FROM salon_owners so
       JOIN salons s ON s.id = so.salon_id WHERE so.email = $1 AND so.is_active = TRUE`, [email]
    )
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' })

    const user = users[0]
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' })

    await db.query('UPDATE salon_owners SET last_login = NOW() WHERE id = $1', [user.id])
    const token = generateToken({ id: user.id, salon_id: user.salon_id, type: 'salon_owner' })

    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, salon: { id: user.salon_id, name: user.salon_name, slug: user.salon_slug } })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
})

// GET /api/salon-owner/dashboard
router.get('/dashboard', authenticateSalonOwner, async (req, res) => {
  try {
    const sid = req.user.salon_id
    const [[today]] = await db.query(`SELECT COUNT(*) as count FROM bookings WHERE salon_id=$1 AND booking_date=CURRENT_DATE AND status!='cancelled'`, [sid])
    const [[pending]] = await db.query(`SELECT COUNT(*) as count FROM bookings WHERE salon_id=$1 AND status='pending'`, [sid])
    const [[todayRev]] = await db.query(`SELECT COALESCE(SUM(final_price),0) as total FROM bookings WHERE salon_id=$1 AND booking_date=CURRENT_DATE AND status='completed'`, [sid])
    const [[monthRev]] = await db.query(`SELECT COALESCE(SUM(final_price),0) as total FROM bookings WHERE salon_id=$1 AND EXTRACT(MONTH FROM booking_date)=EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM booking_date)=EXTRACT(YEAR FROM CURRENT_DATE) AND status='completed'`, [sid])
    const [[msgs]] = await db.query(`SELECT COUNT(*) as count FROM contact_messages WHERE salon_id=$1 AND is_read=FALSE`, [sid])
    const [recent] = await db.query(`SELECT b.*,st.name as stylist_name FROM bookings b LEFT JOIN stylists st ON st.id=b.stylist_id WHERE b.salon_id=$1 ORDER BY b.created_at DESC LIMIT 10`, [sid])
    const [[salon]] = await db.query('SELECT avg_rating,total_ratings,total_bookings FROM salons WHERE id=$1', [sid])

    res.json({
      stats: { today_bookings: parseInt(today.count), pending_bookings: parseInt(pending.count), today_revenue: parseFloat(todayRev.total), month_revenue: parseFloat(monthRev.total), unread_messages: parseInt(msgs.count), avg_rating: salon?.avg_rating || 0, total_ratings: salon?.total_ratings || 0 },
      recent_bookings: recent
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to load dashboard' })
  }
})

// GET /api/salon-owner/analytics - Detailed analytics
router.get('/analytics', authenticateSalonOwner, async (req, res) => {
  try {
    const sid = req.user.salon_id
    const { period } = req.query // '7d', '30d', 'month'
    const days = period === '30d' ? 30 : period === 'month' ? 30 : 7

    // 1. Daily revenue for chart (last N days)
    const [dailyRevenue] = await db.query(`
      SELECT d::date AS date,
             COALESCE(SUM(b.final_price), 0) AS revenue,
             COUNT(b.id) AS bookings
      FROM generate_series(CURRENT_DATE - $2::int + 1, CURRENT_DATE, '1 day') d
      LEFT JOIN bookings b ON b.booking_date = d::date AND b.salon_id = $1
        AND b.status IN ('completed', 'confirmed')
      GROUP BY d::date ORDER BY d::date
    `, [sid, days])

    // 2. Top services by revenue
    const [topServices] = await db.query(`
      SELECT bs.service_name AS name, COUNT(*) AS bookings,
             SUM(bs.service_price) AS revenue
      FROM booking_services bs
      JOIN bookings b ON b.id = bs.booking_id
      WHERE b.salon_id = $1 AND b.status IN ('completed', 'confirmed')
        AND b.booking_date >= CURRENT_DATE - $2::int
      GROUP BY bs.service_name
      ORDER BY revenue DESC LIMIT 8
    `, [sid, days])

    // 3. Top customers by spend
    const [topCustomers] = await db.query(`
      SELECT customer_name AS name, customer_phone AS phone,
             COUNT(*) AS visits, SUM(final_price) AS total_spent
      FROM bookings
      WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
        AND booking_date >= CURRENT_DATE - $2::int
        AND customer_phone != 'walk-in'
      GROUP BY customer_name, customer_phone
      ORDER BY total_spent DESC LIMIT 5
    `, [sid, days])

    // 4. Walk-in vs Online split
    const [channelSplit] = await db.query(`
      SELECT
        SUM(CASE WHEN booking_code LIKE 'WI%' THEN 1 ELSE 0 END) AS walkin,
        SUM(CASE WHEN booking_code NOT LIKE 'WI%' THEN 1 ELSE 0 END) AS online,
        COUNT(*) AS total
      FROM bookings
      WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
        AND booking_date >= CURRENT_DATE - $2::int
    `, [sid, days])

    // 5. Payment method breakdown
    const [paymentSplit] = await db.query(`
      SELECT payment_method, COUNT(*) AS count, SUM(final_price) AS amount
      FROM bookings
      WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
        AND booking_date >= CURRENT_DATE - $2::int
      GROUP BY payment_method ORDER BY amount DESC
    `, [sid, days])

    // 6. Peak hours (hour of day distribution)
    const [peakHours] = await db.query(`
      SELECT EXTRACT(HOUR FROM start_time)::int AS hour, COUNT(*) AS count
      FROM bookings
      WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
        AND booking_date >= CURRENT_DATE - $2::int
      GROUP BY hour ORDER BY hour
    `, [sid, days])

    // 7. Stylist performance
    const [stylistPerf] = await db.query(`
      SELECT s.name, s.avatar_emoji, COUNT(b.id) AS bookings,
             COALESCE(SUM(b.final_price), 0) AS revenue
      FROM stylists s
      LEFT JOIN bookings b ON b.stylist_id = s.id AND b.salon_id = $1
        AND b.status IN ('completed', 'confirmed')
        AND b.booking_date >= CURRENT_DATE - $2::int
      WHERE s.salon_id = $1 AND s.is_active = TRUE
      GROUP BY s.id ORDER BY revenue DESC
    `, [sid, days])

    // 8. Period comparison (this period vs last period)
    const [currentPeriod] = await db.query(`
      SELECT COALESCE(SUM(final_price), 0) AS revenue, COUNT(*) AS bookings
      FROM bookings WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
        AND booking_date >= CURRENT_DATE - $2::int
    `, [sid, days])
    const [prevPeriod] = await db.query(`
      SELECT COALESCE(SUM(final_price), 0) AS revenue, COUNT(*) AS bookings
      FROM bookings WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
        AND booking_date >= CURRENT_DATE - ($2::int * 2) AND booking_date < CURRENT_DATE - $2::int
    `, [sid, days])

    const cur = currentPeriod[0] || {}
    const prev = prevPeriod[0] || {}
    const revGrowth = prev.revenue > 0 ? Math.round(((cur.revenue - prev.revenue) / prev.revenue) * 100) : null
    const bookGrowth = prev.bookings > 0 ? Math.round(((cur.bookings - prev.bookings) / prev.bookings) * 100) : null

    res.json({
      daily_revenue: dailyRevenue,
      top_services: topServices,
      top_customers: topCustomers,
      channel_split: channelSplit[0] || { walkin: 0, online: 0, total: 0 },
      payment_split: paymentSplit,
      peak_hours: peakHours,
      stylist_performance: stylistPerf,
      comparison: {
        current: { revenue: parseFloat(cur.revenue), bookings: parseInt(cur.bookings) },
        previous: { revenue: parseFloat(prev.revenue), bookings: parseInt(prev.bookings) },
        revenue_growth: revGrowth,
        bookings_growth: bookGrowth,
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to load analytics' })
  }
})

// GET /api/salon-owner/salon
router.get('/salon', authenticateSalonOwner, async (req, res) => {
  try {
    const [salons] = await db.query(
      `SELECT * FROM salons WHERE id=$1`, [req.user.salon_id]
    )
    if (salons.length === 0) return res.status(404).json({ error: 'Salon not found' })
    res.json({ salon: salons[0] })
  } catch (error) { res.status(500).json({ error: 'Failed to fetch salon' }) }
})

// PUT /api/salon-owner/salon
router.put('/salon', authenticateSalonOwner, async (req, res) => {
  try {
    const allowed = ['name','tagline','description','address','city','state','pincode','phone','whatsapp','email','website','google_maps_url','opening_time','closing_time','slot_duration','lunch_start','lunch_end','working_days','logo_url','cover_image_url','type','amenities','social_facebook','social_instagram','social_twitter','auto_confirm_bookings']
    const updates = [], values = []
    let idx = 1

    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${idx++}`)
        values.push(['working_days','amenities','photos'].includes(key) ? JSON.stringify(value) : value)
      }
    }

    // Handle lat/lng update
    if (req.body.latitude && req.body.longitude) {
      updates.push(`latitude = $${idx}`, `longitude = $${idx+1}`)
      values.push(parseFloat(req.body.longitude), parseFloat(req.body.latitude))
      idx += 2
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields' })

    values.push(req.user.salon_id)
    await db.query(`UPDATE salons SET ${updates.join(', ')} WHERE id = $${idx}`, values)
    res.json({ message: 'Salon updated' })
  } catch (error) { res.status(500).json({ error: 'Failed to update salon' }) }
})

// SERVICES CRUD
router.get('/services', authenticateSalonOwner, async (req, res) => {
  const [services] = await db.query(`SELECT s.*,sc.name as category_name FROM services s LEFT JOIN service_categories sc ON sc.id=s.category_id WHERE s.salon_id=$1 ORDER BY s.display_order`, [req.user.salon_id])
  res.json({ services })
})

router.post('/services', authenticateSalonOwner, async (req, res) => {
  try {
    const { category_id, name, description, price, discounted_price, duration, icon, gender, is_popular } = req.body
    if (!name || !price || !duration) return res.status(400).json({ error: 'name, price, duration required' })
    const [result] = await db.query(
      `INSERT INTO services (salon_id,category_id,name,description,price,discounted_price,duration,icon,gender,is_popular) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [req.user.salon_id, category_id||null, name, description||null, price, discounted_price||null, duration, icon||null, gender||'unisex', is_popular||false]
    )
    res.status(201).json({ message: 'Service created', service_id: result[0].id })
  } catch (error) { res.status(500).json({ error: 'Failed to create service' }) }
})

router.put('/services/:id', authenticateSalonOwner, async (req, res) => {
  try {
    const allowed = ['category_id','name','description','price','discounted_price','duration','icon','gender','is_popular','is_active','display_order']
    const updates = [], values = []
    let idx = 1
    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key)) { updates.push(`${key}=$${idx++}`); values.push(value) }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields' })
    values.push(req.params.id, req.user.salon_id)
    await db.query(`UPDATE services SET ${updates.join(',')} WHERE id=$${idx} AND salon_id=$${idx+1}`, values)
    res.json({ message: 'Service updated' })
  } catch (error) { res.status(500).json({ error: 'Failed to update service' }) }
})

router.delete('/services/:id', authenticateSalonOwner, async (req, res) => {
  await db.query('DELETE FROM services WHERE id=$1 AND salon_id=$2', [req.params.id, req.user.salon_id])
  res.json({ message: 'Service deleted' })
})

// STYLISTS CRUD
router.get('/stylists', authenticateSalonOwner, async (req, res) => {
  const [stylists] = await db.query('SELECT * FROM stylists WHERE salon_id=$1 ORDER BY display_order', [req.user.salon_id])
  res.json({ stylists })
})

router.post('/stylists', authenticateSalonOwner, async (req, res) => {
  try {
    const { name, email, phone, role, experience, speciality, bio, avatar_emoji } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const [result] = await db.query(
      `INSERT INTO stylists (salon_id,name,email,phone,role,experience,speciality,bio,avatar_emoji) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.user.salon_id, name, email||null, phone||null, role||'Stylist', experience||null, speciality||null, bio||null, avatar_emoji||null]
    )
    res.status(201).json({ message: 'Stylist created', stylist_id: result[0].id })
  } catch (error) { res.status(500).json({ error: 'Failed to create stylist' }) }
})

router.delete('/stylists/:id', authenticateSalonOwner, async (req, res) => {
  await db.query('DELETE FROM stylists WHERE id=$1 AND salon_id=$2', [req.params.id, req.user.salon_id])
  res.json({ message: 'Stylist deleted' })
})

// CATEGORIES
router.get('/categories', authenticateSalonOwner, async (req, res) => {
  const [categories] = await db.query('SELECT * FROM service_categories WHERE salon_id=$1 ORDER BY display_order', [req.user.salon_id])
  res.json({ categories })
})

router.post('/categories', authenticateSalonOwner, async (req, res) => {
  try {
    const { name, description, icon } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const [result] = await db.query(
      'INSERT INTO service_categories (salon_id,name,slug,description,icon) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.user.salon_id, name, slug, description||null, icon||null]
    )
    res.status(201).json({ message: 'Category created', category_id: result[0].id })
  } catch (error) { res.status(500).json({ error: 'Failed to create category' }) }
})

// BOOKINGS (own salon)
router.get('/bookings', authenticateSalonOwner, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 50 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const params = [req.user.salon_id]
    let idx = 2, filters = ''

    if (status) { filters += ` AND b.status=$${idx++}`; params.push(status) }
    if (date) { filters += ` AND b.booking_date=$${idx++}`; params.push(date) }

    params.push(parseInt(limit), offset)

    const [bookings] = await db.query(`
      SELECT b.*,st.name as stylist_name FROM bookings b LEFT JOIN stylists st ON st.id=b.stylist_id
      WHERE b.salon_id=$1 ${filters} ORDER BY b.booking_date DESC,b.start_time DESC LIMIT $${idx} OFFSET $${idx+1}`, params)

    for (const b of bookings) {
      const [svcs] = await db.query('SELECT * FROM booking_services WHERE booking_id=$1', [b.id])
      b.services = svcs
    }
    res.json({ bookings })
  } catch (error) { res.status(500).json({ error: 'Failed to fetch bookings' }) }
})

router.patch('/bookings/:id/status', authenticateSalonOwner, async (req, res) => {
  try {
    const { status } = req.body
    const valid = ['pending','confirmed','in_progress','completed','cancelled','no_show']
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })

    const [existing] = await db.query('SELECT id FROM bookings WHERE id=$1 AND salon_id=$2', [req.params.id, req.user.salon_id])
    if (existing.length === 0) return res.status(404).json({ error: 'Booking not found' })

    await db.query('UPDATE bookings SET status=$1 WHERE id=$2', [status, req.params.id])
    if (status === 'completed') {
      await db.query('UPDATE salons SET total_bookings=total_bookings+1 WHERE id=$1', [req.user.salon_id])
    }
    res.json({ message: `Booking ${status}` })
  } catch (error) { res.status(500).json({ error: 'Failed to update booking' }) }
})

// =====================================================
// WALK-IN / POS FEATURES
// =====================================================

// POST /api/salon-owner/walkin - Quick walk-in billing
router.post('/walkin', authenticateSalonOwner, async (req, res) => {
  try {
    const { customer_name, customer_phone, services, stylist_id, payment_method, notes, discount_amount } = req.body

    if (!customer_name || !services || services.length === 0) {
      return res.status(400).json({ error: 'Customer name and at least one service required' })
    }

    const sid = req.user.salon_id
    const [salon] = await db.query('SELECT slug FROM salons WHERE id=$1', [sid])

    // Get service details
    const [serviceDetails] = await db.query(
      'SELECT id, name, price, discounted_price, duration FROM services WHERE id = ANY($1) AND salon_id = $2 AND is_active = TRUE',
      [services, sid]
    )
    if (serviceDetails.length === 0) return res.status(400).json({ error: 'No valid services' })

    const totalDuration = serviceDetails.reduce((sum, s) => sum + s.duration, 0)
    const totalPrice = serviceDetails.reduce((sum, s) => sum + parseFloat(s.discounted_price || s.price), 0)
    const discount = parseFloat(discount_amount) || 0
    const finalPrice = Math.max(0, totalPrice - discount)

    // Auto-fill date/time as NOW
    const now = new Date()
    const bookingDate = now.toISOString().split('T')[0]
    const hours = String(now.getHours()).padStart(2, '0')
    const mins = String(now.getMinutes()).padStart(2, '0')
    const startTime = `${hours}:${mins}:00`

    const endMins = now.getHours() * 60 + now.getMinutes() + totalDuration
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}:00`

    // Generate booking code with WI prefix for walk-in
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let bookingCode = 'WI'
    for (let i = 0; i < 6; i++) bookingCode += chars.charAt(Math.floor(Math.random() * chars.length))

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const { rows: [booking] } = await client.query(
        `INSERT INTO bookings (booking_code, salon_id, customer_name, customer_phone, stylist_id,
         booking_date, start_time, end_time, total_duration, total_price, discount_amount, final_price,
         notes, status, payment_method, payment_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'completed',$14,'paid') RETURNING *`,
        [bookingCode, sid, customer_name, customer_phone || 'walk-in', stylist_id || null,
         bookingDate, startTime, endTime, totalDuration, totalPrice, discount, finalPrice,
         notes || 'Walk-in customer', payment_method || 'cash']
      )

      for (const service of serviceDetails) {
        await client.query(
          `INSERT INTO booking_services (booking_id, service_id, service_name, service_price, service_duration)
           VALUES ($1,$2,$3,$4,$5)`,
          [booking.id, service.id, service.name, service.discounted_price || service.price, service.duration]
        )
      }

      // Increment total bookings
      await client.query('UPDATE salons SET total_bookings = total_bookings + 1 WHERE id = $1', [sid])

      await client.query('COMMIT')

      res.status(201).json({
        message: 'Walk-in billed',
        booking: { ...booking, services: serviceDetails }
      })
    } catch (err) { await client.query('ROLLBACK'); throw err }
    finally { client.release() }
  } catch (error) {
    console.error('Walk-in error:', error)
    res.status(500).json({ error: 'Failed to create walk-in bill' })
  }
})

// GET /api/salon-owner/today - Today's queue/activity
router.get('/today', authenticateSalonOwner, async (req, res) => {
  try {
    const sid = req.user.salon_id

    // All today's bookings
    const [bookings] = await db.query(`
      SELECT b.*, st.name as stylist_name
      FROM bookings b LEFT JOIN stylists st ON st.id = b.stylist_id
      WHERE b.salon_id = $1 AND b.booking_date = CURRENT_DATE
      AND b.status != 'cancelled'
      ORDER BY b.start_time ASC`, [sid])

    // Load services for each
    for (const b of bookings) {
      const [svcs] = await db.query('SELECT * FROM booking_services WHERE booking_id=$1', [b.id])
      b.services = svcs
    }

    // Stylist status
    const [stylists] = await db.query('SELECT id, name, avatar_emoji, role FROM stylists WHERE salon_id=$1 AND is_active=TRUE ORDER BY display_order', [sid])
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`

    for (const stylist of stylists) {
      const currentBooking = bookings.find(b =>
        b.stylist_id === stylist.id &&
        b.status === 'in_progress'
      )
      stylist.status = currentBooking ? 'busy' : 'available'
      stylist.current_booking = currentBooking ? {
        customer: currentBooking.customer_name,
        services: currentBooking.services?.map(s => s.service_name).join(', '),
        end_time: currentBooking.end_time
      } : null
      // Count today's completed
      stylist.today_completed = bookings.filter(b => b.stylist_id === stylist.id && b.status === 'completed').length
    }

    // Queue stats
    const queue = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
    const inProgress = bookings.filter(b => b.status === 'in_progress')
    const completed = bookings.filter(b => b.status === 'completed')

    // Revenue breakdown
    const totalRevenue = completed.reduce((sum, b) => sum + parseFloat(b.final_price || 0), 0)
    const cashRevenue = completed.filter(b => b.payment_method === 'cash').reduce((sum, b) => sum + parseFloat(b.final_price || 0), 0)
    const upiRevenue = completed.filter(b => b.payment_method === 'upi').reduce((sum, b) => sum + parseFloat(b.final_price || 0), 0)
    const cardRevenue = completed.filter(b => b.payment_method === 'card').reduce((sum, b) => sum + parseFloat(b.final_price || 0), 0)
    const walkinCount = completed.filter(b => b.booking_code?.startsWith('WI')).length
    const onlineCount = completed.filter(b => !b.booking_code?.startsWith('WI')).length

    res.json({
      bookings,
      stylists,
      queue: { waiting: queue.length, in_progress: inProgress.length, completed: completed.length },
      revenue: { total: totalRevenue, cash: cashRevenue, upi: upiRevenue, card: cardRevenue },
      counts: { walkin: walkinCount, online: onlineCount, total: completed.length }
    })
  } catch (error) {
    console.error('Today error:', error)
    res.status(500).json({ error: 'Failed to load today data' })
  }
})

// PATCH /api/salon-owner/bookings/:id/payment - Update payment info
router.patch('/bookings/:id/payment', authenticateSalonOwner, async (req, res) => {
  try {
    const { payment_method, payment_status, discount_amount } = req.body
    const updates = [], values = []
    let idx = 1

    if (payment_method) { updates.push(`payment_method=$${idx++}`); values.push(payment_method) }
    if (payment_status) { updates.push(`payment_status=$${idx++}`); values.push(payment_status) }
    if (discount_amount !== undefined) {
      updates.push(`discount_amount=$${idx++}`)
      values.push(parseFloat(discount_amount))
      // Recalculate final_price
      updates.push(`final_price=total_price-$${idx++}`)
      values.push(parseFloat(discount_amount))
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

    values.push(req.params.id, req.user.salon_id)
    await db.query(`UPDATE bookings SET ${updates.join(',')} WHERE id=$${idx} AND salon_id=$${idx+1}`, values)
    res.json({ message: 'Payment updated' })
  } catch (error) { res.status(500).json({ error: 'Failed to update payment' }) }
})

// REVIEWS
router.get('/reviews', authenticateSalonOwner, async (req, res) => {
  const [reviews] = await db.query(`SELECT r.*,c.name as customer_name FROM reviews r JOIN customers c ON c.id=r.customer_id WHERE r.salon_id=$1 ORDER BY r.created_at DESC`, [req.user.salon_id])
  res.json({ reviews })
})

router.post('/reviews/:id/reply', authenticateSalonOwner, async (req, res) => {
  const { reply } = req.body
  if (!reply) return res.status(400).json({ error: 'Reply required' })
  await db.query('UPDATE reviews SET owner_reply=$1,owner_replied_at=NOW() WHERE id=$2 AND salon_id=$3', [reply, req.params.id, req.user.salon_id])
  res.json({ message: 'Reply posted' })
})

// =====================================================
// IMAGE UPLOAD
// =====================================================

// POST /api/salon-owner/upload - Upload salon image
router.post('/upload', authenticateSalonOwner, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })

    const { field } = req.body // 'cover_image_url', 'logo_url', or 'gallery'
    const imageUrl = `/uploads/${req.file.filename}`

    // If a field is specified, auto-update the salon record
    if (field && ['cover_image_url', 'logo_url'].includes(field)) {
      // Delete old file if exists
      const [salon] = await db.query(`SELECT ${field} FROM salons WHERE id=$1`, [req.user.salon_id])
      const oldUrl = salon[0]?.[field]
      if (oldUrl && oldUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', 'public', oldUrl)
        fs.unlink(oldPath, () => {}) // Ignore errors
      }

      await db.query(`UPDATE salons SET ${field} = $1 WHERE id = $2`, [imageUrl, req.user.salon_id])
    }

    res.json({
      message: 'Image uploaded',
      url: imageUrl,
      full_url: `${req.protocol}://${req.get('host')}${imageUrl}`,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message || 'Upload failed' })
  }
})

// =====================================================
// NOTIFICATIONS
// =====================================================

// GET /api/salon-owner/notifications - Get notifications (with unread count)
router.get('/notifications', authenticateSalonOwner, async (req, res) => {
  try {
    const sid = req.user.salon_id
    const { limit = 20, unread_only } = req.query

    let query = 'SELECT * FROM notifications WHERE salon_id = $1'
    const params = [sid]
    if (unread_only === 'true') {
      query += ' AND is_read = FALSE'
    }
    query += ' ORDER BY created_at DESC LIMIT $2'
    params.push(parseInt(limit))

    const [notifications] = await db.query(query, params)
    const [[{ count: unreadCount }]] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE salon_id = $1 AND is_read = FALSE', [sid]
    )

    res.json({ notifications, unread_count: parseInt(unreadCount) })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// PATCH /api/salon-owner/notifications/read - Mark notifications as read
router.patch('/notifications/read', authenticateSalonOwner, async (req, res) => {
  try {
    const { ids } = req.body // array of notification IDs, or empty to mark all
    if (ids && ids.length > 0) {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ANY($1) AND salon_id = $2',
        [ids, req.user.salon_id]
      )
    } else {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE salon_id = $1 AND is_read = FALSE',
        [req.user.salon_id]
      )
    }
    res.json({ message: 'Marked as read' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// PATCH /api/salon-owner/bookings/:id/confirm - Quick confirm from notification
router.patch('/bookings/:id/confirm', authenticateSalonOwner, async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id, status, customer_name, booking_date, start_time FROM bookings WHERE id = $1 AND salon_id = $2',
      [req.params.id, req.user.salon_id]
    )
    if (existing.length === 0) return res.status(404).json({ error: 'Booking not found' })
    if (existing[0].status !== 'pending') return res.status(400).json({ error: 'Booking is not pending' })

    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', req.params.id])

    res.json({ message: 'Booking confirmed', booking: existing[0] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm booking' })
  }
})

// PATCH /api/salon-owner/bookings/:id/decline - Decline booking
router.patch('/bookings/:id/decline', authenticateSalonOwner, async (req, res) => {
  try {
    const { reason } = req.body
    const [existing] = await db.query(
      'SELECT id, status FROM bookings WHERE id = $1 AND salon_id = $2',
      [req.params.id, req.user.salon_id]
    )
    if (existing.length === 0) return res.status(404).json({ error: 'Booking not found' })

    await db.query(
      'UPDATE bookings SET status = $1, cancellation_reason = $2 WHERE id = $3',
      ['cancelled', reason || 'Declined by salon', req.params.id]
    )

    res.json({ message: 'Booking declined' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to decline booking' })
  }
})

// =====================================================
// CUSTOMER CRM
// =====================================================

// GET /api/salon-owner/customers/search - Quick autocomplete for walk-in billing
router.get('/customers/search', authenticateSalonOwner, async (req, res) => {
  try {
    const salonId = req.user.salon_id
    const { q } = req.query
    if (!q || q.length < 2) return res.json({ results: [] })

    const isPhone = /^\d+$/.test(q)
    const [results] = await db.query(`
      SELECT customer_name AS name, customer_phone AS phone,
             COUNT(*) AS visits, MAX(booking_date) AS last_visit
      FROM bookings
      WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
        AND customer_phone != 'walk-in'
        AND ${isPhone ? 'customer_phone LIKE $2' : 'customer_name ILIKE $2'}
      GROUP BY customer_phone, customer_name
      ORDER BY MAX(booking_date) DESC
      LIMIT 5
    `, [salonId, isPhone ? `${q}%` : `%${q}%`])

    res.json({ results })
  } catch (error) {
    res.status(500).json({ results: [] })
  }
})

// GET /api/salon-owner/customers - Customer list with stats
router.get('/customers', authenticateSalonOwner, async (req, res) => {
  try {
    const salonId = req.user.salon_id
    const { search, segment, sort } = req.query

    let query = `
      SELECT
        customer_phone AS phone,
        customer_name AS name,
        customer_id,
        COUNT(*) AS total_visits,
        SUM(final_price) AS total_spent,
        MAX(booking_date) AS last_visit,
        MIN(booking_date) AS first_visit,
        ROUND(AVG(final_price), 0) AS avg_bill,
        MODE() WITHIN GROUP (ORDER BY payment_method) AS preferred_payment
      FROM bookings
      WHERE salon_id = $1 AND status IN ('completed', 'confirmed')
      GROUP BY customer_phone, customer_name, customer_id
    `
    const params = [salonId]

    if (search) {
      query += ` HAVING customer_name ILIKE $2 OR customer_phone ILIKE $2`
      params.push(`%${search}%`)
    }

    // Sort
    if (sort === 'spent') query += ` ORDER BY total_spent DESC`
    else if (sort === 'visits') query += ` ORDER BY total_visits DESC`
    else if (sort === 'name') query += ` ORDER BY customer_name ASC`
    else query += ` ORDER BY last_visit DESC`

    const [customers] = await db.query(query, params)

    // Apply segment filter in JS (easier than complex SQL)
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    let filtered = customers

    if (segment === 'frequent') filtered = customers.filter(c => c.total_visits >= 5)
    else if (segment === 'inactive') filtered = customers.filter(c => new Date(c.last_visit) < thirtyDaysAgo)
    else if (segment === 'new') filtered = customers.filter(c => c.total_visits === 1)
    else if (segment === 'vip') filtered = customers.filter(c => parseFloat(c.total_spent) >= 5000)

    // Summary stats
    const summary = {
      total_customers: customers.length,
      frequent: customers.filter(c => c.total_visits >= 5).length,
      inactive: customers.filter(c => new Date(c.last_visit) < thirtyDaysAgo).length,
      new_this_month: customers.filter(c => {
        const first = new Date(c.first_visit)
        return first.getMonth() === now.getMonth() && first.getFullYear() === now.getFullYear()
      }).length,
    }

    res.json({ customers: filtered, summary })
  } catch (error) {
    console.error('CRM error:', error)
    res.status(500).json({ error: 'Failed to load customers' })
  }
})

// GET /api/salon-owner/customers/:phone/history - Single customer history
router.get('/customers/:phone/history', authenticateSalonOwner, async (req, res) => {
  try {
    const salonId = req.user.salon_id
    const phone = req.params.phone

    const [bookings] = await db.query(`
      SELECT b.id, b.booking_code, b.booking_date, b.start_time, b.final_price,
             b.status, b.payment_method, b.customer_name, b.stylist_id,
             s.name AS stylist_name,
             COALESCE(json_agg(json_build_object('name', bs.service_name, 'price', bs.service_price))
               FILTER (WHERE bs.id IS NOT NULL), '[]') AS services
      FROM bookings b
      LEFT JOIN stylists s ON s.id = b.stylist_id
      LEFT JOIN booking_services bs ON bs.booking_id = b.id
      WHERE b.salon_id = $1 AND b.customer_phone = $2
      GROUP BY b.id, s.name
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT 50
    `, [salonId, phone])

    // Aggregate stats
    const completed = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed')
    const serviceCounts = {}
    completed.forEach(b => {
      if (Array.isArray(b.services)) {
        b.services.forEach(s => {
          serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1
        })
      }
    })
    const topServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    res.json({
      customer: {
        name: bookings[0]?.customer_name || '',
        phone,
        total_visits: completed.length,
        total_spent: completed.reduce((sum, b) => sum + parseFloat(b.final_price), 0),
        first_visit: completed.length > 0 ? completed[completed.length - 1].booking_date : null,
        last_visit: completed.length > 0 ? completed[0].booking_date : null,
        top_services: topServices,
      },
      bookings,
    })
  } catch (error) {
    console.error('Customer history error:', error)
    res.status(500).json({ error: 'Failed to load customer history' })
  }
})

// =====================================================
// STAFF MANAGEMENT - Salary, Commission & Payments
// =====================================================

// PATCH /api/salon-owner/stylists/:id/pay - Update pay settings
router.patch('/stylists/:id/pay', authenticateSalonOwner, async (req, res) => {
  try {
    const { pay_type, monthly_salary, commission_rate } = req.body
    if (pay_type && !['salary', 'commission', 'both'].includes(pay_type)) {
      return res.status(400).json({ error: 'pay_type must be salary, commission, or both' })
    }
    if (commission_rate !== undefined && (commission_rate < 0 || commission_rate > 100)) {
      return res.status(400).json({ error: 'Commission rate must be 0-100%' })
    }
    await db.query(
      `UPDATE stylists SET
        pay_type = COALESCE($1, pay_type),
        monthly_salary = COALESCE($2, monthly_salary),
        commission_rate = COALESCE($3, commission_rate)
       WHERE id = $4 AND salon_id = $5`,
      [pay_type, monthly_salary, commission_rate, req.params.id, req.user.salon_id]
    )
    res.json({ message: 'Pay settings updated' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pay settings' })
  }
})

// GET /api/salon-owner/staff-payments - Staff overview for a month
router.get('/staff-payments', authenticateSalonOwner, async (req, res) => {
  try {
    const salonId = req.user.salon_id
    const now = new Date()
    const month = parseInt(req.query.month) || (now.getMonth() + 1)
    const year = parseInt(req.query.year) || now.getFullYear()

    // Get all stylists with their booking performance for the month
    const [stylists] = await db.query(`
      SELECT
        s.id, s.name, s.avatar_emoji, s.role, s.phone,
        s.pay_type, s.monthly_salary, s.commission_rate,
        COUNT(b.id) AS total_bookings,
        COALESCE(SUM(b.final_price), 0) AS revenue_generated,
        COALESCE(ROUND(SUM(b.final_price) * s.commission_rate / 100, 0), 0) AS commission_earned,
        COALESCE(ROUND(AVG(b.final_price), 0), 0) AS avg_ticket
      FROM stylists s
      LEFT JOIN bookings b ON b.stylist_id = s.id AND b.salon_id = $1
        AND b.status IN ('completed', 'confirmed')
        AND EXTRACT(MONTH FROM b.booking_date) = $2
        AND EXTRACT(YEAR FROM b.booking_date) = $3
      WHERE s.salon_id = $1 AND s.is_active = TRUE
      GROUP BY s.id
      ORDER BY s.name
    `, [salonId, month, year])

    // Get existing payment records for this month
    const [payments] = await db.query(
      `SELECT * FROM staff_payments WHERE salon_id = $1 AND month = $2 AND year = $3`,
      [salonId, month, year]
    )
    const paymentMap = {}
    payments.forEach(p => { paymentMap[p.stylist_id] = p })

    // Merge stylist data with payment records
    const staff = stylists.map(s => {
      const payment = paymentMap[s.id]
      const baseSalary = ['salary', 'both'].includes(s.pay_type) ? parseFloat(s.monthly_salary) : 0
      const commission = ['commission', 'both'].includes(s.pay_type) ? parseFloat(s.commission_earned) : 0
      return {
        ...s,
        base_salary: baseSalary,
        commission_amount: commission,
        total_payable: payment ? parseFloat(payment.total_payable) : baseSalary + commission,
        bonus: payment ? parseFloat(payment.bonus) : 0,
        deductions: payment ? parseFloat(payment.deductions) : 0,
        payment_status: payment?.status || 'pending',
        payment_id: payment?.id || null,
        paid_date: payment?.paid_date || null,
        payment_method: payment?.payment_method || null,
        notes: payment?.notes || '',
      }
    })

    const totals = {
      total_salary: staff.reduce((s, st) => s + st.base_salary, 0),
      total_commission: staff.reduce((s, st) => s + st.commission_amount, 0),
      total_payable: staff.reduce((s, st) => s + st.total_payable, 0),
      total_revenue: staff.reduce((s, st) => s + parseFloat(st.revenue_generated), 0),
      paid_count: staff.filter(s => s.payment_status === 'paid').length,
      pending_count: staff.filter(s => s.payment_status === 'pending').length,
    }

    res.json({ staff, totals, month, year })
  } catch (error) {
    console.error('Staff payments error:', error)
    res.status(500).json({ error: 'Failed to load staff payments' })
  }
})

// POST /api/salon-owner/staff-payments/:stylistId - Create/update payment record
router.post('/staff-payments/:stylistId', authenticateSalonOwner, async (req, res) => {
  try {
    const salonId = req.user.salon_id
    const stylistId = req.params.stylistId
    const { month, year, base_salary, commission_earned, bonus, deductions, notes, status, payment_method } = req.body

    const total = (parseFloat(base_salary) || 0) + (parseFloat(commission_earned) || 0)
      + (parseFloat(bonus) || 0) - (parseFloat(deductions) || 0)

    const [result] = await db.query(`
      INSERT INTO staff_payments (stylist_id, salon_id, month, year, base_salary, commission_earned, bonus, deductions, total_payable, status, payment_method, notes, paid_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (stylist_id, month, year) DO UPDATE SET
        base_salary = $5, commission_earned = $6, bonus = $7, deductions = $8,
        total_payable = $9, status = $10, payment_method = $11, notes = $12,
        paid_date = $13, updated_at = NOW()
      RETURNING *
    `, [
      stylistId, salonId, month, year,
      base_salary || 0, commission_earned || 0, bonus || 0, deductions || 0,
      total, status || 'pending', payment_method || null, notes || null,
      status === 'paid' ? new Date() : null
    ])

    res.json({ payment: result[0], message: status === 'paid' ? 'Marked as paid' : 'Payment updated' })
  } catch (error) {
    console.error('Payment save error:', error)
    res.status(500).json({ error: 'Failed to save payment' })
  }
})

// GET /api/salon-owner/staff-payments/:stylistId/slip - Salary slip data
router.get('/staff-payments/:stylistId/slip', authenticateSalonOwner, async (req, res) => {
  try {
    const salonId = req.user.salon_id
    const stylistId = req.params.stylistId
    const month = parseInt(req.query.month)
    const year = parseInt(req.query.year)

    const [stylistRows] = await db.query(
      'SELECT s.*, sal.name AS salon_name, sal.address, sal.city, sal.phone AS salon_phone FROM stylists s JOIN salons sal ON sal.id = s.salon_id WHERE s.id = $1 AND s.salon_id = $2',
      [stylistId, salonId]
    )
    if (stylistRows.length === 0) return res.status(404).json({ error: 'Stylist not found' })

    const [paymentRows] = await db.query(
      'SELECT * FROM staff_payments WHERE stylist_id = $1 AND month = $2 AND year = $3',
      [stylistId, month, year]
    )

    // Booking breakdown for the month
    const [bookings] = await db.query(`
      SELECT COUNT(*) AS total_bookings, COALESCE(SUM(final_price), 0) AS total_revenue
      FROM bookings
      WHERE stylist_id = $1 AND salon_id = $2
        AND status IN ('completed', 'confirmed')
        AND EXTRACT(MONTH FROM booking_date) = $3
        AND EXTRACT(YEAR FROM booking_date) = $4
    `, [stylistId, salonId, month, year])

    res.json({
      stylist: stylistRows[0],
      payment: paymentRows[0] || null,
      performance: bookings[0],
      month, year,
    })
  } catch (error) {
    console.error('Salary slip error:', error)
    res.status(500).json({ error: 'Failed to generate salary slip' })
  }
})

export default router
