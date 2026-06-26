import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRpc = (...args: any[]) => any

export const profileService = {

  async updateProfile(fullName: string): Promise<void> {
    const { data, error } = await (supabase.rpc as AnyRpc)('update_profile_secure', {
      p_full_name: fullName.trim(),
    })
    if (error) throw new Error(getErrorMessage(error))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (data as any)?.[0]
    if (!result?.success) throw new Error(result?.message ?? 'Failed to update profile')
  },

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(getErrorMessage(error))
  },
}
