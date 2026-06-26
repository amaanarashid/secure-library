import { useState } from 'react'
import { BookMarked, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyBorrows, useAllBorrows, useReturnBook } from '@/hooks/useBorrowing'
import { Table, Pagination } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/Modal'
import { canManageBooks, formatDate, getBorrowStatusVariant } from '@/utils'
import type { BorrowRecord, BorrowFilters } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants'

export function BorrowingPage() {
  const { role } = useAuth()
  const isStaff = role ? canManageBooks(role) : false

  const [filters, setFilters] = useState<BorrowFilters>({ page: 1, limit: DEFAULT_PAGE_SIZE })
  const [returnTarget, setReturnTarget] = useState<BorrowRecord | null>(null)

  const myBorrows  = useMyBorrows(filters)
  const allBorrows = useAllBorrows(filters)
  const returnBook = useReturnBook()

  const { data, isLoading } = isStaff ? allBorrows : myBorrows

  const columns = [
    {
      key: 'book', header: 'Book',
      render: (row: BorrowRecord) => (
        <div>
          <p className="font-medium text-slate-900">{row.book?.title ?? '—'}</p>
          <p className="text-xs text-slate-500">{row.book?.author}</p>
        </div>
      )
    },
    ...(isStaff ? [{
      key: 'user', header: 'User',
      render: (row: BorrowRecord) => (
        <div>
          <p className="text-sm text-slate-800">{row.user?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-500">{row.user?.email}</p>
        </div>
      )
    }] : []),
    {
      key: 'borrow_date', header: 'Borrowed',
      render: (row: BorrowRecord) => formatDate(row.borrow_date)
    },
    {
      key: 'due_date', header: 'Due',
      render: (row: BorrowRecord) => (
        <span className={row.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
          {formatDate(row.due_date)}
        </span>
      )
    },
    {
      key: 'return_date', header: 'Returned',
      render: (row: BorrowRecord) => row.return_date ? formatDate(row.return_date) : '—'
    },
    {
      key: 'status', header: 'Status',
      render: (row: BorrowRecord) => (
        <Badge variant={getBorrowStatusVariant(row.status)}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      )
    },
    {
      key: 'actions', header: '',
      render: (row: BorrowRecord) => (
        row.status === 'active' || row.status === 'overdue' ? (
          <Button variant="secondary" size="sm" onClick={() => setReturnTarget(row)}>
            Return
          </Button>
        ) : null
      )
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Borrowing</h1>
          <p className="page-subtitle mt-1">
            {isStaff ? 'Manage all borrow records' : 'Your borrowed books'}
          </p>
        </div>
        <Select
          options={[
            { value: 'all',      label: 'All Status' },
            { value: 'active',   label: 'Active' },
            { value: 'overdue',  label: 'Overdue' },
            { value: 'returned', label: 'Returned' },
          ]}
          value={filters.status ?? 'all'}
          onChange={e => setFilters(f => ({
            ...f, status: e.target.value as BorrowFilters['status'], page: 1
          }))}
          className="w-40"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        keyExtractor={(row: BorrowRecord) => row.id}
        loading={isLoading}
        emptyMessage="No borrow records found"
        emptyIcon={<BookMarked className="h-8 w-8" />}
      />

      {data && data.total_pages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.total_pages}
          total={data.total}
          limit={data.limit}
          onPageChange={page => setFilters(f => ({ ...f, page }))}
        />
      )}

      <ConfirmModal
        open={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        onConfirm={async () => {
          if (returnTarget) {
            await returnBook.mutateAsync(returnTarget.id)
            setReturnTarget(null)
          }
        }}
        title="Return book"
        description={`Return "${returnTarget?.book?.title}"? This will update the library inventory.`}
        confirmLabel="Return Book"
        confirmVariant="primary"
        loading={returnBook.isPending}
      />
    </div>
  )
}
