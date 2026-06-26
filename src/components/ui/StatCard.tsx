import { cn } from '@/utils'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ label, value, icon, iconBg, iconColor, trend, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className={cn('stat-icon flex-shrink-0', iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        {trend && (
          <p className={cn('text-xs mt-0.5', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
