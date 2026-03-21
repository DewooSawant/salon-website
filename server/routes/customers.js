import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/config_pg.js'
import { generateToken, authenticateCustomer } from '../middleware/auth_v2.js'

const router = Router()

// POST /api/customers/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, city, latitude, longitude } = req.body

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' })
    }

    const [existing] = await db.query('SELECT id FROM customers WHERE phone = $1', [phone])
    if (existing.length > 0) return res.status(409).json({ error: 'Phone number already registered' })

    const hashedPassword = await bcrypt.hash(password, 12)

    const [result] = await db.query(
      `INSERT INTO customers (name, phone, email, password, city, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [name, phone, email || null, hashedPassword, city || null, latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null]
    )

    const token = generateToken({ id: result[0].id, phone, type: 'customer' })

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: result[0].id, name, phone, email, city }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /api/customers/login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' })

    const [users] = await db.query(
      'SELECT * FROM customers WHERE phone = $1 AND is_active = TRUE', [phone]
    )
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' })

    const user = users[0]
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    await db.query('UPDATE customers SET last_login = NOW() WHERE id = $1', [user.id])

    const token = generateToken({ id: user.id, phone: user.phone, type: 'customer' })

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, city: user.city, avatar_url: user.avatar_url }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// GET /api/customers/me
router.get('/me', authenticateCustomer, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, phone, email, city, avatar_url, created_at FROM customers WHERE id = $1',
      [req.user.id]
    )
    if (users.length === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ user: users[0] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// GET /api/customers/bookings
router.get('/bookings', authenticateCustomer, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const params = [req.user.id]
    let paramIdx = 2

    let statusFilter = ''
    if (status) {
      statusFilter = ` AND b.status = $${paramIdx++}`
      params.push(status)
    }

    params.push(parseInt(limit), offset)

    const [bookings] = await db.query(`
      SELECT b.*, s.name as salon_name, s.address as salon_address,
             s.phone as salon_phone, s.slug as salon_slug, st.name as stylist_name
      FROM bookings b
      JOIN salons s ON s.id = b.salon_id
      LEFT JOIN stylists st ON st.id = b.stylist_id
      WHERE b.customer_id = $1 ${statusFilter}
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `, params)

    for (const booking of bookings) {
      const [services] = await db.query('SELECT * FROM booking_services WHERE booking_id = $1', [booking.id])
      booking.services = services
    }

    res.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

// POST /api/customers/favorites/:salonId
router.post('/favorites/:salonId', authenticateCustomer, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId)

    const [existing] = await db.query(
      'SELECT id FROM favorites WHERE customer_id = $1 AND salon_id = $2',
      [req.user.id, salonId]
    )

    if (existing.length > 0) {
      await db.query('DELETE FROM favorites WHERE id = $1', [existing[0].id])
      res.json({ favorited: false, message: 'Removed from favorites' })
    } else {
      await db.query('INSERT INTO favorites (customer_id, salon_id) VALUES ($1, $2)', [req.user.id, salonId])
      res.json({ favorited: true, message: 'Added to favorites' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update favorites' })
  }
})

// GET /api/customers/favorites
router.get('/favorites', authenticateCustomer, async (req, res) => {
  try {
    const [favorites] = await db.query(`
      SELECT s.*, f.created_at as favorited_at
      FROM favorites f JOIN salons s ON s.id = f.salon_id
      WHERE f.customer_id = $1 AND s.is_active = TRUE
      ORDER BY f.created_at DESC
    `, [req.user.id])
    res.json({ favorites })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' })
  }
})

// POST /api/customers/reviews
router.post('/reviews', authenticateCustomer, async (req, res) => {
  try {
    const { salon_id, booking_id, rating, review } = req.body
    if (!salon_id || !rating) return res.status(400).json({ error: 'salon_id and rating required' })

    const [result] = await db.query(
      `INSERT INTO reviews (salon_id, customer_id, booking_id, rating, review)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [salon_id, req.user.id, booking_id || null, rating, review || null]
    )

    // Update denormalized rating
    await db.query(`
      UPDATE salons SET
        avg_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE salon_id = $1 AND is_approved = TRUE),
        total_ratings = (SELECT COUNT(*) FROM reviews WHERE salon_id = $1 AND is_approved = TRUE)
      WHERE id = $1
    `, [salon_id])

    res.status(201).json({ message: 'Review submitted', review_id: result[0].id })
  } catch (error) {
    console.error('Review error:', error)
    res.status(500).json({ error: 'Failed to submit review' })
  }
})

export default router
