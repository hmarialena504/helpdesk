'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '@/lib/authContext'
import {
  getProfile,
  updateProfile,
  updatePassword,
  getNotificationSettings,
  ProfileData,
  NotificationSettings,
} from '@/lib/settingsService'
import {
  User,
  Lock,
  Bell,
  Shield,
  Check,
  AlertTriangle,
} from 'lucide-react'

// Reusable section card component
const SettingsSection = ({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="p-5 border-b border-gray-200 flex items-start gap-3">
      <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
)

// Reusable success/error message component
const StatusMessage = ({
  type,
  message,
}: {
  type: 'success' | 'error'
  message: string
}) => (
  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
    type === 'success'
      ? 'bg-green-50 border border-green-200 text-green-700'
      : 'bg-red-50 border border-red-200 text-red-700'
  }`}>
    {type === 'success'
      ? <Check className="w-4 h-4 shrink-0" />
      : <AlertTriangle className="w-4 h-4 shrink-0" />
    }
    {message}
  </div>
)

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Profile form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileStatus, setProfileStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, notifRes] = await Promise.all([
          getProfile(),
          getNotificationSettings(),
        ])
        setProfile(profileRes.data)
        setName(profileRes.data.name)
        setEmail(profileRes.data.email)
        setNotifications(notifRes.data)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setProfileStatus(null)
    setIsSavingProfile(true)

    try {
      const res = await updateProfile({ name, email })
      setProfile((prev) => prev ? { ...prev, ...res.data } : null)
      setProfileStatus({
        type: 'success',
        message: 'Profile updated successfully',
      })
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Failed to update profile'
      setProfileStatus({ type: 'error', message })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordStatus(null)

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        message: 'New passwords do not match',
      })
      return
    }

    setIsSavingPassword(true)

    try {
      await updatePassword({ currentPassword, newPassword })
      setPasswordStatus({
        type: 'success',
        message: 'Password updated successfully',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Failed to update password'
      setPasswordStatus({ type: 'error', message })
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">

        {/* Profile section */}
        <SettingsSection
          title="Profile"
          description="Update your name and email address"
          icon={<User className="w-4 h-4 text-gray-600" />}
        >
          {/* Account stats */}
          {profile && (
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {profile._count.createdTickets}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Tickets created</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {profile._count.assignedTickets}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Tickets assigned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {profile._count.comments}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Comments</p>
              </div>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed capitalize"
              />
              <p className="text-xs text-gray-400 mt-1">
                Role can only be changed by an administrator
              </p>
            </div>

            {profileStatus && (
              <StatusMessage
                type={profileStatus.type}
                message={profileStatus.message}
              />
            )}

            <button
              type="submit"
              disabled={isSavingProfile}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isSavingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </SettingsSection>

        {/* Password section */}
        <SettingsSection
          title="Password"
          description="Change your account password"
          icon={<Lock className="w-4 h-4 text-gray-600" />}
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Min 8 characters, one capital letter, one number, one special character
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {passwordStatus && (
              <StatusMessage
                type={passwordStatus.type}
                message={passwordStatus.message}
              />
            )}

            <button
              type="submit"
              disabled={isSavingPassword}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isSavingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </SettingsSection>

        {/* Notification settings */}
        <SettingsSection
          title="Notifications"
          description="Control which emails you receive"
          icon={<Bell className="w-4 h-4 text-gray-600" />}
        >
          {notifications && (
            <div className="space-y-4">
              {[
                {
                  key: 'emailOnTicketCreated',
                  label: 'Ticket created',
                  description: 'When a new ticket is created',
                },
                {
                  key: 'emailOnTicketAssigned',
                  label: 'Ticket assigned',
                  description: 'When a ticket is assigned to you',
                },
                {
                  key: 'emailOnTicketResolved',
                  label: 'Ticket resolved',
                  description: 'When your ticket is marked as resolved',
                },
                {
                  key: 'emailOnNewComment',
                  label: 'New comment',
                  description: 'When someone comments on your ticket',
                },
              ].map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {setting.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {setting.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[setting.key as keyof NotificationSettings]}
                      onChange={(e) =>
                        setNotifications((prev) =>
                          prev
                            ? { ...prev, [setting.key]: e.target.checked }
                            : null
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              ))}

              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                Note — notification preferences are saved locally for now.
                Full persistence coming in a future update.
              </p>
            </div>
          )}
        </SettingsSection>

        {/* Account info */}
        <SettingsSection
          title="Account"
          description="Your account details and security"
          icon={<Shield className="w-4 h-4 text-gray-600" />}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Account ID</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {user?.id}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Member since</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {profile && new Date(profile.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Sign out</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sign out of your account on this device
                </p>
              </div>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </SettingsSection>

      </div>
    </div>
  )
}