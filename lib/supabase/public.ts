import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Anon/publishable Supabase client for PUBLIC reads.
 *
 * Only `public.v_public_*` views are granted to `anon` (RLS denies the base
 * `learning.*` tables), so this key is safe to use at render time. Returns
 * `null` when env is absent so the learning adapter can fall back to a fixture
 * (mirrors the GitHub adapter's no-token behaviour — the page always renders).
 */
export function publicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
