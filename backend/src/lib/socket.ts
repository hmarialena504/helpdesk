import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { verifyToken } from './jwt'

// Store the io instance so controllers can emit events
let io: SocketIOServer

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Authenticate every socket connection using the JWT token
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('No token provided'))
      }

      const payload = verifyToken(token)
      // Attach user info to the socket for use in event handlers
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user
    console.log(`🔌 Socket connected: ${user.email}`)

    // Client joins a specific ticket room to receive updates for that ticket
    socket.on('join-ticket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`)
      console.log(`${user.email} joined room ticket:${ticketId}`)

      // Tell everyone in the room how many people are viewing
      const room = io.sockets.adapter.rooms.get(`ticket:${ticketId}`)
      const viewerCount = room ? room.size : 0
      io.to(`ticket:${ticketId}`).emit('viewer-count', { ticketId, count: viewerCount })
    })

    // Client leaves a ticket room when navigating away
    socket.on('leave-ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`)
      console.log(`${user.email} left room ticket:${ticketId}`)

      const room = io.sockets.adapter.rooms.get(`ticket:${ticketId}`)
      const viewerCount = room ? room.size : 0
      io.to(`ticket:${ticketId}`).emit('viewer-count', { ticketId, count: viewerCount })
    })

    // Client joins the global tickets room to receive new ticket notifications
    socket.on('join-tickets-list', () => {
      socket.join('tickets-list')
      console.log(`${user.email} joined tickets-list room`)
    })

    socket.on('leave-tickets-list', () => {
      socket.leave('tickets-list')
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${user.email}`)
    })
  })

  return io
}

// Export getter so controllers can emit events
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialised')
  }
  return io
}