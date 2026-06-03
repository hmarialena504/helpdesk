import { User } from '@prisma/client'

// Extend Express's Request type to include the authenticated user
// This lets you access req.user in any route handler with full type safety
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>
      file?: Multer.File
      files?: { [fieldname: string]: Multer.File[] } | Multer.File[]
    }

    namespace Multer {
      interface File {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        size: number
        buffer: Buffer
        destination?: string
        filename?: string
        path?: string
      }
    }
  }
}