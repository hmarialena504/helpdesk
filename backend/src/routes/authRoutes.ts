import { Router } from 'express'
import { register, login, getMe } from '../controllers/authController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public routes — no authentication needed
router.post('/register', register)
router.post('/login', login)

// Protected route — requires valid JWT
router.get('/me', authenticate, getMe)

export default router