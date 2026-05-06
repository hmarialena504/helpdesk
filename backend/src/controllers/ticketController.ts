import { Request, Response, NextFunction } from 'express'
import { TicketStatus, TicketPriority } from '@prisma/client'
import prisma from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'

// GET /api/tickets
export const getTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, priority, assignedToId, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build filter dynamically based on query params
    const where: Record<string, unknown> = {}
    if (status) where.status = status as TicketStatus
    if (priority) where.priority = priority as TicketPriority
    if (assignedToId) where.assignedToId = assignedToId as string

    // Customers can only see their own tickets
    if (req.user?.role === 'CUSTOMER') {
      where.createdById = req.user.id
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ])

    res.json({
      data: tickets,
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

// GET /api/tickets/:id
export const getTicketById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
        comments: {
          where: req.user?.role === 'CUSTOMER'
            ? { isInternal: false }   // Customers can't see internal notes
            : {},                      // Agents and admins see everything
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    })

    if (!ticket) {
      throw new AppError('Ticket not found', 404)
    }

    // Customers can only view their own tickets
    if (req.user?.role === 'CUSTOMER' && ticket.createdById !== req.user.id) {
      throw new AppError('Ticket not found', 404) // 404 not 403 — don't reveal it exists
    }

    res.json({ data: ticket })
  } catch (err) {
    next(err)
  }
}

// POST /api/tickets
export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { title, description, priority } = req.body

    if (!title || !description) {
      throw new AppError('Title and description are required', 400)
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || TicketPriority.MEDIUM,
        createdById: req.user!.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    res.status(201).json({ data: ticket })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/tickets/:id
export const updateTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params
    const { title, description, status, priority, assignedToId, teamId } = req.body

    // Customers can only update title and description on their own tickets
    if (req.user?.role === 'CUSTOMER') {
      const existing = await prisma.ticket.findUnique({ where: { id } })
      if (!existing || existing.createdById !== req.user.id) {
        throw new AppError('Ticket not found', 404)
      }
      if (status || assignedToId || teamId) {
        throw new AppError('Insufficient permissions', 403)
      }
    }

    // Set resolvedAt timestamp when a ticket is resolved
    const resolvedAt = status === TicketStatus.RESOLVED ? new Date() : undefined

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status: status as TicketStatus }),
        ...(priority && { priority: priority as TicketPriority }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(teamId !== undefined && { teamId }),
        ...(resolvedAt && { resolvedAt }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    })

    res.json({ data: ticket })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/tickets/:id
export const deleteTicket = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params

    await prisma.ticket.delete({ where: { id } })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// POST /api/tickets/:id/comments
export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params
    const { body, isInternal } = req.body

    if (!body) {
      throw new AppError('Comment body is required', 400)
    }

    // Only agents and admins can post internal comments
    if (isInternal && req.user?.role === 'CUSTOMER') {
      throw new AppError('Insufficient permissions', 403)
    }

    const comment = await prisma.comment.create({
      data: {
        body,
        isInternal: isInternal || false,
        ticketId: id,
        authorId: req.user!.id,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    res.status(201).json({ data: comment })
  } catch (err) {
    next(err)
  }
}