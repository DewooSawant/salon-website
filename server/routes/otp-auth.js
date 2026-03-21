import { Router } from 'express'
import db from '../db/config_pg.js'
import { generateToken } from '../middleware/auth_v2.js'
import { sendOTP, verifyOTP, normalizePhone } from '../services/otp.js'

const router = Router()

// POST /api/otp/send - Send OTP to phone number
router.post('/send', async (req, res) => {
  try {
    const { phone, role } = req.body // role: 'customer' or 'salon_owner'
    if (!phone) return res.status(400).json({ error: 'Phone number is required' })

    // For salon_owner role, check that the phone exists as an owner
    if (role === 'salon_owner') {
      const normalized = normalizePhone(phone)
      if (!normalized) return res.status(400).json({ error: 'Invalid phone number' })

      const [owners] = await db.query(
        'SELECT so.id FROM salon_owners so WHERE so.phone = $1 AND so.is_active = TRUE',
        [normalized]
      )
      if (owners.length === 0) {
        return res.status(404).json({ error: 'No salon owner account found with this phone number. Please register first.' })
      }
    }

    const result = await sendOTP(phone)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// POST /api/otp/verify/customer - Verify OTP and login/register customer
router.post('/verify/customer', async (req, res) => {
  try {
    const { phone, otp, name } = req.body
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' })

    // Verify OTP
    const { phone: normalizedPhone } = await verifyOTP(phone, otp)

    // Check if customer exists
    const [existing] = await db.query(
      'SELECT id, name, phone, email, city, avatar_url FROM customers WHERE phone = $1 AND is_active = TRUE',
      [normalizedPhone]
    )

    let customer
    let isNewUser = false

    if (existing.length > 0) {
      // Existing customer - login
      customer = existing[0]
      await db.query('UPDATE customers SET last_login = NOW() WHERE id = $1', [customer.id])
    } else {
      // New customer - auto-register
      isNewUser = true
      const displayName = name || `User ${normalizedPhone.slice(-4)}`
      const [result] = await db.query(
        `INSERT INTO customers (name, phone, password) VALUES ($1, $2, 'otp-auth') RETURNING id`,
        [displayName, normalizedPhone]
      )
      customer = { id: result[0].id, name: displayName, phone: normalizedPhone, email: null, city: null }
    }

    const token = generateToken({ id: customer.id, phone: normalizedPhone, type: 'customer' })

    res.json({
      message: isNewUser ? 'Account created & logged in' : 'Login successful',
      token,
      user: customer,
      is_new_user: isNewUser,
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// POST /api/otp/verify/salon-owner - Verify OTP and login salon owner
router.post('/verify/salon-owner', async (req, res) => {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' })

    // Verify OTP
    const { phone: normalizedPhone } = await verifyOTP(phone, otp)

    // Find salon owner by phone
    const [owners] = await db.query(
      `SELECT so.*, s.name as salon_name, s.slug as salon_slug
       FROM salon_owners so
       JOIN salons s ON s.id = so.salon_id
       WHERE so.phone = $1 AND so.is_active = TRUE`,
      [normalizedPhone]
    )

    if (owners.length === 0) {
      return res.status(404).json({ error: 'No salon owner account found with this phone number' })
    }

    const owner = owners[0]
    await db.query('UPDATE salon_owners SET last_login = NOW() WHERE id = $1', [owner.id])

    const token = generateToken({ id: owner.id, salon_id: owner.salon_id, type: 'salon_owner' })

    res.json({
      message: 'Login successful',
      token,
      user: { id: owner.id, name: owner.name, email: owner.email, phone: normalizedPhone, role: owner.role },
      salon: { id: owner.salon_id, name: owner.salon_name, slug: owner.salon_slug },
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
