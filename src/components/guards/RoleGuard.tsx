/**
 * RoleGuard — restricts access to routes based on user role.
 *
 * Security note: this is a UX guard, NOT the security boundary.
 * The real authorization enforcement happens in PostgreSQL RLS policies
 * and RPC function permission checks. If a user somehow bypasses this
 * component and calls an RPC they aren't allowed to use, the database
 * will reject it regardless.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import { ROUTES } from '@/constants'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ allowedRoles, children, redirectTo = ROUTES.DASHBOARD }: RoleGuardProps) {
  const { role, loading } = useAuth()

  if (loading) return null

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
