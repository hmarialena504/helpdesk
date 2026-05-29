import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import {
  getOverview,
  getByStatus,
  getByPriority,
  getVolume,
  getByAgent,
} from '../controllers/reportsController'

const router = Router()

// Reports are only available to admins and agents
router.use(authenticate)
router.use(requireRole('ADMIN', 'AGENT'))

router.get('/overview', getOverview)
router.get('/by-status', getByStatus)
router.get('/by-priority', getByPriority)
router.get('/volume', getVolume)
router.get('/by-agent', getByAgent)

export default router