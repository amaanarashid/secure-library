/**
 * GuestGuard — prevents authenticated users from seeing auth pages.
 * If already signed in, redirects to dashboard.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/constants'

interface GuestGuardProps {
  children: React.ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { session, loading } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? ROUTES.DASHBOARD

  if (loading) return null
  if (session)  return <Navigate to={from} replace />

  return <>{children}</>
}
