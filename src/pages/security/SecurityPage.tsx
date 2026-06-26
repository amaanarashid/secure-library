import { ShieldCheck, ShieldAlert, Key, Lock, UserX, AlertTriangle } from 'lucide-react'
import { useAuditLogs } from '@/hooks/useAudit'
import { useUsers } from '@/hooks/useUsers'
import { useDashboardStats } from '@/hooks/useDashboard'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { formatRelativeTime, AUDIT_ACTION_LABELS, SECURITY_AUDIT_ACTIONS } from '@/utils'
import type { AuditLog, AuditAction } from '@/types'
import { ROLE_LABELS } from '@/constants'

export function SecurityPage() {
  const { data: stats } = useDashboardStats()
  const { data: allLogs } = useAuditLogs({ limit: 20 })
  const { data: securityLogs } = useAuditLogs({
    action: 'USER_LOGIN_FAILED',
    limit: 10,
  })
  const { data: users } = useUsers({ limit: 100 })

  const roleBreakdown = (users?.data ?? []).reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {})

  const recentSecurityEvents = (allLogs?.data ?? []).filter(log =>
    SECURITY_AUDIT_ACTIONS.includes(log.action as AuditAction)
  )

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="page-title">Security Dashboard</h1>
        <p className="page-subtitle mt-1">Security posture overview — admin access only</p>
      </div>

      {/* Security stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Failed Login Attempts"
          value={securityLogs?.total ?? 0}
          icon={<ShieldAlert className="h-6 w-6" />}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          label="Overdue Books"
          value={stats?.overdue_books ?? 0}
          icon={<AlertTriangle className="h-6 w-6" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Disabled Users"
          value={(users?.data ?? []).filter(u => !u.is_active).length}
          icon={<UserX className="h-6 w-6" />}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatCard
          label="Total Audit Events"
          value={allLogs?.total ?? 0}
          icon={<Lock className="h-6 w-6" />}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent security events */}
        <Card>
          <CardHeader
            title="Recent Security Events"
            subtitle="Role changes, failed logins, password resets"
          />
          <CardBody className="p-0">
            {recentSecurityEvents.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <p className="text-sm">No security events detected</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentSecurityEvents.slice(0, 8).map(log => (
                  <li key={log.id} className="flex items-start gap-3 px-6 py-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-50 mt-0.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="danger" className="text-[10px]">
                          {AUDIT_ACTION_LABELS[log.action as AuditAction] ?? log.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5">{log.description}</p>
                      <p className="text-xs text-slate-400">
                        {formatRelativeTime(log.created_at)}
                        {log.ip_address && ` · ${log.ip_address}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* User role distribution */}
        <Card>
          <CardHeader title="User Role Distribution" subtitle="Current permission levels" />
          <CardBody>
            <div className="space-y-4">
              {Object.entries(ROLE_LABELS).map(([role, label]) => {
                const count = roleBreakdown[role] ?? 0
                const total = users?.total ?? 1
                const pct   = Math.round((count / total) * 100)
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Key className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </div>
                      <span className="text-sm tabular-nums text-slate-500">
                        {count} users ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Security checklist */}
            <div className="mt-6 rounded-xl bg-green-50 p-4 space-y-2">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                Security Controls Active
              </p>
              {[
                'Row Level Security on all tables',
                'RPC functions enforce permissions',
                'All actions audit logged',
                'Session timeout enabled',
                'Password strength enforced',
                'Email verification required',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-green-700">{item}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Failed logins */}
      <Card>
        <CardHeader
          title="Failed Login Attempts"
          subtitle="Recent authentication failures"
        />
        <CardBody className="p-0">
          {!securityLogs?.data.length ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <p className="text-sm">No failed login attempts recorded</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {securityLogs.data.map(log => (
                <li key={log.id} className="flex items-center gap-4 px-6 py-3">
                  <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{log.description}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{log.ip_address ?? '—'}</span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
