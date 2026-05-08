import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'
import { verifyToken } from '../lib/jwt'
import prisma from '../lib/prisma'

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }

    const token = authHeader.split(' ')[1]

    // Verify the JWT — throws if invalid or expired
    const payload = verifyToken(token)

    // Fetch fresh user data from database
    // This ensures the token is still valid even if the user was deleted
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
      throw new AppError('User no longer exists', 401)
    }

    req.user = user
    next()

  } catch (err) {
    // Handle JWT-specific errors with clear messages
    if (err instanceof Error) {
      if (err.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token', 401))
      }
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Token expired', 401))
      }
    }
    next(err)
  }
}

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