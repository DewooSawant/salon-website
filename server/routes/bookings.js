import express from 'express'
import { body, validationResult } from 'express-validator'
import pool from '../db/config.js'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { sendBookingNotification, generateWhatsAppLink } from '../services/whatsapp.js'

const router = express.Router()

// Generate unique booking code
function generateBookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'GC'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Convert time string to minutes for comparison
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Add minutes to time string
function addMinutesToTime(timeStr, minutes) {
  const totalMinutes = timeToMinutes(timeStr) + minutes
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
}

// Validation middleware
const validateBooking = [
  body('customer_name').trim().notEmpty().withMessage('Name is required'),
  body('customer_phone').trim().notEmpty().withMessage('Phone is required'),
  body('booking_date').notEmpty().withMessage('Date is required'),
  body('start_time').notEmpty().withMessage('Time is required'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
]

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Get available time slots for a date and stylist
router.get('/available-slots/:date', async (req, res) => {
  try {
    const { date } = req.params
    const { stylist_id, duration } = req.query
    const serviceDuration = parseInt(duration) || 30

    // Get salon settings for operating hours
    const [settings] = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    const salonSettings = settings[0] || {
      opening_time: '10:00:00',
      closing_time: '21:00:00',
      slot_duration: 30,
      lunch_start: '13:00:00',
      lunch_end: '14:00:00'
    }

    const slotDuration = salonSettings.slot_duration || 30
    const openingMinutes = timeToMinutes(salonSettings.opening_time)
    const closingMinutes = timeToMinutes(salonSettings.closing_time)
    const lunchStartMinutes = timeToMinutes(salonSettings.lunch_start || '13:00:00')
    const lunchEndMinutes = timeToMinutes(salonSettings.lunch_end || '14:00:00')

    // Generate all possible slots
    const allSlots = []
    for (let mins = openingMinutes; mins < closingMinutes; mins += slotDuration) {
      // Skip lunch time
      if (mins >= lunchStartMinutes && mins < lunchEndMinutes) continue
      
      // Check if there's enough time before closing
      if (mins + serviceDuration > closingMinutes) continue

      const hours = Math.floor(mins / 60)
      const minutes = mins % 60
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const hour12 = hours % 12 || 12
      const displayTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
      
      allSlots.push({ time: timeStr, display: displayTime })
    }

    // Get booked slots for the date (and specific stylist if provided)
    let bookingQuery = `
      SELECT start_time, end_time, stylist_id 
      FROM bookings 
      WHERE booking_date = ? AND status NOT IN ('cancelled', 'no_show')
    `
    const params = [date]

    if (stylist_id) {
      bookingQuery += ' AND stylist_id = ?'
      params.push(stylist_id)
    }

    const [bookedSlots] = await pool.query(bookingQuery, params)

    // Filter out slots that conflict with existing bookings
    const availableSlots = allSlots.filter(slot => {
      const slotStart = timeToMinutes(slot.time)
      const slotEnd = slotStart + serviceDuration

      // Check for conflicts with existing bookings
      for (const booking of bookedSlots) {
        const bookingStart = timeToMinutes(booking.start_time)
        const bookingEnd = timeToMinutes(booking.end_time)

        // Check if slots overlap
        if (slotStart < bookingEnd && slotEnd > bookingStart) {
          return false
        }
      }
      return true
    })

    res.json({ 
      date, 
      stylist_id: stylist_id || null,
      availableSlots,
      totalSlots: allSlots.length,
      bookedCount: allSlots.length - availableSlots.length
    })
  } catch (error) {
    console.error('Get slots error:', error)
    res.status(500).json({ error: 'Failed to fetch available slots' })
  }
})

// Get stylists availability for a specific date and time
router.get('/stylist-availability/:date/:time', async (req, res) => {
  try {
    const { date, time } = req.params
    const { duration } = req.query
    const serviceDuration = parseInt(duration) || 30

    // Get all active stylists
    const [stylists] = await pool.query(
      'SELECT id, name, role, avatar_emoji FROM stylists WHERE is_active = TRUE ORDER BY display_order'
    )

    // Get bookings for this date
    const [bookings] = await pool.query(
      `SELECT stylist_id, start_time, end_time 
       FROM bookings 
       WHERE booking_date = ? AND status NOT IN ('cancelled', 'no_show')`,
      [date]
    )

    const requestedStart = timeToMinutes(time)
    const requestedEnd = requestedStart + serviceDuration

    // Check each stylist's availability
    const availability = stylists.map(stylist => {
      const stylistBookings = bookings.filter(b => b.stylist_id === stylist.id)
      
      let isAvailable = true
      let nextAvailable = null

      for (const booking of stylistBookings) {
        const bookingStart = timeToMinutes(booking.start_time)
        const bookingEnd = timeToMinutes(booking.end_time)

        // Check for overlap
        if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
          isAvailable = false
          // Calculate next available time
          const endMinutes = bookingEnd
          const hours = Math.floor(endMinutes / 60)
          const mins = endMinutes % 60
          nextAvailable = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
          break
        }
      }

      return {
        ...stylist,
        isAvailable,
        nextAvailable
      }
    })

    res.json({ date, time, availability })
  } catch (error) {
    console.error('Stylist availability error:', error)
    res.status(500).json({ error: 'Failed to check stylist availability' })
  }
})

