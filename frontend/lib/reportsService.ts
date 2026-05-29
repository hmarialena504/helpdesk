import api from './api'

export interface OverviewData {
  totalTickets: number
  openTickets: number
  resolvedLast30Days: number
  avgResolutionHours: number
  openRate: number
}

export interface StatusData {
  status: string
  count: number
}

export interface PriorityData {
  priority: string
  count: number
}

export interface VolumeData {
  date: string
  label: string
  count: number
}

export interface AgentData {
  agentId: string
  agentName: string
  count: number
}

export const getOverview = async (): Promise<{ data: OverviewData }> => {
  const res = await api.get('/api/reports/overview')
  return res.data
}

export const getByStatus = async (): Promise<{ data: StatusData[] }> => {
  const res = await api.get('/api/reports/by-status')
  return res.data
}

export const getByPriority = async (): Promise<{ data: PriorityData[] }> => {
  const res = await api.get('/api/reports/by-priority')
  return res.data
}

export const getVolume = async (): Promise<{ data: VolumeData[] }> => {
  const res = await api.get('/api/reports/volume')
  return res.data
}

export const getByAgent = async (): Promise<{ data: AgentData[] }> => {
  const res = await api.get('/api/reports/by-agent')
  return res.data
}