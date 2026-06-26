import { useState } from 'react'
import { Users, UserX, UserCheck, ShieldAlert } from 'lucide-react'
import { useUsers, useChangeRole, useDisableUser, useEnableUser } from '@/hooks/useUsers'
import { Table, Pagination } from '@/components/ui/Table'
import { SearchBar } from '@/components/ui/SearchBar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/Modal'
import { formatDate, getRoleBadgeVariant } from '@/utils'
import { ROLE_LABELS, DEFAULT_PAGE_SIZE } from '@/constants'
import type { Profile, UserFilters } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: DEFAULT_PAGE_SIZE })
  const [search, setSearch] = useState('')
  const [actionTarget, setActionTarget] = useState<{ user: Profile; action: 'disable' | 'enable' | 'role'; role?: string } | null>(null)

  const { data, isLoading } = useUsers(filters)
  const changeRole  = useChangeRole()
  const disableUser = useDisableUser()
  const enableUser  = useEnableUser()

  const handleSearch = (val: string) => {
    setSearch(val)
    setFilters(f => ({ ...f, search: val, page: 1 }))
  }

  const handleAction = async () => {
    if (!actionTarget) return
    const { user, action, role } = actionTarget
    if (action === 'disable') await disableUser.mutateAsync(user.id)
    else if (action === 'enable') await enableUser.mutateAsync(user.id)
    else if (action === 'role' && role) await changeRole.mutateAsync({ userId: user.id, role })
    setActionTarget(null)
  }

  const columns = [
    {
      key: 'full_name', header: 'User',
      render: (row: Profile) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.full_name}
            {row.id === currentUser?.id && (
              <span className="ml-2 text-xs text-slate-400">(you)</span>
            )}
          </p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      )
    },
    {
      key: 'role', header: 'Role',
      render: (row: Profile) => (
        <div className="flex items-center gap-2">
          <Badge variant={getRoleBadgeVariant(row.role)}>
            {ROLE_LABELS[row.role]}
          </Badge>
          {row.id !== currentUser?.id && (
            <Select
              options={[
                { value: 'student',   label: 'Student' },
                { value: 'librarian', label: 'Librarian' },
                { value: 'admin',     label: 'Admin' },
              ]}
              value={row.role}
              onChange={e => setActionTarget({ user: row, action: 'role', role: e.target.value })}
              className="h-7 text-xs w-28 py-0"
            />
          )}
        </div>
      )
    },
    {
      key: 'is_active', header: 'Status',
      render: (row: Profile) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Active' : 'Disabled'}
        </Badge>
      )
    },
    {
      key: 'created_at', header: 'Joined',
      render: (row: Profile) => formatDate(row.created_at)
    },
    {
      key: 'actions', header: '',
      render: (row: Profile) => (
        row.id === currentUser?.id ? null : (
          <Button
            variant="ghost"
            size="sm"
            className={row.is_active ? 'text-danger-600 hover:bg-danger-50' : 'text-green-600 hover:bg-green-50'}
            onClick={() => setActionTarget({ user: row, action: row.is_active ? 'disable' : 'enable' })}
          >
            {row.is_active
              ? <><UserX className="h-3.5 w-3.5" /> Disable</>
              : <><UserCheck className="h-3.5 w-3.5" /> Enable</>}
          </Button>
        )
      )
    },
  ]

  const isPending = changeRole.isPending || disableUser.isPending || enableUser.isPending

  const confirmTitle = actionTarget?.action === 'disable' ? 'Disable user'
    : actionTarget?.action === 'enable' ? 'Enable user'
    : `Change role to ${actionTarget?.role}`

  const confirmDesc = actionTarget?.action === 'disable'
    ? `Disable ${actionTarget.user.full_name}? They won't be able to sign in.`
    : actionTarget?.action === 'enable'
    ? `Enable ${actionTarget.user.full_name}? They will regain access.`
    : `Change ${actionTarget?.user.full_name}'s role to ${actionTarget?.role}?`

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle mt-1">Manage library system users and permissions</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <ShieldAlert className="h-4 w-4" />
          Admin only — changes are audit logged
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Search by name or email…"
          className="flex-1"
        />
        <Select
          options={[
            { value: 'all',       label: 'All Roles' },
            { value: 'admin',     label: 'Admin' },
            { value: 'librarian', label: 'Librarian' },
            { value: 'student',   label: 'Student' },
          ]}
          value={filters.role ?? 'all'}
          onChange={e => setFilters(f => ({ ...f, role: e.target.value as UserFilters['role'], page: 1 }))}
          className="sm:w-40"
        />
      </div>

      <Table
        columns={columns}
        data={data?.data ?? []}
        keyExtractor={(row: Profile) => row.id}
        loading={isLoading}
        emptyMessage="No users found"
        emptyIcon={<Users className="h-8 w-8" />}
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

      <ConfirmModal
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={confirmTitle}
        description={confirmDesc}
        confirmVariant={actionTarget?.action === 'disable' ? 'danger' : 'primary'}
        confirmLabel="Confirm"
        loading={isPending}
      />
    </div>
  )
}
