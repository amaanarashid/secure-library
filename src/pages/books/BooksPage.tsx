import { useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react'
import { useBooks, useAddBook, useUpdateBook, useDeleteBook } from '@/hooks/useBooks'
import { useAuth } from '@/contexts/AuthContext'
import { canManageBooks } from '@/utils'
import { Table, Pagination } from '@/components/ui/Table'
import { SearchBar } from '@/components/ui/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/Modal'
import { BookFormModal } from '@/features/books/BookFormModal'
import type { Book, BookFilters } from '@/types'
import { BOOK_CATEGORIES, DEFAULT_PAGE_SIZE } from '@/constants'
import { formatDate } from '@/utils'

export function BooksPage() {
  const { role } = useAuth()
  const canManage = role ? canManageBooks(role) : false

  const [filters, setFilters] = useState<BookFilters>({ page: 1, limit: DEFAULT_PAGE_SIZE })
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)

  const { data, isLoading } = useBooks(filters)
  const addBook    = useAddBook()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()

  const handleSearch = (val: string) => {
    setSearch(val)
    setFilters(f => ({ ...f, search: val, page: 1 }))
  }

  const columns = [
    {
      key: 'title', header: 'Title',
      render: (row: Book) => (
        <div>
          <p className="font-medium text-slate-900 truncate max-w-[200px]">{row.title}</p>
          <p className="text-xs text-slate-500">{row.author}</p>
        </div>
      )
    },
    { key: 'isbn', header: 'ISBN', render: (row: Book) => row.isbn ?? '—' },
    {
      key: 'category', header: 'Category',
      render: (row: Book) => <Badge variant="slate">{row.category}</Badge>
    },
    {
      key: 'available_quantity', header: 'Available',
      render: (row: Book) => (
        <Badge variant={row.available_quantity > 0 ? 'success' : 'danger'}>
          {row.available_quantity}/{row.quantity}
        </Badge>
      )
    },
    {
      key: 'created_at', header: 'Added',
      render: (row: Book) => formatDate(row.created_at)
    },
    ...(canManage ? [{
      key: 'actions', header: '',
      render: (row: Book) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost" size="sm"
            onClick={() => { setEditBook(row); setShowForm(true) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-danger-600 hover:bg-danger-50"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }] : []),
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-subtitle mt-1">Browse and manage the library collection</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditBook(null); setShowForm(true) }}>
            <Plus className="h-4 w-4" /> Add Book
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search by title, author, or ISBN…"
          className="flex-1"
        />
        <Select
          options={[
            { value: '', label: 'All Categories' },
            ...BOOK_CATEGORIES.map(c => ({ value: c, label: c })),
          ]}
          value={filters.category ?? ''}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value || undefined, page: 1 }))}
          className="sm:w-48"
        />
        <Select
          options={[
            { value: 'all',         label: 'All Status' },
            { value: 'available',   label: 'Available' },
            { value: 'unavailable', label: 'Unavailable' },
          ]}
          value={filters.status ?? 'all'}
          onChange={e => setFilters(f => ({
            ...f,
            status: e.target.value as BookFilters['status'],
            page: 1,
          }))}
          className="sm:w-40"
        />
      </div>

      {/* Table */}
      {data?.data.length === 0 && !isLoading ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No books found"
          description={search ? 'Try adjusting your search or filters.' : 'Add your first book to get started.'}
          action={canManage ? (
            <Button onClick={() => { setEditBook(null); setShowForm(true) }}>
              <Plus className="h-4 w-4" /> Add Book
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={data?.data ?? []}
            keyExtractor={(row: Book) => row.id}
            loading={isLoading}
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
        </>
      )}

      {/* Add / Edit modal */}
      <BookFormModal
        open={showForm}
        book={editBook}
        onClose={() => { setShowForm(false); setEditBook(null) }}
        onSubmit={async data => {
          if (editBook) {
            await updateBook.mutateAsync({ id: editBook.id, data })
          } else {
            await addBook.mutateAsync(data)
          }
          setShowForm(false)
          setEditBook(null)
        }}
        loading={addBook.isPending || updateBook.isPending}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteBook.mutateAsync(deleteTarget.id)
            setDeleteTarget(null)
          }
        }}
        title="Delete book"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteBook.isPending}
      />
    </div>
  )
}
