import api from './api'

export interface ProfileData {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  updatedAt: string
  _count: {
    createdTickets: number
    assignedTickets: number
    comments: number
  }
}

export interface NotificationSettings {
  emailOnTicketCreated: boolean
  emailOnTicketAssigned: boolean
  emailOnTicketResolved: boolean
  emailOnNewComment: boolean
}

export const getProfile = async (): Promise<{ data: ProfileData }> => {
  const res = await api.get('/api/settings/profile')
  return res.data
}

export const updateProfile = async (data: {
  name?: string
  email?: string
}): Promise<{ data: ProfileData }> => {
  const res = await api.patch('/api/settings/profile', data)
  return res.data
}

export const updatePassword = async (data: {
  currentPassword: string
  newPassword: string
}): Promise<{ data: { message: string } }> => {
  const res = await api.patch('/api/settings/password', data)
  return res.data
}

export const getNotificationSettings = async (): Promise<{
  data: NotificationSettings
}> => {
  const res = await api.get('/api/settings/notifications')
  return res.data
}