import jwt from 'jsonwebtoken'
import db from '../db/config_pg.js'

const JWT_SECRET = process.env.JWT_SECRET || 'salon-marketplace-secret-change-in-production'

export function generateToken(payload) {
  const expiry = payload.type === 'salon_owner' ? '24h' : '7d'
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

function extractToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1]
}

// Authenticate customer (app users)
export async function authenticateCustomer(req, res, next) {
  try {
    const token = extractToken(req)
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' })

    const decoded = verifyToken(token)
    if (!decoded || decoded.type !== 'customer') {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    const [users] = await db.query(
      'SELECT id, name, phone, email, city FROM customers WHERE id = $1 AND is_active = TRUE',
      [decoded.id]
    )

    if (users.length === 0) return res.status(401).json({ error: 'Account not found or inactive.' })

    req.user = { ...users[0], type: 'customer' }
    next()
  } catch (error) {
    console.error('Customer auth error:', error)
    res.status(500).json({ error: 'Authentication error.' })
  }
}

// Authenticate salon owner/staff
export async function authenticateSalonOwner(req, res, next) {
  try {
    const token = extractToken(req)
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' })

    const decoded = verifyToken(token)
    if (!decoded || decoded.type !== 'salon_owner') {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    const [users] = await db.query(
      'SELECT so.id, so.salon_id, so.name, so.phone, so.role FROM salon_owners so WHERE so.id = $1 AND so.is_active = TRUE',
      [decoded.id]
    )

    if (users.length === 0) return res.status(401).json({ error: 'Account not found or inactive.' })

    req.user = { ...users[0], type: 'salon_owner' }
    next()
  } catch (error) {
    console.error('Salon owner auth error:', error)
    res.status(500).json({ error: 'Authentication error.' })
  }
}

// Optional auth - tries customer first, then salon owner
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req)
    if (!token) return next()

    const decoded = verifyToken(token)
    if (!decoded) return next()

    if (decoded.type === 'customer') {
      const [users] = await db.query(
        'SELECT id, name, phone, email, city FROM customers WHERE id = $1 AND is_active = TRUE',
        [decoded.id]
      )
      if (users.length > 0) req.user = { ...users[0], type: 'customer' }
    } else if (decoded.type === 'salon_owner') {
      const [users] = await db.query(
        'SELECT id, salon_id, name, email, role FROM salon_owners WHERE id = $1 AND is_active = TRUE',
        [decoded.id]
      )
      if (users.length > 0) req.user = { ...users[0], type: 'salon_owner' }
    }

    next()
  } catch {
    next()
  }
}

// Role-based authorization for salon owners
export function authorizeSalonRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || req.user.type !== 'salon_owner') {
      return res.status(403).json({ error: 'Access denied.' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' })
    }
    next()
  }
}

// Ensure salon owner can only access their own salon data
export function ensureOwnSalon(req, res, next) {
  if (!req.user || req.user.type !== 'salon_owner') {
    return res.status(403).json({ error: 'Access denied.' })
  }
  const salonId = parseInt(req.params.salonId || req.body.salon_id)
  if (salonId && salonId !== req.user.salon_id) {
    return res.status(403).json({ error: 'You can only manage your own salon.' })
  }
  req.salonId = req.user.salon_id
  next()
}
