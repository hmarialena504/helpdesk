import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

// GET /api/users
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { role, isActive, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
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
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/users/:id
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        assignedTickets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
        createdTickets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
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

// PATCH /api/users/:id/role
export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!role || !['ADMIN', 'AGENT', 'CUSTOMER'].includes(role)) {
      throw new AppError('Invalid role', 400)
    }

    // Prevent admins from demoting themselves
    if (req.user?.id === id) {
      throw new AppError('You cannot change your own role', 400)
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
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

// PATCH /api/users/:id/deactivate
export const deactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params

    // Prevent admins from deactivating themselves
    if (req.user?.id === id) {
      throw new AppError('You cannot deactivate your own account', 400)
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/users/:id/reactivate
export const reactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    res.json({ data: user })
  } catch (err) {
    next(err)
  }
}