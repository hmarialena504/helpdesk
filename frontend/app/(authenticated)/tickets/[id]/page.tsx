'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Lock } from 'lucide-react'
import {
  getTicketById,
  updateTicket,
  addComment,
  Ticket,
  Comment,
} from '@/lib/ticketService'
import { useAuth } from '@/lib/authContext'
import StatusBadge from '@/components/ui/StatusBadge'
import PriorityBadge from '@/components/ui/PriorityBadge'

export default function TicketDetailPage() {
  const { id } = useParams() as { id: string }
  const { user } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await getTicketById(id)
        setTicket(res.data)
        setComments((res.data as Ticket & { comments: Comment[] }).comments || [])
      } catch {
        setError('Ticket not found')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTicket()
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return
    setIsUpdating(true)
    try {
      const res = await updateTicket(ticket.id, { status: newStatus })
      setTicket(res.data)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!commentBody.trim()) return
    setIsSubmitting(true)
    try {
      const res = await addComment(id, { body: commentBody, isInternal })
      setComments((prev) => [...prev, res.data])
      setCommentBody('')
      setIsInternal(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isAgent = user?.role === 'ADMIN' || user?.role === 'AGENT'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <p className="text-gray-500">{error || 'Ticket not found'}</p>
        <Link href="/tickets" className="mt-4 text-sm text-blue-600 hover:underline inline-block">
          Back to tickets
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Back link */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main content — left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Ticket header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {ticket.title}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  #{ticket.id.slice(-8)} · Created {formatDate(ticket.createdAt)} by {ticket.createdBy.name}
                </p>
              </div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900 text-sm">
                Comments ({comments.length})
              </h2>
            </div>

            {/* Comment list */}
            <div className="divide-y divide-gray-100">
              {comments.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">
                  No comments yet.
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 ${comment.isInternal ? 'bg-amber-50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author.name}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {comment.author.role.toLowerCase()}
                        </span>
                        {comment.isInternal && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            <Lock className="w-3 h-3" />
                            Internal
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {comment.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add comment form */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleAddComment}>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                />
                <div className="flex items-center justify-between">
                  {isAgent && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Internal note
                    </label>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || !commentBody.trim()}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar — right column */}
        <div className="space-y-4">

          {/* Status card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Status
            </h3>
            <StatusBadge status={ticket.status} />

            {/* Agents can change status */}
            {isAgent && (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdating}
                className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            )}
          </div>

          {/* Details card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </h3>

            <div>
              <p className="text-xs text-gray-400 mb-1">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Created by</p>
              <p className="text-sm text-gray-700">{ticket.createdBy.name}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Assigned to</p>
              <p className="text-sm text-gray-700">
                {ticket.assignedTo?.name || (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Team</p>
              <p className="text-sm text-gray-700">
                {ticket.team?.name || (
                  <span className="text-gray-400">No team</span>
                )}
              </p>
            </div>

            {ticket.resolvedAt && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Resolved</p>
                <p className="text-sm text-gray-700">
                  {formatDate(ticket.resolvedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {ticket.tags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}