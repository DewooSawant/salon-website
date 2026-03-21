import express from 'express'
import pool from '../db/config.js'

const router = express.Router()

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Get all active services (grouped by category)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    
    let query = `
      SELECT s.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
      FROM services s 
      LEFT JOIN service_categories c ON s.category_id = c.id 
      WHERE s.is_active = TRUE
    `
    const params = []

    if (category) {
      query += ' AND c.slug = ?'
      params.push(category)
    }

    query += ' ORDER BY s.is_popular DESC, s.display_order, s.name'

    const [services] = await pool.query(query, params)
    res.json(services)
  } catch (error) {
    console.error('Get services error:', error)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

// Get services grouped by category
router.get('/grouped', async (req, res) => {
  try {
    // Get all active categories
    const [categories] = await pool.query(
      'SELECT * FROM service_categories WHERE is_active = TRUE ORDER BY display_order, name'
    )

    // Get all active services
    const [services] = await pool.query(
      `SELECT s.*, c.slug as category_slug
       FROM services s 
       LEFT JOIN service_categories c ON s.category_id = c.id 
       WHERE s.is_active = TRUE 
       ORDER BY s.is_popular DESC, s.display_order, s.name`
    )

    // Group services by category
    const grouped = categories.map(category => ({
      ...category,
      services: services.filter(s => s.category_id === category.id)
    }))

    res.json(grouped)
  } catch (error) {
    console.error('Get grouped services error:', error)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

// Get all active categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM service_categories WHERE is_active = TRUE ORDER BY display_order, name'
    )
    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Get all active stylists
router.get('/stylists', async (req, res) => {
  try {
    const [stylists] = await pool.query(
      'SELECT id, name, role, experience, speciality, avatar_url, avatar_emoji FROM stylists WHERE is_active = TRUE ORDER BY display_order, name'
    )
    res.json(stylists)
  } catch (error) {
    console.error('Get stylists error:', error)
    res.status(500).json({ error: 'Failed to fetch stylists' })
  }
})

// Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [services] = await pool.query(
      `SELECT s.*, c.name as category_name, c.slug as category_slug
       FROM services s 
       LEFT JOIN service_categories c ON s.category_id = c.id 
       WHERE s.id = ?`,
      [id]
    )
    
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' })
    }

    res.json(services[0])
  } catch (error) {
    console.error('Get service error:', error)
    res.status(500).json({ error: 'Failed to fetch service' })
  }
})

// Get salon settings (public)
router.get('/salon/settings', async (req, res) => {
  try {
    const [settings] = await pool.query(
      `SELECT salon_name, tagline, description, address, city, state, pincode, 
              phone, whatsapp, email, website, google_maps_url, 
              opening_time, closing_time, working_days, logo_url, cover_image_url,
              social_facebook, social_instagram, social_twitter
       FROM salon_settings WHERE id = 1`
    )
    
    if (settings.length === 0) {
      return res.json({
        salon_name: 'Glamour Cuts',
        tagline: 'Premium Hair Salon',
        city: 'Pune'
      })
    }

    res.json(settings[0])
  } catch (error) {
    console.error('Get salon settings error:', error)
    res.status(500).json({ error: 'Failed to fetch salon settings' })
  }
})

// Get gallery images
router.get('/gallery/images', async (req, res) => {
  try {
    const [images] = await pool.query(
      'SELECT * FROM gallery WHERE is_active = TRUE ORDER BY is_featured DESC, display_order, created_at DESC'
    )
    res.json(images)
  } catch (error) {
    console.error('Get gallery error:', error)
    res.status(500).json({ error: 'Failed to fetch gallery' })
  }
})

// Get testimonials
router.get('/testimonials/approved', async (req, res) => {
  try {
    const [testimonials] = await pool.query(
      'SELECT * FROM testimonials WHERE is_approved = TRUE ORDER BY is_featured DESC, created_at DESC LIMIT 20'
    )
    res.json(testimonials)
  } catch (error) {
    console.error('Get testimonials error:', error)
    res.status(500).json({ error: 'Failed to fetch testimonials' })
  }
})

export default router
