import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { errorHandler } from './middleware/errorHandler'
import ticketRoutes from './routes/ticketRoutes'
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import reportsRoutes from './routes/reportsRoutes'
import { initSocket } from './lib/socket'
import { setupStorage } from './lib/setupStorage'
import attachmentRoutes from './routes/attachmentRoutes'
import settingsRoutes from './routes/settingsRoutes'

dotenv.config()

const app = express()
const PORT =  parseInt(<string>process.env.PORT, 10)|| 4000
const HOST = '0.0.0.0'

// Create HTTP server manually so Socket.IO can attach to it
// Previously Express managed this internally with app.listen()
const httpServer = createServer(app)

// Initialise Socket.IO on the HTTP server
initSocket(httpServer)

// Set up S3 storage bucket on startup
setupStorage().catch(console.error)

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
]





// ── Middleware ─────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
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
app.use('/api/tickets', attachmentRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/users', userRoutes) 
app.use('/api/reports', reportsRoutes)
app.use('/api/settings', settingsRoutes) 

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Error handler (must be last) ───────────────────────────
app.use(errorHandler)

// ── Start server ───────────────────────────────────────────
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
  console.log(`⚡ Socket.IO ready`)
  console.log(`📋 Environment: ${process.env.NODE_ENV}`)
})

export default app