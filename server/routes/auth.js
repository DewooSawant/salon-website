import express from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import pool from '../db/config.js'
import { generateToken, authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

// Validation middleware
const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['owner', 'admin', 'staff']).withMessage('Invalid role')
]

// Login
router.post('/login', validateLogin, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email, password } = req.body

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM admin_users WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = users[0]

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled. Contact administrator.' })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Update last login
    await pool.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [user.id]
    )

    // Generate token
    const token = generateToken(user)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user })
})

// Register new admin (only owner can do this)
router.post('/register', authenticate, authorize('owner'), validateRegister, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { name, email, password, phone, role } = req.body

    // Check if email exists
    const [existing] = await pool.query(
      'SELECT id FROM admin_users WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [result] = await pool.query(
      `INSERT INTO admin_users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, role || 'staff']
    )

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: result.insertId,
        name,
        email,
        role: role || 'staff'
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Update password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    // Get user with password
    const [users] = await pool.query(
      'SELECT password FROM admin_users WHERE id = ?',
      [req.user.id]
    )

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users[0].password)
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await pool.query(
      'UPDATE admin_users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    )

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Password update error:', error)
    res.status(500).json({ error: 'Failed to update password' })
  }
})

// Get all admin users (owner only)
router.get('/users', authenticate, authorize('owner'), async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, phone, role, is_active, last_login, created_at FROM admin_users ORDER BY created_at DESC'
    )
    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Update admin user (owner only)
router.put('/users/:id', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, role, is_active } = req.body

    await pool.query(
      `UPDATE admin_users SET name = ?, email = ?, phone = ?, role = ?, is_active = ? WHERE id = ?`,
      [name, email, phone, role, is_active, id]
    )

    res.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete admin user (owner only)
router.delete('/users/:id', authenticate, authorize('owner'), async (req, res) => {
  try {
    const { id } = req.params

    // Can't delete yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await pool.query('DELETE FROM admin_users WHERE id = ?', [id])
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router

