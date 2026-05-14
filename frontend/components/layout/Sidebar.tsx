'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  X,
  TrendingUp,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]   // Which roles can see this item
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['ADMIN', 'AGENT', 'CUSTOMER'],
  },
  {
    label: 'Tickets',
    href: '/tickets',
    icon: <Ticket className="w-5 h-5" />,
    roles: ['ADMIN', 'AGENT', 'CUSTOMER'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: <TrendingUp className="w-5 h-5" />,
    roles: ['ADMIN', 'AGENT'],   // Customers don't see reports
  },
  {
    label: 'Users',
    href: '/users',
    icon: <Users className="w-5 h-5" />,
    roles: ['ADMIN'],            // Only admins manage users
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Filter nav items to only those the current user's role can see
  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  )

  return (
    <>
      {/* Mobile overlay — dark background behind sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200
          z-40 transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-sm font-medium text-gray-500">Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-colors font-medium
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Role badge at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-500 capitalize">
              Signed in as {user?.role.toLowerCase()}
            </span>
          </div>
        </div>

      </aside>
    </>
  )
}