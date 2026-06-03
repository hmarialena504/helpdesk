import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

// GET /api/settings/profile
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
            comments: true,
          },
        },
      },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/settings/profile
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email } = req.body

    if (!name && !email) {
      throw new AppError('At least one field is required', 400)
    }

    if (name && name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters', 400)
    }

    if (email) {
      // Check email isn't already taken by another user
      const existing = await prisma.user.findUnique({
        where: { email },
      })
      if (existing && existing.id !== req.user!.id) {
        throw new AppError('Email already in use', 409)
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    })

    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/settings/password
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400)
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400)
    }

    if (!/[A-Z]/.test(newPassword)) {
      throw new AppError('Password must contain at least one capital letter', 400)
    }

    if (!/[0-9]/.test(newPassword)) {
      throw new AppError('Password must contain at least one number', 400)
    }

    if (!/[!@#$%^&*]/.test(newPassword)) {
      throw new AppError('Password must contain at least one special character', 400)
    }

    // Fetch current password hash from database
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { password: true },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Verify current password is correct
    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      throw new AppError('Current password is incorrect', 400)
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    })

    res.json({ data: { message: 'Password updated successfully' } })
  } catch (err) {
    next(err)
  }
}

// GET /api/settings/notifications
export const getNotificationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // For now return default settings
    // In a production app these would be stored per user in the database
    res.json({
      data: {
        emailOnTicketCreated: true,
        emailOnTicketAssigned: true,
        emailOnTicketResolved: true,
        emailOnNewComment: true,
      },
    })
  } catch (err) {
    next(err)
  }
}