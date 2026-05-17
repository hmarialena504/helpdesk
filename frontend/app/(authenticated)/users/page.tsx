'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, UserCheck, UserX, Shield } from 'lucide-react'
import {
  getUsers,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  User,
} from '@/lib/userService'

const ROLE_OPTIONS = ['', 'ADMIN', 'AGENT', 'CUSTOMER']

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 border border-purple-200',
  AGENT: 'bg-blue-50 text-blue-700 border border-blue-200',
  CUSTOMER: 'bg-gray-50 text-gray-600 border border-gray-200',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await getUsers({
          role: roleFilter || undefined,
          page,
          limit: 20,
        })
        setUsers(res.data)
        setTotalPages(res.pagination.totalPages)
        setTotal(res.pagination.total)
      } catch {
        setError('Failed to load users')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [roleFilter, page])


  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId)
    try {
      const res = await updateUserRole(userId, newRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.data.role } : u))
      )
    } catch {
      setError('Failed to update role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleActive = async (user: User) => {
    setActionLoading(user.id)
    try {
      if (user.isActive) {
        await deactivateUser(user.id)
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: false } : u))
        )
      } else {
        await reactivateUser(user.id)
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: true } : u))
        )
      }
    } catch {
      setError('Failed to update user status')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      search === '' ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} user{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span className="text-sm text-gray-500">Admin view</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-gray-700 placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => { 
                setRoleFilter(e.target.value)
                setPage(1)
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === '' ? 'All Roles' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  User
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Tickets
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Joined
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    !user.isActive ? 'opacity-60' : ''
                  }`}
                >
                  {/* User info */}
                  <td className="px-4 py-3">
                    <Link href={`/users/${user.id}`}>
                      <p className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {user.email}
                      </p>
                    </Link>
                  </td>

                  {/* Role with inline editor */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={actionLoading === user.id}
                      className={`text-xs font-medium px-2 py-1 rounded border cursor-pointer disabled:opacity-50 ${roleColors[user.role]}`}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="AGENT">AGENT</option>
                      <option value="CUSTOMER">CUSTOMER</option>
                    </select>
                  </td>

                  {/* Ticket counts */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <p>{user._count?.createdTickets ?? 0} created</p>
                      <p>{user._count?.assignedTickets ?? 0} assigned</p>
                    </div>
                  </td>

                  {/* Join date */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-gray-500">
                      {formatDate(user.createdAt)}
                    </p>
                  </td>

                  {/* Active status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Deactivate / reactivate */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={actionLoading === user.id}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                      title={user.isActive ? 'Deactivate user' : 'Reactivate user'}
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-red-600 hidden sm:inline">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-green-600 hidden sm:inline">Reactivate</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}