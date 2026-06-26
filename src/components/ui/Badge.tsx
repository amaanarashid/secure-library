import { cn } from '@/utils'

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'slate'
  children: React.ReactNode
  className?: string
}

const variants = {
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-700',
  slate:   'bg-slate-100 text-slate-700',
}

export function Badge({ variant = 'slate', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
