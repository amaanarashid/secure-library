/**
 * Supabase Client Configuration
 *
 * Security decisions:
 * - Credentials loaded from environment variables only (never hardcoded)
 * - Auth persistence set to 'local' (localStorage) with session refresh
 * - detectSessionInUrl enabled to handle magic links / OAuth callbacks
 * - autoRefreshToken ensures tokens are rotated before expiry
 *
 * The anon key is safe to expose on the frontend — it grants no access
 * beyond what Row Level Security policies allow. The service_role key
 * MUST NEVER be used on the client.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[SecureLib] Missing Supabase environment variables.\n' +
    'Copy .env.example to .env and fill in your project credentials.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'securelib-auth-token',
  },
})

export default supabase
