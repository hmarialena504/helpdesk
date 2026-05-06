import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'
import prisma from '../lib/prisma'

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header
    // Header format: "Bearer eyJhbGc..."
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }

    const token = authHeader.split(' ')[1]

    // For now we use a simple approach — the token IS the user ID
    // In the next step we will replace this with proper JWT verification
    const user = await prisma.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new AppError('Invalid token', 401)
    }

    // Attach user to request so route handlers can access it
    req.user = user
    next()

  } catch (err) {
    next(err)
  }
}

// Middleware factory that checks if the user has one of the allowed roles
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401))
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403))
    }
    next()
  }
}