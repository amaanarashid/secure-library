/**
 * AuthContext
 *
 * Central source of truth for authentication state.
 *
 * Security decisions:
 * - Session state is sourced exclusively from Supabase (not localStorage directly)
 * - Profile (role, name) is fetched once after login and cached in context
 * - onAuthStateChange listener ensures the app reacts to token expiry, logout
 *   from other tabs, and Supabase session refresh events
 * - Session timeout is implemented via inactivity timer — resets on user events
 */

import {
  createContext, useContext, useEffect, useRef, useState, useCallback,
  type ReactNode
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'
import { SESSION_TIMEOUT_MS } from '@/constants'

interface AuthContextValue {
  session:     Session | null
  user:        User | null
  profile:     Profile | null
  role:        UserRole | null
  loading:     boolean
  signOut:     () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,  setSession]  = useState<Session | null>(null)
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch profile from DB ──────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Auth] Failed to fetch profile:', error.message)
      return
    }
    setProfile(data as Profile)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) {
      await fetchProfile(session.user.id)
    }
  }, [session, fetchProfile])

  // ── Session timeout (inactivity) ───────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      await supabase.auth.signOut()
    }, SESSION_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    if (!session) return
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }))
    resetInactivityTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [session, resetInactivityTimer])

  // ── Auth state listener ────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user.id) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user.id) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user:    session?.user ?? null,
        profile,
        role:    profile?.role ?? null,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
