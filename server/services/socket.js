import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'salon-marketplace-secret-change-in-production'

let io = null

export function initSocket(httpServer, corsOptions) {
  io = new Server(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
  })

  // Authenticate salon owners on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No token'))
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      if (decoded.type !== 'salon_owner') return next(new Error('Not a salon owner'))
      socket.salonId = decoded.salon_id
      socket.userId = decoded.id
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    // Join salon-specific room
    const room = `salon:${socket.salonId}`
    socket.join(room)
    console.log(`  Socket:   Salon owner ${socket.userId} connected (salon ${socket.salonId})`)

    socket.on('disconnect', () => {
      console.log(`  Socket:   Salon owner ${socket.userId} disconnected`)
    })
  })

  console.log('  Socket:   WebSocket server ready')
  return io
}

// Emit notification to a specific salon's owners
export function notifySalon(salonId, event, data) {
  if (!io) return
  io.to(`salon:${salonId}`).emit(event, data)
}

export function getIO() {
  return io
}
