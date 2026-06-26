import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { bookSchema, type BookFormData } from '@/utils/validation'
import { BOOK_CATEGORIES } from '@/constants'
import type { Book } from '@/types'

interface BookFormModalProps {
  open: boolean
  book: Book | null
  onClose: () => void
  onSubmit: (data: BookFormData) => Promise<void>
  loading?: boolean
}

export function BookFormModal({ open, book, onClose, onSubmit, loading }: BookFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<BookFormData>({ resolver: zodResolver(bookSchema) })

  useEffect(() => {
    if (book) {
      reset({
        title:       book.title,
        author:      book.author,
        isbn:        book.isbn ?? '',
        category:    book.category as BookFormData['category'],
        description: book.description ?? '',
        quantity:    book.quantity,
      })
    } else {
      reset({ title: '', author: '', isbn: '', description: '', quantity: 1 })
    }
  }, [book, open, reset])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={book ? 'Edit Book' : 'Add Book'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            type="submit"
            form="book-form"
            loading={loading}
          >
            {book ? 'Save Changes' : 'Add Book'}
          </Button>
        </>
      }
    >
      <form id="book-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Title"
            required
            error={errors.title?.message}
            {...register('title')}
          />
          <Input
            label="Author"
            required
            error={errors.author?.message}
            {...register('author')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="ISBN"
            placeholder="e.g. 9780140449136"
            error={errors.isbn?.message}
            {...register('isbn')}
          />
          <Select
            label="Category"
            required
            error={errors.category?.message}
            options={BOOK_CATEGORIES.map(c => ({ value: c, label: c }))}
            placeholder="Select category"
            {...register('category')}
          />
        </div>
        <Input
          label="Quantity"
          type="number"
          min={1}
          required
          error={errors.quantity?.message}
          {...register('quantity', { valueAsNumber: true })}
        />
        <Textarea
          label="Description"
          placeholder="Optional description…"
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  )
}
