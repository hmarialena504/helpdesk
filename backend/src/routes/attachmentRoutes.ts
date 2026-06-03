import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth'
import {
  uploadAttachment,
  deleteAttachment,
  getAttachments,
} from '../controllers/attachmentController'

const router = Router()

// multer with memoryStorage keeps the file in memory as a Buffer
// rather than writing it to disk — simpler for container environments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit at the multer level
    files: 1,                    // One file per request
  },
})

router.use(authenticate)

router.get('/:id/attachments', getAttachments)
router.post('/:id/attachments', upload.single('file'), uploadAttachment)
router.delete('/:id/attachments/:attachmentId', deleteAttachment)

export default router