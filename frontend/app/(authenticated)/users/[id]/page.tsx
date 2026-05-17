'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ticket, MessageSquare, User } from 'lucide-react'
import { getUserById, UserDetail } from '@/lib/userService'
import StatusBadge from '@/components/ui/StatusBadge'
import PriorityBadge from '@/components/ui/PriorityBadge'

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border border-purple-200',
  AGENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  CUSTOMER: 'bg-gray-50 text-gray-600 border border-gray-200',
}

export default function UserDetailPage() {
  const { id } = useParams() as { id: string }
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserById(id)
        setUser(res.data)
      } catch {
        setError('User not found')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <p className="text-gray-500">{error || 'User not found'}</p>
        <Link
          href="/users"
          className="mt-4 text-sm text-blue-600 hover:underline inline-block"
        >
          Back to users
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Back link */}
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to users
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — user profile */}
        <div className="space-y-4">

          {/* Profile card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${roleColors[user.role]}`}>
                {user.role}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                user.isActive
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Stats card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Activity
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Ticket className="w-4 h-4 text-gray-400" />
                Tickets created
              </div>
              <span className="text-sm font-medium text-gray-900">
                {user._count?.createdTickets ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Ticket className="w-4 h-4 text-gray-400" />
                Tickets assigned
              </div>
              <span className="text-sm font-medium text-gray-900">
                {user._count?.assignedTickets ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                Comments
              </div>
              <span className="text-sm font-medium text-gray-900">
                {user._count?.comments ?? 0}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Right column — tickets */}
        <div className="lg:col-span-2 space-y-6">

          {/* Assigned tickets */}
          {user.role !== 'CUSTOMER' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Assigned Tickets ({user._count?.assignedTickets ?? 0})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {user.assignedTickets.length === 0 ? (
                  <p className="p-6 text-sm text-gray-400 text-center">
                    No assigned tickets.
                  </p>
                ) : (
                  user.assignedTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Created tickets */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">
                Created Tickets ({user._count?.createdTickets ?? 0})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {user.createdTickets.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 text-center">
                  No created tickets.
                </p>
              ) : (
                user.createdTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}