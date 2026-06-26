import { supabase } from '@/lib/supabase'
import type { AuditLog, AuditFilters, PaginatedResult } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { getErrorMessage } from '@/utils'

export const auditService = {

  async search(filters: AuditFilters = {}): Promise<PaginatedResult<AuditLog>> {
    const { action, user_id, date_from, date_to, page = 1, limit = DEFAULT_PAGE_SIZE } = filters
    const from = (page - 1) * limit
    const to   = from + limit - 1

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:profiles(id, full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (action && action !== 'all') query = query.eq('action', action)
    if (user_id)   query = query.eq('user_id', user_id)
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to)   query = query.lte('created_at', date_to + 'T23:59:59Z')

    const { data, error, count } = await query
    if (error) throw new Error(getErrorMessage(error))

    return {
      data:        (data ?? []) as unknown as AuditLog[],
      total:       count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    }
  },

  async exportCSV(filters: AuditFilters = {}): Promise<string> {
    const { action, user_id, date_from, date_to } = filters

    let query = supabase
      .from('audit_logs')
      .select(`*, user:profiles(full_name, email)`)
      .order('created_at', { ascending: false })
      .limit(10000)

    if (action && action !== 'all') query = query.eq('action', action)
    if (user_id)   query = query.eq('user_id', user_id)
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to)   query = query.lte('created_at', date_to + 'T23:59:59Z')

    const { data, error } = await query
    if (error) throw new Error(getErrorMessage(error))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = data ?? []
    const headers = ['ID', 'Timestamp', 'Action', 'User', 'Email', 'Description', 'IP Address']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const csvRows = rows.map((r: any) => [
      r.id,
      r.created_at,
      r.action,
      (r as any).user?.full_name ?? '',
      (r as any).user?.email ?? '',
      `"${r.description.replace(/"/g, '""')}"`,
      r.ip_address ?? '',
    ].join(','))

    return [headers.join(','), ...csvRows].join('\n')
  },
}
