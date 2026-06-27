import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — SERVER-ONLY.
 *
 * `import 'server-only'` makes importing this into a client bundle a BUILD ERROR.
 * This client bypasses RLS, so it is used in exactly two places, both trusted:
 *   1. the auth-gated cockpit Server Actions (every action re-checks auth first), and
 *   2. the `sync:curriculum` script.
 * The key is SECRET — never `NEXT_PUBLIC_`, never committed.
 */
export function admin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — required for cockpit writes + curriculum sync.',
    )
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
