import pool from '../db/config.js'

// WhatsApp notification service
// This uses the WhatsApp Click-to-Chat API for basic notifications
// For automated messages, integrate with WhatsApp Business API or Twilio

const SALON_WHATSAPP = process.env.SALON_WHATSAPP_NUMBER || '919876543210'

// Format phone number for WhatsApp
function formatPhoneNumber(phone) {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Add India country code if not present
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  }
  
  return cleaned
}

// Generate WhatsApp message link
export function generateWhatsAppLink(phone, message) {
  const formattedPhone = formatPhoneNumber(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

// Create booking confirmation message for customer
export function createCustomerBookingMessage(booking, salonSettings) {
  const services = booking.services?.map(s => s.service_name).join(', ') || 'Selected services'
  
  return `🎉 *Booking Confirmed!*

Hello ${booking.customer_name}! 👋

Your appointment at *${salonSettings?.salon_name || 'Glamour Cuts'}* has been booked successfully!

📅 *Date:* ${formatDate(booking.booking_date)}
⏰ *Time:* ${formatTime(booking.start_time)}
💇 *Services:* ${services}
${booking.stylist_name ? `👨‍🦱 *Stylist:* ${booking.stylist_name}` : ''}
💰 *Total:* ₹${booking.final_price}

📍 *Address:* ${salonSettings?.address || 'Keshav Nagar, Pune'}

🔖 *Booking Code:* ${booking.booking_code}

Please arrive 5-10 minutes before your appointment.

For any changes, call us at ${salonSettings?.phone || 'our salon'}.

Thank you for choosing us! ✨`
}

// Create booking notification for salon owner
export function createOwnerBookingMessage(booking, salonSettings) {
  const services = booking.services?.map(s => s.service_name).join(', ') || 'Selected services'
  
  return `🔔 *New Booking Alert!*

📋 *Booking Details:*
━━━━━━━━━━━━━━━━━
🔖 Code: ${booking.booking_code}
👤 Customer: ${booking.customer_name}
📱 Phone: ${booking.customer_phone}
📅 Date: ${formatDate(booking.booking_date)}
⏰ Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}
💇 Services: ${services}
${booking.stylist_name ? `👨‍🦱 Stylist: ${booking.stylist_name}` : ''}
💰 Amount: ₹${booking.final_price}
${booking.notes ? `📝 Notes: ${booking.notes}` : ''}
━━━━━━━━━━━━━━━━━

Please confirm this booking.`
}

// Create booking completion message for customer
export function createCompletionMessage(booking, salonSettings) {
  return `✨ *Thank You for Visiting!*

Dear ${booking.customer_name},

We hope you enjoyed your experience at *${salonSettings?.salon_name || 'Glamour Cuts'}*!

Your booking #${booking.booking_code} has been marked as completed.

💰 *Amount Paid:* ₹${booking.final_price}

We'd love to hear your feedback! Please rate us on Google.

See you again soon! 💇‍♂️

- Team ${salonSettings?.salon_name || 'Glamour Cuts'}`
}

// Create cancellation message
export function createCancellationMessage(booking, salonSettings, reason = '') {
  return `❌ *Booking Cancelled*

Dear ${booking.customer_name},

Your booking #${booking.booking_code} for ${formatDate(booking.booking_date)} at ${formatTime(booking.start_time)} has been cancelled.

${reason ? `Reason: ${reason}` : ''}

To reschedule, please visit our website or call us at ${salonSettings?.phone || 'our salon'}.

- Team ${salonSettings?.salon_name || 'Glamour Cuts'}`
}

// Log notification in database
export async function logNotification(bookingId, recipientPhone, recipientType, notificationType, message, status = 'pending') {
  try {
    await pool.query(
      `INSERT INTO notification_log 
       (booking_id, recipient_phone, recipient_type, notification_type, message, status, sent_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, recipientPhone, recipientType, notificationType, message, status, status === 'sent' ? new Date() : null]
    )
  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}

// Get salon settings for notifications
export async function getSalonSettings() {
  try {
    const [settings] = await pool.query('SELECT * FROM salon_settings WHERE id = 1')
    return settings[0] || null
  } catch (error) {
    console.error('Failed to get salon settings:', error)
    return null
  }
}

// Send notification (generates links for manual sending or integrates with API)
export async function sendBookingNotification(booking, type = 'booking_created') {
  const salonSettings = await getSalonSettings()
  
  let customerMessage, ownerMessage
  
  switch (type) {
    case 'booking_created':
    case 'booking_confirmed':
      customerMessage = createCustomerBookingMessage(booking, salonSettings)
      ownerMessage = createOwnerBookingMessage(booking, salonSettings)
      break
    case 'booking_completed':
      customerMessage = createCompletionMessage(booking, salonSettings)
      break
    case 'booking_cancelled':
      customerMessage = createCancellationMessage(booking, salonSettings, booking.cancellation_reason)
      break
    default:
      return null
  }

  const notifications = {
    customer: customerMessage ? {
      phone: booking.customer_phone,
      message: customerMessage,
      whatsappLink: generateWhatsAppLink(booking.customer_phone, customerMessage)
    } : null,
    owner: ownerMessage ? {
      phone: salonSettings?.whatsapp || SALON_WHATSAPP,
      message: ownerMessage,
      whatsappLink: generateWhatsAppLink(salonSettings?.whatsapp || SALON_WHATSAPP, ownerMessage)
    } : null
  }

  // Log notifications
  if (notifications.customer) {
    await logNotification(
      booking.id,
      booking.customer_phone,
      'customer',
      type,
      customerMessage,
      'pending'
    )
  }

  if (notifications.owner) {
    await logNotification(
      booking.id,
      salonSettings?.whatsapp || SALON_WHATSAPP,
      'owner',
      type,
      ownerMessage,
      'pending'
    )
  }

  return notifications
}

// Helper functions
function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default {
  generateWhatsAppLink,
  sendBookingNotification,
  getSalonSettings,
  formatPhoneNumber
}

