'use client'

import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {user.email} · {user.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-500">
            Dashboard coming soon. Auth is working correctly.
          </p>
        </div>
      </div>
    </div>
  )
}