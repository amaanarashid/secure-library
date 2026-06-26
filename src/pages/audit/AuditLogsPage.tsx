import { useState } from 'react'
import { FileText, Download } from 'lucide-react'
import { useAuditLogs } from '@/hooks/useAudit'
import { auditService } from '@/services/audit/auditService'
import { Table, Pagination } from '@/components/ui/Table'
import { SearchBar } from '@/components/ui/SearchBar'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatDateTime, AUDIT_ACTION_LABELS, SECURITY_AUDIT_ACTIONS } from '@/utils'
import type { AuditLog, AuditFilters, AuditAction } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import toast from 'react-hot-toast'
import { useState as useLocalState } from 'react'

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label })),
]

export function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, limit: DEFAULT_PAGE_SIZE })
  const [exporting, setExporting] = useState(false)
  const { data, isLoading } = useAuditLogs(filters)

  const handleExport = async () => {
    setExporting(true)
    try {
      const csv = await auditService.exportCSV(filters)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Audit logs exported')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const isSecurityEvent = (action: string): boolean =>
    SECURITY_AUDIT_ACTIONS.includes(action as AuditAction)

  const columns = [
    {
      key: 'created_at', header: 'Timestamp',
      render: (row: AuditLog) => (
        <span className="text-xs font-mono text-slate-600">{formatDateTime(row.created_at)}</span>
      )
    },
    {
      key: 'action', header: 'Action',
      render: (row: AuditLog) => (
        <Badge variant={isSecurityEvent(row.action) ? 'danger' : 'slate'}>
          {AUDIT_ACTION_LABELS[row.action as AuditAction] ?? row.action}
        </Badge>
      )
    },
    {
      key: 'user', header: 'User',
      render: (row: AuditLog) => (
        <div>
          <p className="text-sm text-slate-800">{(row as any).user?.full_name ?? 'System'}</p>
          <p className="text-xs text-slate-500">{(row as any).user?.email ?? ''}</p>
        </div>
      )
    },
    {
      key: 'description', header: 'Description',
      render: (row: AuditLog) => (
        <span className="text-sm text-slate-700">{row.description}</span>
      )
    },
    {
      key: 'ip_address', header: 'IP Address',
      render: (row: AuditLog) => (
        <span className="text-xs font-mono text-slate-500">{row.ip_address ?? '—'}</span>
      )
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle mt-1">Immutable record of all security events</p>
        </div>
        <Button variant="secondary" onClick={handleExport} loading={exporting}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <Select
          options={ACTION_OPTIONS}
          value={filters.action ?? 'all'}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value as AuditAction, page: 1 }))}
          className="sm:w-52"
        />
        <Input
          type="date"
          value={filters.date_from ?? ''}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value || undefined, page: 1 }))}
          className="sm:w-44"
          placeholder="From date"
        />
        <Input
          type="date"
          value={filters.date_to ?? ''}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value || undefined, page: 1 }))}
          className="sm:w-44"
          placeholder="To date"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        <FileText className="h-4 w-4 flex-shrink-0" />
        Audit logs are immutable — they cannot be edited or deleted. Records highlighted in red indicate security events.
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        keyExtractor={(row: AuditLog) => row.id}
        loading={isLoading}
        emptyMessage="No audit logs found"
        emptyIcon={<FileText className="h-8 w-8" />}
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
    </div>
  )
}
