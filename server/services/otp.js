import redis from '../db/redis.js'

const OTP_EXPIRY = 300 // 5 minutes
const OTP_COOLDOWN = 30 // 30 seconds between resends
const MAX_ATTEMPTS = 5

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function normalizePhone(phone) {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')
  // Remove leading 91 country code if present (and phone is 12 digits)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2)
  }
  // Must be 10 digits
  if (cleaned.length !== 10) return null
  return cleaned
}

export async function sendOTP(phone) {
  const normalized = normalizePhone(phone)
  if (!normalized) throw new Error('Invalid phone number. Must be 10 digits.')

  // Check cooldown
  const cooldownKey = `otp:cooldown:${normalized}`
  const cooldown = await redis.get(cooldownKey)
  if (cooldown) throw new Error('Please wait 30 seconds before requesting another OTP')

  // Generate OTP
  const otp = generateOTP()

  // Store in Redis
  const otpKey = `otp:${normalized}`
  const attemptsKey = `otp:attempts:${normalized}`

  await redis.setex(otpKey, OTP_EXPIRY, otp)
  await redis.setex(cooldownKey, OTP_COOLDOWN, '1')
  await redis.del(attemptsKey) // Reset attempts on new OTP

  // ============================================
  // SMS DELIVERY
  // In production, replace this with your SMS provider
  // ============================================
  const isDev = !process.env.SMS_PROVIDER || process.env.NODE_ENV !== 'production'

  if (isDev) {
    // DEV MODE: Log to console
    console.log(`\n  ┌────────────────────────────────────┐`)
    console.log(`  │  OTP for ${normalized}: ${otp}         │`)
    console.log(`  └────────────────────────────────────┘\n`)
  } else {
    // PRODUCTION: Send via SMS provider
    await sendSMS(normalized, otp)
  }

  return {
    phone: normalized,
    message: isDev
      ? `OTP sent (dev mode: ${otp})`
      : 'OTP sent to your phone',
    // Only include OTP in dev mode for testing
    ...(isDev && { dev_otp: otp }),
    expires_in: OTP_EXPIRY,
  }
}

export async function verifyOTP(phone, otp) {
  const normalized = normalizePhone(phone)
  if (!normalized) throw new Error('Invalid phone number')

  const otpKey = `otp:${normalized}`
  const attemptsKey = `otp:attempts:${normalized}`

  // Check attempts
  const attempts = parseInt(await redis.get(attemptsKey) || '0')
  if (attempts >= MAX_ATTEMPTS) {
    await redis.del(otpKey) // Invalidate OTP after max attempts
    throw new Error('Too many failed attempts. Please request a new OTP.')
  }

  // Get stored OTP
  const storedOTP = await redis.get(otpKey)
  if (!storedOTP) throw new Error('OTP expired. Please request a new one.')

  if (storedOTP !== otp) {
    await redis.incr(attemptsKey)
    await redis.expire(attemptsKey, OTP_EXPIRY)
    throw new Error('Invalid OTP. Please try again.')
  }

  // OTP is valid - clean up
  await redis.del(otpKey, attemptsKey, `otp:cooldown:${normalized}`)

  return { phone: normalized, verified: true }
}

// ============================================
// SMS PROVIDERS - Plug in your preferred one
// ============================================

async function sendSMS(phone, otp) {
  const provider = process.env.SMS_PROVIDER

  if (provider === 'msg91') {
    return sendViaMSG91(phone, otp)
  } else if (provider === 'twilio') {
    return sendViaTwilio(phone, otp)
  } else if (provider === 'textlocal') {
    return sendViaTextlocal(phone, otp)
  }

  console.warn('No SMS provider configured, OTP not sent:', otp)
}

async function sendViaMSG91(phone, otp) {
  // MSG91 - Popular in India, cheap
  // Set env: SMS_PROVIDER=msg91, MSG91_AUTH_KEY=xxx, MSG91_TEMPLATE_ID=xxx
  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': process.env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: `91${phone}`,
      otp,
    }),
  })
  if (!res.ok) throw new Error('Failed to send SMS via MSG91')
}

async function sendViaTwilio(phone, otp) {
  // Twilio
  // Set env: SMS_PROVIDER=twilio, TWILIO_SID=xxx, TWILIO_AUTH=xxx, TWILIO_FROM=xxx
  const auth = Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_AUTH}`).toString('base64')
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: `+91${phone}`,
      From: process.env.TWILIO_FROM,
      Body: `Your Stylo verification code is: ${otp}. Valid for 5 minutes.`,
    }),
  })
  if (!res.ok) throw new Error('Failed to send SMS via Twilio')
}

async function sendViaTextlocal(phone, otp) {
  // Textlocal - India-specific, cheap
  // Set env: SMS_PROVIDER=textlocal, TEXTLOCAL_API_KEY=xxx, TEXTLOCAL_SENDER=xxx
  const res = await fetch('https://api.textlocal.in/send/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      apikey: process.env.TEXTLOCAL_API_KEY,
      numbers: `91${phone}`,
      sender: process.env.TEXTLOCAL_SENDER || 'SALNR',
      message: `Your Stylo verification code is: ${otp}. Valid for 5 minutes.`,
    }),
  })
  if (!res.ok) throw new Error('Failed to send SMS via Textlocal')
}

export { normalizePhone }
