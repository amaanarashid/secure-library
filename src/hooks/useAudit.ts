import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/audit/auditService'
import type { AuditFilters } from '@/types'
import { QUERY_KEYS } from '@/constants'

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.AUDIT_LOGS, filters],
    queryFn:  () => auditService.search(filters),
  })
}
