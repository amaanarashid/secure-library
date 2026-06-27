/**
 * App.tsx — Root router configuration
 *
 * Security architecture:
 * - AuthGuard: every protected route requires a valid Supabase session
 * - RoleGuard: admin/librarian routes are restricted by role at the UI level
 * - The database (RLS + RPC) is the authoritative security boundary
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'

import { AuthProvider } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { GuestGuard } from '@/components/guards/GuestGuard'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { AppLayout } from '@/components/layouts/AppLayout'
import { ROUTES } from '@/constants'

// Auth pages
import { LoginPage }         from '@/pages/auth/LoginPage'
import { RegisterPage }      from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage} from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'

// App pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { BooksPage }     from '@/pages/books/BooksPage'
import { BorrowingPage } from '@/pages/borrowing/BorrowingPage'
import { ProfilePage }   from '@/pages/profile/ProfilePage'

// Admin pages
import { UsersPage }     from '@/pages/users/UsersPage'
import { AuditLogsPage } from '@/pages/audit/AuditLogsPage'
import { SecurityPage }  from '@/pages/security/SecurityPage'

// TanStack Query config — global error/retry settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Auth (guest-only) ────────────────────────── */}
            <Route path={ROUTES.LOGIN} element={
              <GuestGuard><LoginPage /></GuestGuard>
            } />
            <Route path={ROUTES.REGISTER} element={
              <GuestGuard><RegisterPage /></GuestGuard>
            } />
            <Route path={ROUTES.FORGOT_PASSWORD} element={
              <GuestGuard><ForgotPasswordPage /></GuestGuard>
            } />
            <Route path={ROUTES.RESET_PASSWORD} element={
              <ResetPasswordPage />
            } />

            {/* ── Protected app routes ─────────────────────── */}
            <Route element={
              <AuthGuard>
                <AppLayout>
                  <Routes>
                    <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                    <Route path={ROUTES.BOOKS}     element={<BooksPage />} />
                    <Route path={ROUTES.BORROWING} element={<BorrowingPage />} />
                    <Route path={ROUTES.PROFILE}   element={<ProfilePage />} />

                    {/* Admin + Librarian */}
                    <Route path={ROUTES.USERS} element={
                      <RoleGuard allowedRoles={['admin']}>
                        <UsersPage />
                      </RoleGuard>
                    } />

                    {/* Admin only */}
                    <Route path={ROUTES.AUDIT_LOGS} element={
                      <RoleGuard allowedRoles={['admin']}>
                        <AuditLogsPage />
                      </RoleGuard>
                    } />
                    <Route path={ROUTES.SECURITY} element={
                      <RoleGuard allowedRoles={['admin']}>
                        <SecurityPage />
                      </RoleGuard>
                    } />
                  </Routes>
                </AppLayout>
              </AuthGuard>
            } path="/*" />

            {/* Redirect root → dashboard */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast notifications — positioned top-right */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color:      '#f8fafc',
              fontSize:   '14px',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        {/* Vercel Web Analytics */}
        <Analytics />
      </AuthProvider>
    </QueryClientProvider>
  )
}
