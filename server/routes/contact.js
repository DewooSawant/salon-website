import express from 'express'
import { body, validationResult } from 'express-validator'
import pool from '../db/config.js'

const router = express.Router()

// Validation middleware
const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
]

// Create a new contact message (public)
router.post('/', validateContact, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { name, phone, email, subject, message } = req.body

    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, phone, email, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email || null, subject || null, message]
    )

    res.status(201).json({
      message: 'Message sent successfully! We will get back to you soon.',
      id: result.insertId
    })
  } catch (error) {
    console.error('Contact message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router
