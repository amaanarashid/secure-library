import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { borrowService } from '@/services/borrowing/borrowService'
import type { BorrowFilters } from '@/types'
import { QUERY_KEYS } from '@/constants'

export function useMyBorrows(filters: BorrowFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.MY_BORROWS, filters],
    queryFn:  () => borrowService.getMyBorrows(filters),
  })
}

export function useAllBorrows(filters: BorrowFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.BORROW_RECORDS, filters],
    queryFn:  () => borrowService.getAllBorrows(filters),
  })
}

export function useOverdueBooks() {
  return useQuery({
    queryKey: QUERY_KEYS.OVERDUE_BOOKS,
    queryFn:  () => borrowService.getOverdueBooks(),
  })
}

export function useBorrowBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookId: string) => borrowService.borrowBook(bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_BORROWS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS })
      toast.success('Book borrowed successfully! Due in 14 days.')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useReturnBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) => borrowService.returnBook(recordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.MY_BORROWS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BORROW_RECORDS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.OVERDUE_BOOKS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS })
      toast.success('Book returned successfully!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
