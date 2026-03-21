import jwt from 'jsonwebtoken'
import pool from '../db/config.js'

const JWT_SECRET = process.env.JWT_SECRET || 'glamour-cuts-secret-key-change-in-production'

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Authentication middleware
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    // Verify user still exists and is active
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active FROM admin_users WHERE id = ?',
      [decoded.id]
    )

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ error: 'User account not found or inactive.' })
    }

    req.user = users[0]
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Authentication error.' })
  }
}

// Role-based authorization middleware
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' })
    }

    next()
  }
}

// Optional auth - doesn't fail if no token
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)

      if (decoded) {
        const [users] = await pool.query(
          'SELECT id, name, email, role, is_active FROM admin_users WHERE id = ?',
          [decoded.id]
        )

        if (users.length > 0 && users[0].is_active) {
          req.user = users[0]
        }
      }
    }

    next()
  } catch (error) {
    next()
  }
}

