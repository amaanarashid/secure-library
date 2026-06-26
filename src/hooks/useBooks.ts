import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { bookService } from '@/services/books/bookService'
import type { BookFilters } from '@/types'
import type { BookFormData } from '@/utils/validation'
import { QUERY_KEYS } from '@/constants'

export function useBooks(filters: BookFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BOOKS, filters],
    queryFn:  () => bookService.search(filters),
    staleTime: 30_000,
  })
}

export function useBook(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BOOK(id),
    queryFn:  () => bookService.getById(id),
    enabled:  !!id,
  })
}

export function useAddBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BookFormData) => bookService.add(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS })
      toast.success('Book added successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BookFormData }) => bookService.update(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOK(id) })
      toast.success('Book updated successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bookService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS })
      toast.success('Book deleted successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
