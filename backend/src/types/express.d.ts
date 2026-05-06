import { User } from '@prisma/client'

// Extend Express's Request type to include the authenticated user
// This lets you access req.user in any route handler with full type safety
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>
    }
  }
}