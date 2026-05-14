import api from './api'

export interface Ticket {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  createdById: string
  assignedToId: string | null
  teamId: string | null
  createdBy: { id: string; name: string; email: string }
  assignedTo: { id: string; name: string; email: string } | null
  team: { id: string; name: string } | null
  tags: { tag: { id: string; name: string; color: string } }[]
  _count?: { comments: number }
}

export interface Comment {
  id: string
  body: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
  ticketId: string
  authorId: string
  author: { id: string; name: string; role: string }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface TicketFilters {
  status?: string
  priority?: string
  page?: number
  limit?: number
}

// Get paginated list of tickets with optional filters
export const getTickets = async (
  filters: TicketFilters = {}
): Promise<PaginatedResponse<Ticket>> => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const res = await api.get(`/api/tickets?${params.toString()}`)
  return res.data
}

// Get a single ticket by ID
export const getTicketById = async (id: string): Promise<{ data: Ticket }> => {
  const res = await api.get(`/api/tickets/${id}`)
  return res.data
}

// Create a new ticket
export const createTicket = async (data: {
  title: string
  description: string
  priority: string
}): Promise<{ data: Ticket }> => {
  const res = await api.post('/api/tickets', data)
  return res.data
}

// Update a ticket
export const updateTicket = async (
  id: string,
  data: Partial<{
    title: string
    description: string
    status: string
    priority: string
    assignedToId: string | null
    teamId: string | null
  }>
): Promise<{ data: Ticket }> => {
  const res = await api.patch(`/api/tickets/${id}`, data)
  return res.data
}

// Add a comment to a ticket
export const addComment = async (
  ticketId: string,
  data: { body: string; isInternal: boolean }
): Promise<{ data: Comment }> => {
  const res = await api.post(`/api/tickets/${ticketId}/comments`, data)
  return res.data
}

// Get dashboard stats
export const getTicketStats = async () => {
  const [open, inProgress, resolved] = await Promise.all([
    api.get('/api/tickets?status=OPEN&limit=1'),
    api.get('/api/tickets?status=IN_PROGRESS&limit=1'),
    api.get('/api/tickets?status=RESOLVED&limit=1'),
  ])
  return {
    open: open.data.pagination.total,
    inProgress: inProgress.data.pagination.total,
    resolved: resolved.data.pagination.total,
  }
}