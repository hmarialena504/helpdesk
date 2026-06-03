import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  getProfile,
  updateProfile,
  updatePassword,
  getNotificationSettings,
} from '../controllers/settingsController'

const router = Router()

// All settings routes require authentication
// No role restriction — every user can manage their own settings
router.use(authenticate)

router.get('/profile', getProfile)
router.patch('/profile', updateProfile)
router.patch('/password', updatePassword)
router.get('/notifications', getNotificationSettings)

export default router