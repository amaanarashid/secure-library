import { cn } from '@/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return <div className={cn('card', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('card-header flex items-center justify-between', className)}>
      <div>
        <h3 className="section-title">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('card-body', className)}>{children}</div>
}
