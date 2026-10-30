import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for the HUB project's V2 instrument panels (G-02) — server-side
 * only by convention.
 *
 * Returns `null` when env is absent — the V2 panels' permanent-without-secrets state —
 * so each adapter degrades to honest-empty (mirrors spineClient / topic-intel-health's
 * miClient). Never throws just for a missing read path; rendering is always allowed.
 */
export function hubServiceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
