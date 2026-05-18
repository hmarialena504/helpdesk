import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import ticketRoutes from './routes/ticketRoutes'
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import { initSocket } from './lib/socket'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Create HTTP server manually so Socket.IO can attach to it
// Previously Express managed this internally with app.listen()
const httpServer = createServer(app)

// Initialise Socket.IO on the HTTP server
initSocket(httpServer)

// ── Middleware ─────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/users', userRoutes) 

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Error handler (must be last) ───────────────────────────
app.use(errorHandler)

// ── Start server ───────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`⚡ Socket.IO ready`)
  console.log(`📋 Environment: ${process.env.NODE_ENV}`)
})

export default app