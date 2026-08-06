import { assertPublicSafe } from '../public-safety'
import { spineClient } from '../supabase/spine'

/**
 * PUBLIC signal-spine stats — aggregate counts only, all nullable. In V1 this ships in the
 * HONEST-EMPTY state: the Hub has no read path to the (separate, possibly paused) spine
 * project, so every field is null and the map node renders INSTRUMENTING. When the cross-repo
 * `v_public_spine_stats` view + env land, the same adapter lights the node up — no hardcoded
 * numbers ever (never 396/59/452; any spine number before the live view exists is fabricated).
 */
export interface PublicSpineStats {
  entityCount: number | null
  eventCount: number | null
  signalCount: number | null
  lastSignalAt: string | null
}

// Raw row shape from v_public_spine_stats (aggregate; PII-free by construction).
interface SpineStatsRow {
  entity_count: number | null
  event_count: number | null
  signal_count: number | null
  last_signal_at: string | null
}

// Defensive false-zero guard (architect F1): if `security_invoker` + base-table RLS denies
// `anon`, `count(*)` silently returns 0 — NOT an error. Mapping 0 → null makes an RLS-shadowed
// read render INSTRUMENTING rather than a confident, fabricated "0".
function nullIfZero(n: number | null | undefined): number | null {
  return n == null || n === 0 ? null : n
}

export const EMPTY_SPINE: PublicSpineStats = {
  entityCount: null,
  eventCount: null,
  signalCount: null,
  lastSignalAt: null,
}

/** Pure mapper: raw view row → public stats, applying the false-zero guard. */
export function mapSpineStats(row: SpineStatsRow): PublicSpineStats {
  return {
    entityCount: nullIfZero(row.entity_count),
    eventCount: nullIfZero(row.event_count),
    signalCount: nullIfZero(row.signal_count),
    lastSignalAt: row.last_signal_at ?? null,
  }
}

/**
 * Fetch the public spine stats. Without SPINE_SUPABASE_* env (the V1 state) returns the
 * all-null EMPTY_SPINE → the node renders INSTRUMENTING. Any error also degrades to empty.
 * Every return path passes through assertPublicSafe.
 */
export async function getPublicSpineStats(): Promise<PublicSpineStats> {
  const sb = spineClient()
  if (!sb) {
    assertPublicSafe(EMPTY_SPINE, 'spine fixture (no read path yet)')
    return EMPTY_SPINE
  }

  const { data, error } = await sb
    .from('v_public_spine_stats')
    .select('entity_count, event_count, signal_count, last_signal_at')
    .maybeSingle()

  if (error || !data) {
    assertPublicSafe(EMPTY_SPINE, 'spine fixture (query fallback)')
    return EMPTY_SPINE
  }

  const out = mapSpineStats(data as SpineStatsRow)
  assertPublicSafe(out, 'spine public stats') // egress net
  return out
}
