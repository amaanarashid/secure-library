/**
 * Book Service
 *
 * All book operations use Supabase RPC (PostgreSQL functions).
 * Direct table writes are NEVER used for business operations —
 * only the DB functions can perform them, ensuring:
 *  - Permission checks happen inside the DB
 *  - Audit logs are created atomically with the operation
 *  - Stock counts stay consistent via transactions
 */

import { supabase } from '@/lib/supabase'
import type { BookFilters, PaginatedResult, Book } from '@/types'
import type { BookFormData } from '@/utils/validation'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { getErrorMessage } from '@/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRpc = (...args: any[]) => any

export const bookService = {

  async search(filters: BookFilters = {}): Promise<PaginatedResult<Book>> {
    const {
      search = '',
      category,
      status,
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
    } = filters

    const { data, error } = await (supabase.rpc as AnyRpc)('search_books', {
      p_search:         search || null,
      p_category:       category || null,
      p_available_only: status === 'available' ? true : null,
      p_limit:          limit,
      p_offset:         (page - 1) * limit,
    })

    if (error) throw new Error(getErrorMessage(error))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = data ?? []
    const total: number = rows[0]?.total_count ?? 0

    return {
      data:        rows as unknown as Book[],
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    }
  },

  async getById(id: string): Promise<Book | null> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Book
  },

  async add(input: BookFormData): Promise<string> {
    const { data, error } = await (supabase.rpc as AnyRpc)('add_book_secure', {
      p_title:       input.title.trim(),
      p_author:      input.author.trim(),
      p_isbn:        input.isbn?.trim() || null,
      p_category:    input.category,
      p_description: (input.description as string | undefined)?.trim() || null,
      p_quantity:    input.quantity,
    })

    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to add book')
    return result.book_id as string
  },

  async update(id: string, input: BookFormData): Promise<void> {
    const { data, error } = await (supabase.rpc as AnyRpc)('update_book_secure', {
      p_book_id:     id,
      p_title:       input.title.trim(),
      p_author:      input.author.trim(),
      p_isbn:        input.isbn?.trim() || null,
      p_category:    input.category,
      p_description: (input.description as string | undefined)?.trim() || null,
      p_quantity:    input.quantity,
    })

    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to update book')
  },

  async delete(id: string): Promise<void> {
    const { data, error } = await (supabase.rpc as AnyRpc)('delete_book_secure', {
      p_book_id: id,
    })

    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to delete book')
  },
}
