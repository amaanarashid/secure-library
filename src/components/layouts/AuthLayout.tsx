import { Library, ShieldCheck } from 'lucide-react'
import { APP_NAME } from '@/constants'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg mb-4">
            <Library className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-sm text-slate-400 mt-1">Secure Library Management System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-white/10">
          <div className="px-8 pt-8 pb-2">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div className="p-8 pt-6">
            {children}
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />
          <span>Protected by Row Level Security & Supabase Auth</span>
        </div>
      </div>
    </div>
  )
}
