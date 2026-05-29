'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  getOverview,
  getByStatus,
  getByPriority,
  getVolume,
  getByAgent,
  OverviewData,
  StatusData,
  PriorityData,
  VolumeData,
  AgentData,
} from '@/lib/reportsService'
import { TrendingUp, Ticket, Clock, AlertCircle } from 'lucide-react'

// Colour schemes for charts
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#22c55e',
  CLOSED: '#6b7280',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#3b82f6',
  HIGH: '#f97316',
  URGENT: '#ef4444',
}

// Reusable loading skeleton for charts
const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
    <div className="h-64 bg-gray-100 rounded" />
  </div>
)

// Reusable metric card component
const MetricCard = ({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {subtitle && (
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    )}
  </div>
)

export default function ReportsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [priorityData, setPriorityData] = useState<PriorityData[]>([])
  const [volumeData, setVolumeData] = useState<VolumeData[]>([])
  const [agentData, setAgentData] = useState<AgentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [
          overviewRes,
          statusRes,
          priorityRes,
          volumeRes,
          agentRes,
        ] = await Promise.all([
          getOverview(),
          getByStatus(),
          getByPriority(),
          getVolume(),
          getByAgent(),
        ])
        setOverview(overviewRes.data)
        setStatusData(statusRes.data)
        setPriorityData(priorityRes.data)
        setVolumeData(volumeRes.data)
        setAgentData(agentRes.data)
      } catch {
        setError('Failed to load reports')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [])

  const formatHours = (hours: number): string => {
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    const remaining = hours % 24
    return remaining > 0 ? `${days}d ${remaining}h` : `${days}d`
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto text-center py-24">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Ticket analytics and performance metrics
          </p>
        </div>
      </div>

      {/* Overview metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))
        ) : overview ? (
          <>
            <MetricCard
              label="Total Tickets"
              value={overview.totalTickets}
              subtitle="All time"
              icon={<Ticket className="w-4 h-4 text-blue-600" />}
              color="bg-blue-50"
            />
            <MetricCard
              label="Open Tickets"
              value={overview.openTickets}
              subtitle={`${overview.openRate}% open rate`}
              icon={<AlertCircle className="w-4 h-4 text-yellow-600" />}
              color="bg-yellow-50"
            />
            <MetricCard
              label="Resolved (30d)"
              value={overview.resolvedLast30Days}
              subtitle="Last 30 days"
              icon={<TrendingUp className="w-4 h-4 text-green-600" />}
              color="bg-green-50"
            />
            <MetricCard
              label="Avg Resolution"
              value={formatHours(overview.avgResolutionHours)}
              subtitle="Time to resolve"
              icon={<Clock className="w-4 h-4 text-purple-600" />}
              color="bg-purple-50"
            />
          </>
        ) : null}
      </div>

      {/* Volume chart — full width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">
          Ticket Volume
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          New tickets created per day over the last 30 days
        </p>
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={volumeData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '13px',
                }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar
                dataKey="count"
                name="Tickets"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status and Priority charts — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Tickets by status — donut chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            By Status
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Current distribution of ticket statuses
          </p>
          {isLoading ? (
            <ChartSkeleton />
          ) : statusData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || '#6b7280'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                  formatter={(value, name) => [value, String(name).replace('_', ' ')]}
                />
                <Legend
                  formatter={(value) => String(value).replace('_', ' ')}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tickets by priority — bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            By Priority
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Ticket counts by priority level
          </p>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={priorityData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="priority"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell
                      key={entry.priority}
                      fill={PRIORITY_COLORS[entry.priority] || '#6b7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tickets by agent */}
      {agentData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            By Agent
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Tickets assigned per agent
          </p>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={agentData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="agentName"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar
                  dataKey="count"
                  name="Tickets"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

    </div>
  )
}