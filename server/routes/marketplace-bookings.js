import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import db, { pool } from '../db/config_pg.js'
import { authenticateCustomer, optionalAuth } from '../middleware/auth_v2.js'

const router = Router()

function generateBookingCode(salonSlug) {
  const prefix = (salonSlug || 'SN').substring(0, 2).toUpperCase()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

function addMinutesToTime(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`
}

const validateBooking = [
  body('salon_id').isInt().withMessage('salon_id required'),
  body('customer_name').trim().notEmpty().withMessage('Name required'),
  body('customer_phone').trim().notEmpty().withMessage('Phone required'),
  body('booking_date').notEmpty().withMessage('Date required'),
  body('start_time').notEmpty().withMessage('Time required'),
  body('services').isArray({ min: 1 }).withMessage('At least one service required'),
]

// POST /api/marketplace/bookings
router.post('/', optionalAuth, validateBooking, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { salon_id, customer_name, customer_phone, customer_email, stylist_id, booking_date, start_time, services, notes } = req.body

    const [salons] = await db.query('SELECT * FROM salons WHERE id = $1 AND is_active = TRUE', [salon_id])
    if (salons.length === 0) return res.status(404).json({ error: 'Salon not found' })
    const salon = salons[0]

    // Get service details using ANY() for array
    const [serviceDetails] = await db.query(
      'SELECT id, name, price, duration FROM services WHERE id = ANY($1) AND salon_id = $2 AND is_active = TRUE',
      [services, salon_id]
    )
    if (serviceDetails.length === 0) return res.status(400).json({ error: 'No valid services selected' })

    const totalDuration = serviceDetails.reduce((sum, s) => sum + s.duration, 0)
    const totalPrice = serviceDetails.reduce((sum, s) => sum + parseFloat(s.price), 0)
    const endTime = addMinutesToTime(start_time, totalDuration)

    // Check conflicts
    const conflictParams = [salon_id, booking_date, endTime, start_time, start_time, endTime]
    let conflictQuery = `
      SELECT id FROM bookings WHERE salon_id = $1 AND booking_date = $2
      AND status NOT IN ('cancelled', 'no_show')
      AND ((start_time < $3 AND end_time > $4) OR (start_time >= $5 AND start_time < $6))
    `
    if (stylist_id) {
      conflictQuery += ' AND stylist_id = $7'
      conflictParams.push(stylist_id)
    }

    const [conflicts] = await db.query(conflictQuery, conflictParams)
    if (conflicts.length > 0) return res.status(409).json({ error: 'Time slot not available' })

    const bookingCode = generateBookingCode(salon.slug)
    const customerId = req.user?.type === 'customer' ? req.user.id : null

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const { rows: [booking] } = await client.query(
        `INSERT INTO bookings (booking_code, salon_id, customer_id, customer_name, customer_phone, customer_email,
         stylist_id, booking_date, start_time, end_time, total_duration, total_price, discount_amount, final_price, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,$13,$14) RETURNING id`,
        [bookingCode, salon_id, customerId, customer_name, customer_phone, customer_email || null,
         stylist_id || null, booking_date, start_time, endTime, totalDuration, totalPrice, totalPrice, notes || null]
      )

      for (const service of serviceDetails) {
        await client.query(
          `INSERT INTO booking_services (booking_id, service_id, service_name, service_price, service_duration)
           VALUES ($1,$2,$3,$4,$5)`,
          [booking.id, service.id, service.name, service.price, service.duration]
        )
      }

      // Check auto-confirm setting
      const autoConfirmResult = await client.query(
        'SELECT auto_confirm_bookings FROM salons WHERE id = $1', [salon_id]
      )
      const autoConfirm = autoConfirmResult.rows[0]?.auto_confirm_bookings || false
      let bookingStatus = 'pending'

      if (autoConfirm) {
        await client.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', booking.id])
        bookingStatus = 'confirmed'
      }

      // Create notification for salon owner
      const serviceNames = serviceDetails.map(s => s.name).join(', ')
      const timeFormatted = start_time.replace(/^(\d{2}):(\d{2}).*/, (_, h, m) => {
        const hr = parseInt(h); return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
      })

      await client.query(
        `INSERT INTO notifications (salon_id, type, title, message, booking_id, data)
         VALUES ($1, 'new_booking', $2, $3, $4, $5)`,
        [
          salon_id,
          `New Booking from ${customer_name}`,
          `${serviceNames} on ${booking_date} at ${timeFormatted} • ₹${totalPrice}`,
          booking.id,
          JSON.stringify({
            booking_code: bookingCode,
            customer_name,
            customer_phone,
            booking_date,
            start_time,
            services: serviceNames,
            total_price: totalPrice,
            auto_confirmed: autoConfirm
          })
        ]
      )

      await client.query('COMMIT')

      const customerMsg = `Hi! I've booked at ${salon.name}.\nCode: ${bookingCode}\nDate: ${booking_date}\nTime: ${start_time}\nServices: ${serviceNames}\nTotal: Rs ${totalPrice}`
      const ownerMsg = `🔔 New booking!\nCode: ${bookingCode}\nCustomer: ${customer_name} (${customer_phone})\nDate: ${booking_date} at ${timeFormatted}\nServices: ${serviceNames}\nTotal: Rs ${totalPrice}`

      // Build WhatsApp links
      const ownerPhone = salon.phone?.replace(/\D/g, '')
      const customerWhatsAppLink = salon.whatsapp
        ? `https://wa.me/${salon.whatsapp}?text=${encodeURIComponent(customerMsg)}`
        : null
      const ownerWhatsAppLink = ownerPhone
        ? `https://wa.me/91${ownerPhone}?text=${encodeURIComponent(ownerMsg)}`
        : null

      res.status(201).json({
        message: autoConfirm ? 'Booking confirmed' : 'Booking submitted',
        booking: {
          id: booking.id, booking_code: bookingCode, salon_name: salon.name,
          booking_date, start_time, end_time: endTime,
          total_duration: totalDuration, total_price: totalPrice,
          services: serviceDetails, status: bookingStatus
        },
        notifications: { customerWhatsAppLink, ownerWhatsAppLink }
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Booking error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

// GET /api/marketplace/bookings/track/:code
router.get('/track/:code', async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT b.*, s.name as salon_name, s.address as salon_address,
             s.phone as salon_phone, s.slug as salon_slug, st.name as stylist_name
      FROM bookings b JOIN salons s ON s.id = b.salon_id
      LEFT JOIN stylists st ON st.id = b.stylist_id
      WHERE b.booking_code = $1`, [req.params.code]
    )
    if (bookings.length === 0) return res.status(404).json({ error: 'Booking not found' })

    const booking = bookings[0]
    const [services] = await db.query('SELECT * FROM booking_services WHERE booking_id = $1', [booking.id])
    booking.services = services

    res.json({ booking })
  } catch (error) {
    res.status(500).json({ error: 'Failed to track booking' })
  }
})

// PATCH /api/marketplace/bookings/:id/cancel
router.patch('/:id/cancel', authenticateCustomer, async (req, res) => {
  try {
    const { reason } = req.body

    const [bookings] = await db.query(
      'SELECT id, status FROM bookings WHERE id = $1 AND customer_id = $2', [req.params.id, req.user.id]
    )
    if (bookings.length === 0) return res.status(404).json({ error: 'Booking not found' })
    if (['completed', 'cancelled'].includes(bookings[0].status)) {
      return res.status(400).json({ error: `Cannot cancel a ${bookings[0].status} booking` })
    }

    await db.query(
      'UPDATE bookings SET status = $1, cancellation_reason = $2 WHERE id = $3',
      ['cancelled', reason || null, req.params.id]
    )
    res.json({ message: 'Booking cancelled' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' })
  }
})

export default router
