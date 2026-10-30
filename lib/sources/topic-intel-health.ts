import { assertPublicSafe } from '../public-safety'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * COCKPIT-ONLY topic-intelligence health — the "V1 assumptions" tripwire strip (YED-122).
 * Reads `topic_intelligence.topic_intelligence_health` on the canonical MI graph
 * (migration 0013, security_invoker=on). The schema is NOT PostgREST-exposed, so the
 * ONLY read path is the service-role key — server-side, rendered solely behind the
 * auth-gated /cockpit surface. Never rendered on a public route; the anon path has no
 * grant and no exposure by design.
 *
 * Doctrine (mirrors topic-intelligence.ts):
 *   - Metrics are counts/ratios — zero PII — and every payload still passes
 *     assertPublicSafe() as the egress NET (repo invariant: every surface, public or not).
 *   - Status is derived in TypeScript from metric + threshold with EXACT parity to the
 *     view's SQL CASE (null → no_data, > thr → trip, >= 0.75·thr → watch, else ok), so the
 *     render stays correct even if the view's status column drifts across migrations.
 *   - Honest-empty on no read path / any error → the strip renders ⊘ instrumenting,
 *     never a fabricated number.
 *
 * Env: MI_SUPABASE_URL + MI_SUPABASE_SERVICE_ROLE_KEY (the MI graph's service_role key —
 * SECRET, never NEXT_PUBLIC_). Without them this returns null → instrumenting.
 */

// Closed status vocabulary — mirrors the view's SQL CASE exactly (migration 0013).
export type HealthStatus = 'ok' | 'watch' | 'trip' | 'no_data'

export interface CockpitHealthTripwire {
  tripwire: string
  decision: string
  metric: number | null
  threshold: number
  description: string
  status: HealthStatus
}

// Raw row shape from the view (values list — all columns nullable at the wire).
interface HealthRow {
  tripwire?: string | null
  decision?: string | null
  metric?: number | string | null
  threshold?: number | string | null
  description?: string | null
  status?: string | null
}

/** SQL parity with the view's status CASE. metric NULL → 'no_data' (can't say ≠ 0). */
export function deriveHealthStatus(
  metric: number | null | undefined,
  threshold: number,
): HealthStatus {
  if (metric == null) return 'no_data'
  if (metric > threshold) return 'trip'
  if (metric >= threshold * 0.75) return 'watch'
  return 'ok'
}

const SEVERITY: Readonly<Record<HealthStatus, number>> = {
  trip: 0,
  watch: 1,
  ok: 2,
  no_data: 3,
}

/** Pure mapper: raw view row → cockpit shape. Returns null for malformed rows (dropped, not faked). */
export function mapHealthTripwire(row: HealthRow): CockpitHealthTripwire | null {
  const tripwire = row.tripwire?.trim()
  if (!tripwire) return null
  const threshold = num(row.threshold)
  if (threshold == null) return null
  const metric = num(row.metric)
  return {
    tripwire,
    decision: row.decision?.trim() ?? '',
    metric,
    threshold,
    description: row.description?.trim() ?? '',
    status: deriveHealthStatus(metric, threshold),
  }
}

// PostgREST serialises `numeric` as a number, but tolerate string form defensively.
function num(v: number | string | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Trips first, then watch, ok, no_data; stable within a severity group. */
export function bySeverity(a: CockpitHealthTripwire, b: CockpitHealthTripwire): number {
  return SEVERITY[a.status] - SEVERITY[b.status]
}

function miClient(): SupabaseClient | null {
  const url = process.env.MI_SUPABASE_URL
  const key = process.env.MI_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Fetch the cockpit health strip. Returns null when the read path is unconfigured or any
 * query error occurs — the surface renders ⊘ instrumenting, never a fabricated state.
 */
export async function getCockpitTopicIntelHealth(): Promise<CockpitHealthTripwire[] | null> {
  const sb = miClient()
  if (!sb) return null

  try {
    const { data, error } = await sb
      .schema('topic_intelligence')
      .from('topic_intelligence_health')
      .select('tripwire, decision, metric, threshold, description, status')

    if (error || !data) return null

    const out = (data as HealthRow[])
      .map(mapHealthTripwire)
      .filter((t): t is CockpitHealthTripwire => t !== null)
      .sort(bySeverity)

    assertPublicSafe(out, 'cockpit topic-intel health payload') // egress NET on every return
    return out
  } catch {
    return null
  }
}
