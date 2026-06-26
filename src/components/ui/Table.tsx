import { cn } from '@/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
}

export function Table<T>({
  columns, data, keyExtractor, loading, emptyMessage = 'No records found', emptyIcon
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="table-container">
        <table className="table">
          <thead className="table-head">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="table-th">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="table-row">
                {columns.map(col => (
                  <td key={col.key} className="table-td">
                    <div className="skeleton h-4 w-full max-w-[200px] rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <table className="table">
          <thead className="table-head">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="table-th">{col.header}</th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
          {emptyIcon}
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead className="table-head">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={cn('table-th', col.className)}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map(row => (
            <tr key={keyExtractor(row)} className="table-row">
              {columns.map(col => (
                <td key={col.key} className={cn('table-td', col.className)}>
                  {col.render
                    ? col.render(row)
                    : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Pagination ───────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end   = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span>{' '}
        of <span className="font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[80px] text-center text-sm text-slate-700 font-medium">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
