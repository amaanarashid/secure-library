import { supabase } from '@/lib/supabase'
import type { DashboardStats, RecentActivity } from '@/types'
import { getErrorMessage } from '@/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRpc = (...args: any[]) => any

export const dashboardService = {

  async getStats(): Promise<DashboardStats> {
    const { data, error } = await supabase.rpc('get_dashboard_stats')
    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.[0] ?? {}) as DashboardStats
  },

  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    const { data, error } = await (supabase.rpc as AnyRpc)('get_recent_activity', { p_limit: limit })
    if (error) throw new Error(getErrorMessage(error))
    return ((data as unknown) ?? []) as RecentActivity[]
  },
}
