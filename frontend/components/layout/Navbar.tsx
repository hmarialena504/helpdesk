'use client'

import { useAuth } from '@/lib/authContext'
import { Menu, Bell, LogOut, User } from 'lucide-react'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">

      {/* Left side — hamburger menu + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <span className="font-semibold text-gray-900 hidden sm:block">
            Helpdesk
          </span>
        </div>
      </div>

      {/* Right side — notifications + user info */}
      <div className="flex items-center gap-2">

        {/* Notification bell — wired up in a later step */}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 leading-tight capitalize">
              {user?.role.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>

      </div>
    </header>
  )
}