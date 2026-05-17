import api from './api'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER'
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    createdTickets: number
    assignedTickets: number
    comments?: number
  }
}

export interface UserDetail extends User {
  assignedTickets: {
    id: string
    title: string
    status: string
    priority: string
    createdAt: string
  }[]
  createdTickets: {
    id: string
    title: string
    status: string
    priority: string
    createdAt: string
  }[]
}

export const getUsers = async (filters: {
  role?: string
  page?: number
  limit?: number
} = {}) => {
  const params = new URLSearchParams()
  if (filters.role) params.append('role', filters.role)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const res = await api.get(`/api/users?${params.toString()}`)
  return res.data as {
    data: User[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export const getUserById = async (id: string) => {
  const res = await api.get(`/api/users/${id}`)
  return res.data as { data: UserDetail }
}

export const updateUserRole = async (id: string, role: string) => {
  const res = await api.patch(`/api/users/${id}/role`, { role })
  return res.data as { data: User }
}

export const deactivateUser = async (id: string) => {
  const res = await api.patch(`/api/users/${id}/deactivate`)
  return res.data as { data: User }
}

export const reactivateUser = async (id: string) => {
  const res = await api.patch(`/api/users/${id}/reactivate`)
  return res.data as { data: User }
}