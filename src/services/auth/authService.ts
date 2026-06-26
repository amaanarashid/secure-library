/**
 * Auth Service
 *
 * All authentication operations go through this service.
 * The UI layer NEVER calls supabase.auth directly — it always
 * goes through this service so we have a single, auditable
 * place to enforce security policies.
 */

import { supabase } from '@/lib/supabase'
import type { LoginInput, RegisterInput } from '@/types'
import { getErrorMessage } from '@/utils'

export const authService = {

  /**
   * Sign in with email and password.
   * Supabase handles bcrypt comparison on the server.
   * We never touch the password after this call.
   */
  async signIn(input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        // If remember_me is false, session will end when browser closes
        // Supabase handles this via its own session storage
      }
    })

    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  /**
   * Register a new account.
   * Email verification is required before the user can sign in
   * (configured in Supabase dashboard: Auth → Email → Confirm email).
   */
  async signUp(input: RegisterInput) {
    const { data, error } = await supabase.auth.signUp({
      email:    input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        data: {
          full_name: input.full_name.trim(),
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    })

    if (error) throw new Error(getErrorMessage(error))
    return data
  },

  /**
   * Send password reset email.
   * Supabase sends a secure reset link — we never generate tokens ourselves.
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    )
    if (error) throw new Error(getErrorMessage(error))
  },

  /**
   * Update password (called after user clicks reset link).
   * The user must have a valid recovery session from Supabase.
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(getErrorMessage(error))
  },

  /**
   * Sign out — clears the local session and calls Supabase to
   * invalidate the refresh token server-side.
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(getErrorMessage(error))
  },

  /**
   * Get the current session without triggering a network call.
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },
}
