import { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma'

// GET /api/reports/overview
// Returns key metrics — total tickets, open rate, avg resolution time
export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      resolvedWithTime,
    ] = await Promise.all([
      // Total tickets ever
      prisma.ticket.count(),

      // Currently open tickets
      prisma.ticket.count({
        where: { status: 'OPEN' },
      }),

      // Tickets resolved in last 30 days
      prisma.ticket.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: thirtyDaysAgo },
        },
      }),

      // Tickets with both createdAt and resolvedAt for avg calculation
      prisma.ticket.findMany({
        where: {
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
        take: 500, // Cap at 500 to avoid heavy computation
      }),
    ])

    // Calculate average resolution time in hours
    let avgResolutionHours = 0
    if (resolvedWithTime.length > 0) {
      const totalHours = resolvedWithTime.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt).getTime()
        const resolved = new Date(ticket.resolvedAt!).getTime()
        const hours = (resolved - created) / (1000 * 60 * 60)
        return sum + hours
      }, 0)
      avgResolutionHours = Math.round(totalHours / resolvedWithTime.length)
    }

    const openRate = totalTickets > 0
      ? Math.round((openTickets / totalTickets) * 100)
      : 0

    res.json({
      data: {
        totalTickets,
        openTickets,
        resolvedLast30Days: resolvedTickets,
        avgResolutionHours,
        openRate,
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/reports/by-status
// Returns ticket counts grouped by status
export const getByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const results = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
    })

    const data = results.map((r) => ({
      status: r.status,
      count: r._count.status,
    }))

    res.json({ data })
  } catch (err) {
    next(err)
  }
}

// GET /api/reports/by-priority
// Returns ticket counts grouped by priority
export const getByPriority = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const results = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { priority: true },
    })

    // Define priority order for consistent display
    const priorityOrder = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const data = priorityOrder.map((priority) => {
      const found = results.find((r) => r.priority === priority)
      return {
        priority,
        count: found ? found._count.priority : 0,
      }
    })

    res.json({ data })
  } catch (err) {
    next(err)
  }
}

// GET /api/reports/volume
// Returns daily ticket creation counts for the last 30 days
export const getVolume = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch all tickets created in the last 30 days
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Build a map of date string → count
    const countByDate = new Map<string, number>()

    // Initialise all 30 days with zero so days with no tickets still appear
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = date.toISOString().split('T')[0] // 'YYYY-MM-DD'
      countByDate.set(key, 0)
    }

    // Count tickets per day
    tickets.forEach((ticket) => {
      const key = new Date(ticket.createdAt).toISOString().split('T')[0]
      countByDate.set(key, (countByDate.get(key) || 0) + 1)
    })

    // Convert map to array for the chart
    const data = Array.from(countByDate.entries()).map(([date, count]) => ({
      date,
      // Format as 'DD MMM' for display — e.g. '01 May'
      label: new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      }),
      count,
    }))

    res.json({ data })
  } catch (err) {
    next(err)
  }
}

// GET /api/reports/by-agent
// Returns ticket counts per agent (admins and agents only)
export const getByAgent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const results = await prisma.ticket.groupBy({
      by: ['assignedToId'],
      _count: { assignedToId: true },
      where: {
        assignedToId: { not: null },
      },
      orderBy: { _count: { assignedToId: 'desc' } },
      take: 10,
    })

    // Fetch agent names for the IDs
    const agentIds = results
      .map((r) => r.assignedToId)
      .filter(Boolean) as string[]

    const agents = await prisma.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true },
    })

    const agentMap = new Map(agents.map((a) => [a.id, a.name]))

    const data = results.map((r) => ({
      agentId: r.assignedToId,
      agentName: agentMap.get(r.assignedToId!) || 'Unknown',
      count: r._count.assignedToId,
    }))

    res.json({ data })
  } catch (err) {
    next(err)
  }
}