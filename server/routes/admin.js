import express from 'express'
import { body, validationResult } from 'express-validator'
import pool from '../db/config.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// =====================================================
// SALON SETTINGS
// =====================================================

// Get salon settings
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    
    if (settings.length === 0) {
      // Create default settings if not exists
      await pool.query(
        `INSERT INTO salon_settings (id, salon_name) VALUES (1, 'Glamour Cuts') ON DUPLICATE KEY UPDATE id = 1`
      )
      const [newSettings] = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
      return res.json(newSettings[0])
    }
    
    res.json(settings[0])
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// Update salon settings
router.put('/settings', authorize('owner', 'admin'), async (req, res) => {
  try {
    const {
      salon_name, tagline, description, address, city, state, pincode,
      phone, whatsapp, email, website, google_maps_url,
      opening_time, closing_time, slot_duration, lunch_start, lunch_end,
      working_days, logo_url, cover_image_url,
      social_facebook, social_instagram, social_twitter
    } = req.body

    await pool.query(
      `UPDATE salon_settings SET 
        salon_name = ?, tagline = ?, description = ?, address = ?, city = ?, state = ?, pincode = ?,
        phone = ?, whatsapp = ?, email = ?, website = ?, google_maps_url = ?,
        opening_time = ?, closing_time = ?, slot_duration = ?, lunch_start = ?, lunch_end = ?,
        working_days = ?, logo_url = ?, cover_image_url = ?,
        social_facebook = ?, social_instagram = ?, social_twitter = ?
      WHERE id = 1`,
      [
        salon_name, tagline, description, address, city, state, pincode,
        phone, whatsapp, email, website, google_maps_url,
        opening_time, closing_time, slot_duration, lunch_start, lunch_end,
        JSON.stringify(working_days), logo_url, cover_image_url,
        social_facebook, social_instagram, social_twitter
      ]
    )

    const [updated] = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    res.json({ message: 'Settings updated successfully', settings: updated[0] })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// =====================================================
// SERVICE CATEGORIES
// =====================================================

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM service_categories ORDER BY display_order, name'
    )
    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Create category
router.post('/categories', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name, description, icon, display_order } = req.body
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const [result] = await pool.query(
      `INSERT INTO service_categories (name, slug, description, icon, display_order) VALUES (?, ?, ?, ?, ?)`,
      [name, slug, description, icon || '✂️', display_order || 0]
    )

    const [category] = await pool.query('SELECT * FROM service_categories WHERE id = ?', [result.insertId])
    res.status(201).json({ message: 'Category created', category: category[0] })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category with this name already exists' })
    }
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Update category
router.put('/categories/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, icon, display_order, is_active } = req.body
    
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    await pool.query(
      `UPDATE service_categories SET name = ?, slug = ?, description = ?, icon = ?, display_order = ?, is_active = ? WHERE id = ?`,
      [name, slug, description, icon, display_order, is_active, id]
    )

    const [category] = await pool.query('SELECT * FROM service_categories WHERE id = ?', [id])
    res.json({ message: 'Category updated', category: category[0] })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// Delete category
router.delete('/categories/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM service_categories WHERE id = ?', [id])
    res.json({ message: 'Category deleted' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// =====================================================
// SERVICES MANAGEMENT
// =====================================================

// Get all services (including inactive for admin)
router.get('/services', async (req, res) => {
  try {
    const [services] = await pool.query(`
      SELECT s.*, c.name as category_name, c.slug as category_slug 
      FROM services s 
      LEFT JOIN service_categories c ON s.category_id = c.id 
      ORDER BY s.display_order, s.name
    `)
    res.json(services)
  } catch (error) {
    console.error('Get services error:', error)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

// Create service
router.post('/services', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { 
      category_id, name, description, price, discounted_price, 
      duration, icon, image_url, is_popular, display_order 
    } = req.body

    const [result] = await pool.query(
      `INSERT INTO services 
       (category_id, name, description, price, discounted_price, duration, icon, image_url, is_popular, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, description, price, discounted_price, duration, icon || '✂️', image_url, is_popular || false, display_order || 0]
    )

    const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [result.insertId])
    res.status(201).json({ message: 'Service created', service: service[0] })
  } catch (error) {
    console.error('Create service error:', error)
    res.status(500).json({ error: 'Failed to create service' })
  }
})

// Update service
router.put('/services/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { 
      category_id, name, description, price, discounted_price, 
      duration, icon, image_url, is_popular, is_active, display_order 
    } = req.body

    await pool.query(
      `UPDATE services SET 
       category_id = ?, name = ?, description = ?, price = ?, discounted_price = ?,
       duration = ?, icon = ?, image_url = ?, is_popular = ?, is_active = ?, display_order = ?
       WHERE id = ?`,
      [category_id, name, description, price, discounted_price, duration, icon, image_url, is_popular, is_active, display_order, id]
    )

    const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [id])
    res.json({ message: 'Service updated', service: service[0] })
  } catch (error) {
    console.error('Update service error:', error)
    res.status(500).json({ error: 'Failed to update service' })
  }
})

// Delete service
router.delete('/services/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM services WHERE id = ?', [id])
    res.json({ message: 'Service deleted' })
  } catch (error) {
    console.error('Delete service error:', error)
    res.status(500).json({ error: 'Failed to delete service' })
  }
})

// =====================================================
// STYLISTS MANAGEMENT
// =====================================================

// Get all stylists
router.get('/stylists', async (req, res) => {
  try {
    const [stylists] = await pool.query(
      'SELECT * FROM stylists ORDER BY display_order, name'
    )
    res.json(stylists)
  } catch (error) {
    console.error('Get stylists error:', error)
    res.status(500).json({ error: 'Failed to fetch stylists' })
  }
})

// Create stylist
router.post('/stylists', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { name, email, phone, role, experience, speciality, bio, avatar_url, avatar_emoji, display_order } = req.body

    const [result] = await pool.query(
      `INSERT INTO stylists (name, email, phone, role, experience, speciality, bio, avatar_url, avatar_emoji, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, role || 'Stylist', experience, speciality, bio, avatar_url, avatar_emoji || '👨‍🦱', display_order || 0]
    )

    const [stylist] = await pool.query('SELECT * FROM stylists WHERE id = ?', [result.insertId])
    res.status(201).json({ message: 'Stylist created', stylist: stylist[0] })
  } catch (error) {
    console.error('Create stylist error:', error)
    res.status(500).json({ error: 'Failed to create stylist' })
  }
})

// Update stylist
router.put('/stylists/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, role, experience, speciality, bio, avatar_url, avatar_emoji, is_active, display_order } = req.body

    await pool.query(
      `UPDATE stylists SET 
       name = ?, email = ?, phone = ?, role = ?, experience = ?, speciality = ?, 
       bio = ?, avatar_url = ?, avatar_emoji = ?, is_active = ?, display_order = ?
       WHERE id = ?`,
      [name, email, phone, role, experience, speciality, bio, avatar_url, avatar_emoji, is_active, display_order, id]
    )

    const [stylist] = await pool.query('SELECT * FROM stylists WHERE id = ?', [id])
    res.json({ message: 'Stylist updated', stylist: stylist[0] })
  } catch (error) {
    console.error('Update stylist error:', error)
    res.status(500).json({ error: 'Failed to update stylist' })
  }
})

// Delete stylist
router.delete('/stylists/:id', authorize('owner', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM stylists WHERE id = ?', [id])
    res.json({ message: 'Stylist deleted' })
  } catch (error) {
    console.error('Delete stylist error:', error)
    res.status(500).json({ error: 'Failed to delete stylist' })
  }
})

// =====================================================
// CONTACT MESSAGES
// =====================================================

// Get all contact messages
router.get('/messages', async (req, res) => {
  try {
    const { is_read } = req.query
    let query = 'SELECT * FROM contact_messages'
    const params = []

    if (is_read !== undefined) {
      query += ' WHERE is_read = ?'
      params.push(is_read === 'true')
    }

    query += ' ORDER BY created_at DESC'

    const [messages] = await pool.query(query, params)
    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Mark message as read
router.patch('/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('UPDATE contact_messages SET is_read = TRUE WHERE id = ?', [id])
    res.json({ message: 'Message marked as read' })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Failed to update message' })
  }
})

// Delete message
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM contact_messages WHERE id = ?', [id])
    res.json({ message: 'Message deleted' })
  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

// =====================================================
// DASHBOARD STATS
// =====================================================

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Today's bookings
    const [todayBookings] = await pool.query(
      `SELECT COUNT(*) as count FROM bookings WHERE booking_date = ?`,
      [today]
    )

    // Pending bookings
    const [pendingBookings] = await pool.query(
      `SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`
    )

    // This month's revenue
    const [monthRevenue] = await pool.query(
      `SELECT COALESCE(SUM(final_price), 0) as total FROM bookings 
       WHERE status = 'completed' 
       AND MONTH(booking_date) = MONTH(CURRENT_DATE()) 
       AND YEAR(booking_date) = YEAR(CURRENT_DATE())`
    )

    // Unread messages
    const [unreadMessages] = await pool.query(
      `SELECT COUNT(*) as count FROM contact_messages WHERE is_read = FALSE`
    )

    // Recent bookings
    const [recentBookings] = await pool.query(
      `SELECT b.*, s.name as stylist_name 
       FROM bookings b 
       LEFT JOIN stylists s ON b.stylist_id = s.id 
       ORDER BY b.created_at DESC LIMIT 10`
    )

    // Get services for recent bookings
    for (const booking of recentBookings) {
      const [services] = await pool.query(
        'SELECT * FROM booking_services WHERE booking_id = ?',
        [booking.id]
      )
      booking.services = services
    }

    res.json({
      stats: {
        todayBookings: todayBookings[0].count,
        pendingBookings: pendingBookings[0].count,
        monthRevenue: monthRevenue[0].total,
        unreadMessages: unreadMessages[0].count
      },
      recentBookings
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

export default router

