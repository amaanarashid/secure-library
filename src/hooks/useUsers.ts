import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userService } from '@/services/users/userService'
import type { UserFilters } from '@/types'
import { QUERY_KEYS } from '@/constants'

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.USERS, filters],
    queryFn:  () => userService.search(filters),
  })
}

export function useUserPermissions() {
  return useQuery({
    queryKey: QUERY_KEYS.USER_PERMISSIONS,
    queryFn:  userService.getPermissions,
    staleTime: 300_000, // permissions rarely change mid-session
  })
}

export function useChangeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      userService.changeRole(userId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS })
      toast.success('User role updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDisableUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => userService.disable(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS })
      toast.success('User disabled')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useEnableUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => userService.enable(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS })
      toast.success('User enabled')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
