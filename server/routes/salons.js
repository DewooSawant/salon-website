import { Router } from 'express'
import db from '../db/config_pg.js'
import { cached, invalidate } from '../db/redis.js'

const router = Router()

// GET /api/salons/nearby - Haversine distance search with Redis cache
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type, sort = 'distance', page = 1, limit = 20, search } = req.query

    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' })

    const gridLat = Math.round(parseFloat(lat) * 100) / 100
    const gridLng = Math.round(parseFloat(lng) * 100) / 100
    const cacheKey = `salons:nearby:${gridLat}:${gridLng}:${radius}:${type || ''}:${sort}:${page}:${search || ''}`

    const data = await cached(cacheKey, 60, async () => {
      const offset = (parseInt(page) - 1) * parseInt(limit)
      const params = [parseFloat(lat), parseFloat(lng), parseInt(radius)]
      let paramIdx = 4
      let filters = ''

      if (type && ['men', 'women', 'unisex'].includes(type)) {
        filters += ` AND s.type = $${paramIdx++}`
        params.push(type)
      }
      if (search) {
        filters += ` AND (s.name ILIKE $${paramIdx} OR s.address ILIKE $${paramIdx} OR s.city ILIKE $${paramIdx})`
        params.push(`%${search}%`)
        paramIdx++
      }

      const orderMap = {
        rating: 's.avg_rating DESC, distance ASC',
        price: 'starting_price ASC NULLS LAST, distance ASC',
        popular: 's.total_bookings DESC, distance ASC',
        distance: 'distance ASC'
      }

      params.push(parseInt(limit), offset)

      const [salons] = await db.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.address, s.city, s.type,
               s.phone, s.whatsapp, s.opening_time, s.closing_time,
               s.avg_rating, s.total_ratings, s.total_bookings,
               s.logo_url, s.cover_image_url, s.amenities, s.is_verified, s.is_featured,
               s.latitude, s.longitude,
               ROUND(haversine_distance($1, $2, s.latitude, s.longitude)::numeric) as distance,
               COUNT(DISTINCT sv.id) AS service_count,
               MIN(sv.price) AS starting_price
        FROM salons s
        LEFT JOIN services sv ON sv.salon_id = s.id AND sv.is_active = TRUE
        WHERE s.is_active = TRUE
          AND haversine_distance($1, $2, s.latitude, s.longitude) <= $3
          ${filters}
        GROUP BY s.id
        ORDER BY ${orderMap[sort] || orderMap.distance}
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, params)

      const [countResult] = await db.query(`
        SELECT COUNT(*) as total FROM salons
        WHERE is_active = TRUE AND haversine_distance($1, $2, latitude, longitude) <= $3
      `, [parseFloat(lat), parseFloat(lng), parseInt(radius)])

      return {
        salons: salons.map(s => ({
          ...s,
          distance_km: Math.round(s.distance / 100) / 10,
          starting_price: s.starting_price ? Math.round(s.starting_price) : null,
        })),
        pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countResult[0]?.total || 0) }
      }
    })

    res.json(data)
  } catch (error) {
    console.error('Nearby salons error:', error)
    res.status(500).json({ error: 'Failed to fetch salons' })
  }
})

// GET /api/salons/:slug - Full profile
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const cacheKey = `salon:profile:${slug}`

    const data = await cached(cacheKey, 120, async () => {
      const [salons] = await db.query(
        'SELECT * FROM salons WHERE slug = $1 AND is_active = TRUE', [slug])

      if (salons.length === 0) return null

      const salon = salons[0]
      const salonId = salon.id

      const [servicesResult, stylistsResult, reviewsResult, galleryResult] = await Promise.all([
        db.query(`
          SELECT s.*, sc.name as category_name, sc.icon as category_icon, sc.display_order as cat_order
          FROM services s
          LEFT JOIN service_categories sc ON sc.id = s.category_id
          WHERE s.salon_id = $1 AND s.is_active = TRUE
          ORDER BY sc.display_order, s.display_order`, [salonId]),
        db.query(`
          SELECT * FROM stylists WHERE salon_id = $1 AND is_active = TRUE ORDER BY display_order`, [salonId]),
        db.query(`
          SELECT r.*, c.name as customer_name, c.avatar_url as customer_avatar
          FROM reviews r JOIN customers c ON c.id = r.customer_id
          WHERE r.salon_id = $1 AND r.is_approved = TRUE
          ORDER BY r.created_at DESC LIMIT 20`, [salonId]),
        db.query(`
          SELECT * FROM gallery WHERE salon_id = $1 AND is_active = TRUE ORDER BY display_order LIMIT 20`, [salonId])
      ])

      const servicesByCategory = {}
      for (const s of servicesResult[0]) {
        const cat = s.category_name || 'Other'
        if (!servicesByCategory[cat]) servicesByCategory[cat] = { name: cat, icon: s.category_icon, order: s.cat_order || 99, services: [] }
        servicesByCategory[cat].services.push(s)
      }

      return {
        salon,
        services: Object.values(servicesByCategory).sort((a, b) => a.order - b.order),
        stylists: stylistsResult[0],
        reviews: reviewsResult[0],
        gallery: galleryResult[0]
      }
    })

    if (!data) return res.status(404).json({ error: 'Salon not found' })
    res.json(data)
  } catch (error) {
    console.error('Salon profile error:', error)
    res.status(500).json({ error: 'Failed to fetch salon' })
  }
})

// GET /api/salons/:slug/available-slots/:date
router.get('/:slug/available-slots/:date', async (req, res) => {
  try {
    const { slug, date } = req.params
    const { stylist_id, duration = 30 } = req.query

    const [salons] = await db.query(
      'SELECT id, name, opening_time, closing_time, slot_duration, lunch_start, lunch_end, working_days FROM salons WHERE slug = $1 AND is_active = TRUE', [slug])
    if (salons.length === 0) return res.status(404).json({ error: 'Salon not found' })

    const salon = salons[0]
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
    const workingDays = salon.working_days || []

    if (!workingDays.includes(dayOfWeek)) return res.json({ slots: [], message: 'Salon is closed on this day' })

    const bookingParams = [salon.id, date]
    let bookingQuery = `SELECT start_time, end_time FROM bookings WHERE salon_id = $1 AND booking_date = $2 AND status NOT IN ('cancelled','no_show')`
    if (stylist_id) { bookingQuery += ' AND stylist_id = $3'; bookingParams.push(stylist_id) }

    const [bookings] = await db.query(bookingQuery, bookingParams)

    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const slotDuration = parseInt(duration) || salon.slot_duration

    const slots = []
    let current = toMin(salon.opening_time)
    const closing = toMin(salon.closing_time)
    const lunchStart = toMin(salon.lunch_start)
    const lunchEnd = toMin(salon.lunch_end)

    while (current + slotDuration <= closing) {
      if (current >= lunchStart && current < lunchEnd) { current = lunchEnd; continue }
      const timeStr = toTime(current) + ':00'
      const endStr = toTime(current + slotDuration) + ':00'
      const isBooked = bookings.some(b => timeStr < b.end_time && endStr > b.start_time)
      slots.push({ time: toTime(current), end_time: toTime(current + slotDuration), available: !isBooked })
      current += slotDuration
    }

    res.json({ slots, salon_name: salon.name, date })
  } catch (error) {
    console.error('Slots error:', error)
    res.status(500).json({ error: 'Failed to fetch slots' })
  }
})

export default router