// Create a new booking (public)
router.post('/', validateBooking, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const connection = await pool.getConnection()
  
  try {
    await connection.beginTransaction()

    const {
      customer_name,
      customer_phone,
      customer_email,
      booking_date,
      start_time,
      stylist_id,
      services,
      notes
    } = req.body

    // Calculate totals
    const total_duration = services.reduce((sum, s) => sum + (s.duration || 30), 0)
    const total_price = services.reduce((sum, s) => sum + (s.price || 0), 0)
    const end_time = addMinutesToTime(start_time, total_duration)

    // Check for conflicting bookings for this stylist
    if (stylist_id) {
      const [conflicts] = await connection.query(
        `SELECT id, booking_code FROM bookings 
         WHERE stylist_id = ? 
         AND booking_date = ? 
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (start_time < ? AND end_time > ?) OR
           (start_time < ? AND end_time > ?) OR
           (start_time >= ? AND end_time <= ?)
         )`,
        [stylist_id, booking_date, end_time, start_time, end_time, start_time, start_time, end_time]
      )

      if (conflicts.length > 0) {
        await connection.rollback()
        return res.status(409).json({ 
          error: 'This time slot is already booked for the selected stylist. Please choose a different time or stylist.',
          conflictingBooking: conflicts[0].booking_code
        })
      }
    }

    // Generate unique booking code
    let booking_code
    let isUnique = false
    while (!isUnique) {
      booking_code = generateBookingCode()
      const [existing] = await connection.query(
        'SELECT id FROM bookings WHERE booking_code = ?',
        [booking_code]
      )
      isUnique = existing.length === 0
    }

    // Create booking
    const [result] = await connection.query(
      `INSERT INTO bookings 
       (booking_code, customer_name, customer_phone, customer_email, stylist_id, 
        booking_date, start_time, end_time, total_duration, total_price, 
        discount_amount, final_price, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        booking_code, customer_name, customer_phone, customer_email || null, stylist_id || null,
        booking_date, start_time + ':00', end_time, total_duration, total_price,
        0, total_price, notes || null
      ]
    )

    const bookingId = result.insertId

    // Insert booking services
    for (const service of services) {
      await connection.query(
        `INSERT INTO booking_services (booking_id, service_id, service_name, service_price, service_duration) 
         VALUES (?, ?, ?, ?, ?)`,
        [bookingId, service.id || null, service.name, service.price, service.duration || 30]
      )
    }

    await connection.commit()

    // Get complete booking details
    const [bookings] = await pool.query(
      `SELECT b.*, s.name as stylist_name 
       FROM bookings b 
       LEFT JOIN stylists s ON b.stylist_id = s.id 
       WHERE b.id = ?`,
      [bookingId]
    )
    const booking = bookings[0]
    
    // Get services
    const [bookingServices] = await pool.query(
      'SELECT * FROM booking_services WHERE booking_id = ?',
      [bookingId]
    )
    booking.services = bookingServices

    // Send WhatsApp notifications
    const notifications = await sendBookingNotification(booking, 'booking_created')

    res.status(201).json({
      message: 'Booking created successfully!',
      booking,
      notifications: {
        customerWhatsAppLink: notifications?.customer?.whatsappLink,
        ownerWhatsAppLink: notifications?.owner?.whatsappLink
      }
    })
  } catch (error) {
    await connection.rollback()
    console.error('Booking error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  } finally {
    connection.release()
  }
})

// Get booking by code (public - for customers to check status)
router.get('/track/:code', async (req, res) => {
  try {
    const { code } = req.params

    const [bookings] = await pool.query(
      `SELECT b.id, b.booking_code, b.customer_name, b.booking_date, b.start_time, 
              b.end_time, b.total_price, b.final_price, b.status, b.created_at,
              s.name as stylist_name, s.avatar_emoji
       FROM bookings b 
       LEFT JOIN stylists s ON b.stylist_id = s.id 
       WHERE b.booking_code = ?`,
      [code]
    )

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookings[0]
    
    const [services] = await pool.query(
      'SELECT service_name, service_price, service_duration FROM booking_services WHERE booking_id = ?',
      [booking.id]
    )
    
    booking.services = services
    delete booking.id // Don't expose internal ID

    res.json(booking)
  } catch (error) {
    console.error('Track booking error:', error)
    res.status(500).json({ error: 'Failed to fetch booking' })
  }
})

// =====================================================
// ADMIN ROUTES (require authentication)
// =====================================================

// Get all bookings (admin)
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, status, stylist_id, from_date, to_date } = req.query
    
    let query = `
      SELECT b.*, s.name as stylist_name, s.avatar_emoji 
      FROM bookings b 
      LEFT JOIN stylists s ON b.stylist_id = s.id 
      WHERE 1=1
    `
    const params = []

    if (date) {
      query += ' AND b.booking_date = ?'
      params.push(date)
    }

    if (from_date && to_date) {
      query += ' AND b.booking_date BETWEEN ? AND ?'
      params.push(from_date, to_date)
    }

    if (status) {
      query += ' AND b.status = ?'
      params.push(status)
    }

    if (stylist_id) {
      query += ' AND b.stylist_id = ?'
      params.push(stylist_id)
    }

    query += ' ORDER BY b.booking_date DESC, b.start_time ASC'

    const [bookings] = await pool.query(query, params)

    // Get services for each booking
    for (const booking of bookings) {
      const [services] = await pool.query(
        'SELECT * FROM booking_services WHERE booking_id = ?',
        [booking.id]
      )
      booking.services = services
    }

    res.json(bookings)
  } catch (error) {
    console.error('Get bookings error:', error)
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

// Get booking by ID (admin)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const [bookings] = await pool.query(
      `SELECT b.*, s.name as stylist_name, s.phone as stylist_phone, s.avatar_emoji 
       FROM bookings b 
       LEFT JOIN stylists s ON b.stylist_id = s.id 
       WHERE b.id = ?`,
      [id]
    )

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookings[0]
    
    const [services] = await pool.query(
      'SELECT * FROM booking_services WHERE booking_id = ?',
      [id]
    )
    booking.services = services

    // Get notification history
    const [notifications] = await pool.query(
      'SELECT * FROM notification_log WHERE booking_id = ? ORDER BY created_at DESC',
      [id]
    )
    booking.notifications = notifications

    res.json(booking)
  } catch (error) {
    console.error('Get booking error:', error)
    res.status(500).json({ error: 'Failed to fetch booking' })
  }
})

// Update booking status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { status, cancellation_reason } = req.body

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Get booking details first
    const [bookings] = await pool.query(
      `SELECT b.*, s.name as stylist_name 
       FROM bookings b 
       LEFT JOIN stylists s ON b.stylist_id = s.id 
       WHERE b.id = ?`,
      [id]
    )

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = bookings[0]

    // Update status
    let updateQuery = 'UPDATE bookings SET status = ?'
    const params = [status]

    if (status === 'cancelled' && cancellation_reason) {
      updateQuery += ', cancellation_reason = ?'
      params.push(cancellation_reason)
    }

    if (status === 'completed') {
      updateQuery += ', payment_status = ?'
      params.push('paid')
    }

    updateQuery += ' WHERE id = ?'
    params.push(id)

    await pool.query(updateQuery, params)

    // Get services for notification
    const [services] = await pool.query(
      'SELECT * FROM booking_services WHERE booking_id = ?',
      [id]
    )
    booking.services = services
    booking.status = status
    booking.cancellation_reason = cancellation_reason

    // Send appropriate notification
    let notificationType = null
    if (status === 'confirmed') {
      notificationType = 'booking_confirmed'
    } else if (status === 'completed') {
      notificationType = 'booking_completed'
    } else if (status === 'cancelled') {
      notificationType = 'booking_cancelled'
    }

    let notifications = null
    if (notificationType) {
      notifications = await sendBookingNotification(booking, notificationType)
    }

    res.json({ 
      message: 'Booking status updated',
      booking: { ...booking, status },
      notifications: notifications ? {
        customerWhatsAppLink: notifications?.customer?.whatsappLink
      } : null
    })
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({ error: 'Failed to update booking status' })
  }
})

// Update booking details
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { 
      booking_date, start_time, stylist_id, 
      discount_amount, notes, payment_status 
    } = req.body

    // If changing date/time/stylist, check for conflicts
    if (booking_date && start_time && stylist_id) {
      const [currentBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id])
      if (currentBooking.length === 0) {
        return res.status(404).json({ error: 'Booking not found' })
      }

      const end_time = addMinutesToTime(start_time, currentBooking[0].total_duration)

      const [conflicts] = await pool.query(
        `SELECT id FROM bookings 
         WHERE id != ? AND stylist_id = ? AND booking_date = ? 
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (start_time < ? AND end_time > ?) OR
           (start_time < ? AND end_time > ?) OR
           (start_time >= ? AND end_time <= ?)
         )`,
        [id, stylist_id, booking_date, end_time, start_time, end_time, start_time, start_time, end_time]
      )

      if (conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'This time slot conflicts with an existing booking'
        })
      }
    }

    let updateFields = []
    let params = []

    if (booking_date) {
      updateFields.push('booking_date = ?')
      params.push(booking_date)
    }
    if (start_time) {
      updateFields.push('start_time = ?')
      params.push(start_time + ':00')
    }
    if (stylist_id !== undefined) {
      updateFields.push('stylist_id = ?')
      params.push(stylist_id)
    }
    if (discount_amount !== undefined) {
      updateFields.push('discount_amount = ?')
      updateFields.push('final_price = total_price - ?')
      params.push(discount_amount, discount_amount)
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?')
      params.push(notes)
    }
    if (payment_status) {
      updateFields.push('payment_status = ?')
      params.push(payment_status)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    params.push(id)
    await pool.query(`UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`, params)

    const [updated] = await pool.query(
      `SELECT b.*, s.name as stylist_name 
       FROM bookings b 
       LEFT JOIN stylists s ON b.stylist_id = s.id 
       WHERE b.id = ?`,
      [id]
    )

    res.json({ message: 'Booking updated', booking: updated[0] })
  } catch (error) {
    console.error('Update booking error:', error)
    res.status(500).json({ error: 'Failed to update booking' })
  }
})

// Delete booking
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    
    // Delete related records first
    await pool.query('DELETE FROM booking_services WHERE booking_id = ?', [id])
    await pool.query('DELETE FROM notification_log WHERE booking_id = ?', [id])
    await pool.query('DELETE FROM bookings WHERE id = ?', [id])

    res.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Delete booking error:', error)
    res.status(500).json({ error: 'Failed to delete booking' })
  }
})

// Get today's schedule
router.get('/schedule/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [bookings] = await pool.query(
      `SELECT b.*, s.name as stylist_name, s.avatar_emoji 
       FROM bookings b 
       LEFT JOIN stylists s ON b.stylist_id = s.id 
       WHERE b.booking_date = ? AND b.status NOT IN ('cancelled', 'no_show')
       ORDER BY b.start_time`,
      [today]
    )

    for (const booking of bookings) {
      const [services] = await pool.query(
        'SELECT service_name FROM booking_services WHERE booking_id = ?',
        [booking.id]
      )
      booking.services = services
    }

    // Group by stylist
    const [stylists] = await pool.query('SELECT * FROM stylists WHERE is_active = TRUE')
    
    const schedule = stylists.map(stylist => ({
      ...stylist,
      bookings: bookings.filter(b => b.stylist_id === stylist.id)
    }))

    res.json({ date: today, schedule })
  } catch (error) {
    console.error('Get schedule error:', error)
    res.status(500).json({ error: 'Failed to fetch schedule' })
  }
})

export default router
