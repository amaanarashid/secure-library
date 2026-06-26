import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, BookMarked, Users, FileText,
  ShieldCheck, User, LogOut, Menu, X, ChevronDown, Library
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn, initials } from '@/utils'
import { ROUTES, APP_NAME, ROLE_LABELS } from '@/constants'
import toast from 'react-hot-toast'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: ROUTES.DASHBOARD,  icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Books',       href: ROUTES.BOOKS,       icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Borrowing',   href: ROUTES.BORROWING,   icon: <BookMarked className="h-4 w-4" /> },
  { label: 'Users',       href: ROUTES.USERS,       icon: <Users className="h-4 w-4" />,       roles: ['admin'] },
  { label: 'Audit Logs',  href: ROUTES.AUDIT_LOGS,  icon: <FileText className="h-4 w-4" />,    roles: ['admin'] },
  { label: 'Security',    href: ROUTES.SECURITY,    icon: <ShieldCheck className="h-4 w-4" />, roles: ['admin'] },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const filteredNav = NAV_ITEMS.filter(item =>
    !item.roles || (role && item.roles.includes(role))
  )

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    navigate(ROUTES.LOGIN)
  }

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <Library className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-slate-900">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {filteredNav.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'sidebar-link-active')
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* User area */}
      <div className="border-t border-slate-100 p-3">
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex-shrink-0">
              {initials(profile?.full_name ?? 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {profile?.full_name}
              </p>
              <p className="text-xs text-slate-400">
                {role ? ROLE_LABELS[role] : ''}
              </p>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
              <NavLink
                to={ROUTES.PROFILE}
                onClick={() => { setProfileOpen(false); setSidebarOpen(false) }}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile
              </NavLink>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white border-r border-slate-200 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-white border-r border-slate-200 lg:hidden">
            <Sidebar />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600">
              <Library className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">{APP_NAME}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
