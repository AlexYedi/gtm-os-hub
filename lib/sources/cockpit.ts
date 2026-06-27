import 'server-only'
import { createClient } from '@supabase/supabase-js'

/** True when the service-role secret is configured (cockpit writes/pace need it). */
export function hasServiceKey(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function client() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

export interface Forecast {
  logged_hours: number | null
  velocity_hpc: number | null
  est_remaining_hours: number | null
  est_total_hours: number | null
  confidence_state: 'cold_start' | 'warming' | 'live'
}

export interface CockpitState {
  forecast: Forecast | null
  running: { unit_id: string; started_at: string } | null
  time_by_unit: Record<string, number>
  status_by_unit: Record<string, { status: string; level: string | null }>
}

/** Read the private pace state (cockpit only). Returns null if the service key is unset. */
export async function getCockpitState(): Promise<CockpitState | null> {
  if (!hasServiceKey()) return null
  const { data, error } = await client().rpc('uni_cockpit_state')
  if (error) throw new Error(`uni_cockpit_state: ${error.message}`)
  return data as CockpitState
}
