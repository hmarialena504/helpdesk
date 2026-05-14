'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/authContext'
import { getTicketStats } from '@/lib/ticketService'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getTicketStats()
      .then(setStats)
      .finally(() => setIsLoading(false))
  }, [])

  const statCards = [
    {
      label: 'Open Tickets',
      value: stats.open,
      color: 'bg-blue-50 text-blue-700',
      href: '/tickets?status=OPEN',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      color: 'bg-yellow-50 text-yellow-700',
      href: '/tickets?status=IN_PROGRESS',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      color: 'bg-green-50 text-green-700',
      href: '/tickets?status=RESOLVED',
    },
    {
      label: 'Total',
      value: stats.open + stats.inProgress + stats.resolved,
      color: 'bg-purple-50 text-purple-700',
      href: '/tickets',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
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
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold px-2 py-0.5 rounded w-fit ${stat.color}`}>
              {isLoading ? '—' : stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick link to tickets */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-5 flex gap-3">
          <Link
            href="/tickets/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Create Ticket
          </Link>
          <Link
            href="/tickets"
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            View All Tickets
          </Link>
        </div>
      </div>
    </div>
  )
}