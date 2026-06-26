/**
 * Borrow Service
 *
 * Borrow / return operations are entirely handled by PostgreSQL RPC functions.
 * The database ensures atomicity: decrementing stock and creating the borrow
 * record happen in a single transaction — no partial states are possible.
 */

import { supabase } from '@/lib/supabase'
import type { BorrowRecord, BorrowFilters, PaginatedResult } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { getErrorMessage } from '@/utils'

export const borrowService = {

  async borrowBook(bookId: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('borrow_book', { p_book_id: bookId })
    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to borrow book')
    return result.record_id as string
  },

  async returnBook(recordId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('return_book', { p_record_id: recordId })
    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to return book')
  },

  async getMyBorrows(filters: BorrowFilters = {}): Promise<PaginatedResult<BorrowRecord>> {
    const { status, page = 1, limit = DEFAULT_PAGE_SIZE } = filters
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = supabase
      .from('borrow_records')
      .select(`
        *,
        book:books(id, title, author, isbn),
        user:profiles(id, full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw new Error(getErrorMessage(error))

    return {
      data:        (data ?? []) as unknown as BorrowRecord[],
      total:       count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    }
  },

  async getAllBorrows(filters: BorrowFilters = {}): Promise<PaginatedResult<BorrowRecord>> {
    const { status, user_id, page = 1, limit = DEFAULT_PAGE_SIZE } = filters
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = supabase
      .from('borrow_records')
      .select(`
        *,
        book:books(id, title, author, isbn),
        user:profiles(id, full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status && status !== 'all') query = query.eq('status', status)
    if (user_id) query = query.eq('user_id', user_id)

    const { data, error, count } = await query
    if (error) throw new Error(getErrorMessage(error))

    return {
      data:        (data ?? []) as unknown as BorrowRecord[],
      total:       count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    }
  },

  async getOverdueBooks() {
    const { data, error } = await supabase.rpc('get_overdue_books')
    if (error) throw new Error(getErrorMessage(error))
    return data ?? []
  },
}
