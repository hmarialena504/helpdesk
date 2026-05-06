import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth'
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
} from '../controllers/ticketController'

const router = Router()

// All ticket routes require authentication
router.use(authenticate)

router.get('/', getTickets)
router.get('/:id', getTicketById)
router.post('/', createTicket)
router.patch('/:id', updateTicket)
router.delete('/:id', requireRole('ADMIN'), deleteTicket)
router.post('/:id/comments', addComment)

export default router