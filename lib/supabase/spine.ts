import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Anon/publishable Supabase client for the SIGNAL SPINE project.
 *
 * The spine (`Signal_Pipeline_Analytical_Spine`) is a SEPARATE Supabase project from
 * GTM_OS_HUB — different URL, different key — so it needs its own factory rather than
 * reusing lib/supabase/public.ts (which is hardwired to the Hub project).
 *
 * Reads only the aggregate `public.v_public_spine_stats` view (no rows, no PII); the
 * anon key's confidentiality rests on that view grant + base-table RLS, NOT the env
 * prefix. Kept server-side (the read is in a Server Component) since the browser has no
 * reason to hold it. NEVER put the spine service_role key in the Hub.
 *
 * Returns `null` when env is absent — which is the V1 state: the Hub has no read path to
 * the (separate, possibly idle-paused) spine yet, so the adapter degrades to honest-empty.
 */
export function spineClient(): SupabaseClient | null {
  const url = process.env.SPINE_SUPABASE_URL
  const key = process.env.SPINE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
