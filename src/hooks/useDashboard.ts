import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard/dashboardService'
import { QUERY_KEYS } from '@/constants'

export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_STATS,
    queryFn:  dashboardService.getStats,
    staleTime: 60_000,
    refetchInterval: 120_000, // refresh every 2 min
  })
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RECENT_ACTIVITY, limit],
    queryFn:  () => dashboardService.getRecentActivity(limit),
    staleTime: 30_000,
  })
}
