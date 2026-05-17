import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import {
  getUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  reactivateUser,
} from '../controllers/userController'

const router = Router()

// All user routes require authentication and admin role
router.use(authenticate)
router.use(requireRole('ADMIN'))

router.get('/', getUsers)
router.get('/:id', getUserById)
router.patch('/:id/role', updateUserRole)
router.patch('/:id/deactivate', deactivateUser)
router.patch('/:id/reactivate', reactivateUser)

export default router