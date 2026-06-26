import {
  BookOpen, Users, BookMarked, AlertTriangle,
  Clock, TrendingUp, BookCheck, Database
} from 'lucide-react'
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/utils'
import { AUDIT_ACTION_LABELS } from '@/utils'

export function DashboardPage() {
  const { profile, role } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activity, isLoading: activityLoading } = useRecentActivity(8)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="page-title">
          Good {getGreeting()}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle mt-1">
          Here's what's happening in the library today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-7 w-16 rounded" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total Books"
              value={stats?.total_books ?? 0}
              icon={<BookOpen className="h-6 w-6" />}
              iconBg="bg-primary-50"
              iconColor="text-primary-600"
              trend={{ value: stats?.books_added_this_month ?? 0, label: 'added this month' }}
            />
            <StatCard
              label="Available Books"
              value={stats?.available_books ?? 0}
              icon={<BookCheck className="h-6 w-6" />}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              label="Active Borrows"
              value={stats?.active_borrows ?? 0}
              icon={<BookMarked className="h-6 w-6" />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              label="Overdue Books"
              value={stats?.overdue_books ?? 0}
              icon={<AlertTriangle className="h-6 w-6" />}
              iconBg="bg-red-50"
              iconColor="text-red-600"
            />
          </>
        )}
      </div>

      {/* Secondary stats (admin/librarian) */}
      {role !== 'student' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats?.total_users ?? 0}
            icon={<Users className="h-6 w-6" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            trend={{ value: stats?.new_users_this_month ?? 0, label: 'joined this month' }}
          />
          <StatCard
            label="Total Borrow Records"
            value={stats?.total_borrow_records ?? 0}
            icon={<Database className="h-6 w-6" />}
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
          />
          <StatCard
            label="Books This Month"
            value={stats?.books_added_this_month ?? 0}
            icon={<TrendingUp className="h-6 w-6" />}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-600"
          />
          <StatCard
            label="New Users This Month"
            value={stats?.new_users_this_month ?? 0}
            icon={<Users className="h-6 w-6" />}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </div>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader title="Recent Activity" subtitle="Latest events in the system" />
        <CardBody className="p-0">
          {activityLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-4 w-48 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !activity?.length ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Clock className="h-5 w-5" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.map(item => (
                <li key={item.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 flex-shrink-0">
                    <ActivityIcon action={item.action} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 truncate">
                      <span className="font-medium">{item.user_name ?? 'System'}</span>{' '}
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                  <Badge variant="slate" className="flex-shrink-0 hidden sm:inline-flex">
                    {AUDIT_ACTION_LABELS[item.action as keyof typeof AUDIT_ACTION_LABELS] ?? item.action}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('BOOK')) return <BookOpen className="h-4 w-4 text-primary-600" />
  if (action.includes('USER')) return <Users className="h-4 w-4 text-violet-600" />
  if (action.includes('BORROW')) return <BookMarked className="h-4 w-4 text-amber-600" />
  return <Clock className="h-4 w-4 text-slate-400" />
}
