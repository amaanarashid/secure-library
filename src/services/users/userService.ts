import { supabase } from '@/lib/supabase'
import type { Profile, UserFilters, PaginatedResult, UserPermissions } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { getErrorMessage } from '@/utils'
import type { CreateUserFormData } from '@/utils/validation'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRpc = (...args: any[]) => any

export const userService = {

  async search(filters: UserFilters = {}): Promise<PaginatedResult<Profile>> {
    const { search, role, is_active, page = 1, limit = DEFAULT_PAGE_SIZE } = filters

    const { data, error } = await (supabase.rpc as AnyRpc)('search_users', {
      p_search:    search || null,
      p_role:      role && role !== 'all' ? role : null,
      p_is_active: is_active === 'all' ? null : (is_active ?? null),
      p_limit:     limit,
      p_offset:    (page - 1) * limit,
    })

    if (error) throw new Error(getErrorMessage(error))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = data ?? []
    const total: number = rows[0]?.total_count ?? 0

    return {
      data:        rows as unknown as Profile[],
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    }
  },

  async getPermissions(): Promise<UserPermissions | null> {
    const { data, error } = await supabase.rpc('get_user_permissions')
    if (error) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.[0] as UserPermissions) ?? null
  },

  async changeRole(userId: string, newRole: string): Promise<void> {
    const { data, error } = await (supabase.rpc as AnyRpc)('change_user_role', {
      p_user_id: userId, p_new_role: newRole,
    })
    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to change role')
  },

  async disable(userId: string): Promise<void> {
    const { data, error } = await (supabase.rpc as AnyRpc)('disable_user', { p_user_id: userId })
    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to disable user')
  },

  async enable(userId: string): Promise<void> {
    const { data, error } = await (supabase.rpc as AnyRpc)('enable_user', { p_user_id: userId })
    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to enable user')
  },

  async createUser(_input: CreateUserFormData): Promise<void> {
    // User creation goes through Supabase Admin API — in a real deployment
    // this would be a Supabase Edge Function with the service_role key.
    throw new Error(
      'User creation requires a server-side Edge Function with the service_role key. ' +
      'Use the Supabase Dashboard → Authentication → Users → Add user for now.'
    )
  },
}
