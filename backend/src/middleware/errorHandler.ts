import { Request, Response, NextFunction } from 'express'
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library'

// A custom error class so we can attach HTTP status codes to errors
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(`[Error] ${err.message}`)

  // Handle our own AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    })
  }

  // Handle Prisma known errors (constraint violations etc)
  if (err instanceof PrismaClientKnownRequestError) {
    // Unique constraint violation — e.g. duplicate email
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'A record with that value already exists',
      })
    }
    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
      })
    }
  }

  // Handle Prisma validation errors
  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Invalid data provided',
    })
  }

  // Fallback for anything unexpected
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  })
}