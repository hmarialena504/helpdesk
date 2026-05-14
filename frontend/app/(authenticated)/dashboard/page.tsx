'use client'

import { useAuth } from '@/lib/authContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-6xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Here`s what`s happening with your helpdesk today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open Tickets', value: '—', color: 'bg-blue-50 text-blue-700' },
          { label: 'In Progress', value: '—', color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Resolved Today', value: '—', color: 'bg-green-50 text-green-700' },
          { label: 'Avg Response Time', value: '—', color: 'bg-purple-50 text-purple-700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold px-2 py-0.5 rounded w-fit ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent tickets placeholder */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
        </div>
        <div className="p-8 text-center text-gray-400 text-sm">
          Ticket list coming in the next step.
        </div>
      </div>

    </div>
  )
}