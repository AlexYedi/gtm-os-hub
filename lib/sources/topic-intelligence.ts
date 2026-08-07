import { assertPublicSafe } from '../public-safety'
import { spineClient } from '../supabase/spine'

/**
 * PUBLIC topic-intelligence — the render behind /signal. Reads the spine's `signal_read` anon views
 * (`v_topic_movement`, `v_topic_intersections`) and projects them to PII-safe `Public*` types.
 *
 * Doctrine (mirrors spine.ts / linear.ts):
 *   - PII omitted at the TYPE level (primary control): bridge data is a COUNT only. There is
 *     deliberately NO field carrying a person's name — `v_bridge_people` (service_role only) is never
 *     read here, and the anon key can't reach it. Counts, themes, scores; never names.
 *   - Free text (trend_label) is mapped through a CLOSED vocabulary, never passed through raw
 *     (github.ts KIND_LABELS analogue).
 *   - Honest-empty on no read path / any error → the surface renders INSTRUMENTING, never a
 *     fabricated number. `signal_read` isn't in the spine's exposed schemas yet, so today every
 *     path returns EMPTY_TOPIC_INTEL — the same code lights up unchanged once the toggle + env land.
 *   - assertPublicSafe() is the egress NET on every return path.
 */

// Closed trend vocabulary. gtm-os computes trend_label upstream; we normalise + validate against
// this allowlist so no upstream free text can reach the surface. Unknown → 'steady' (safe default,
// mirroring linear.ts mapState). RECONCILE this set against live output in Phase 4 verification.
export type PublicTrendLabel = 'rising' | 'falling' | 'steady' | 'emerging' | 'new' | 'dormant'
const TREND_LABELS: readonly PublicTrendLabel[] = [
  'rising',
  'falling',
  'steady',
  'emerging',
  'new',
  'dormant',
]

export interface PublicTopicIntersection {
  themeA: string
  themeB: string
  cooccurrenceEventCount: number | null
  bridgePersonCount: number | null // COUNT only — never names (v_bridge_people is service_role only)
  isNewPair: boolean
  intersectionScore: number | null
}

export interface PublicTopicMovement {
  theme: string
  eventCount: number | null
  distinctSpeakerCount: number | null
  momentum: number | null
  trendLabel: PublicTrendLabel
  isLowConfidence: boolean
}

export interface PublicTopicIntelligence {
  intersections: PublicTopicIntersection[] // all_time window, ranked by score desc
  movement: PublicTopicMovement[] // 30 themes, ranked by event_count desc
  asOfDate: string | null
}

// Raw row shapes (aggregate; PII-free by construction — we select only these columns).
interface IntersectionRow {
  theme_a?: string | null
  theme_b?: string | null
  cooccurrence_event_count?: number | null
  bridge_person_count?: number | null
  is_new_pair?: boolean | null
  intersection_score?: number | null
  as_of_date?: string | null
}
interface MovementRow {
  theme?: string | null
  event_count?: number | null
  distinct_speaker_count?: number | null
  momentum?: number | null
  trend_label?: string | null
  is_low_confidence?: boolean | null
  as_of_date?: string | null
}

export const EMPTY_TOPIC_INTEL: PublicTopicIntelligence = {
  intersections: [],
  movement: [],
  asOfDate: null,
}

// Defensive false-zero guard (spine.ts F1): if security_invoker + base-table RLS denies anon,
// count(*) silently returns 0 — not an error. Mapping 0 → null makes an RLS-shadowed read render
// INSTRUMENTING rather than a confident, fabricated "0". Applied to COUNTS only, never to scores
// (a real intersection_score of 0 is meaningful) — scores keep their value, only null stays null.
function nullIfZero(n: number | null | undefined): number | null {
  return n == null || n === 0 ? null : n
}
function numOrNull(n: number | null | undefined): number | null {
  return n == null ? null : n
}

/** Normalise an upstream trend_label to the closed vocabulary. Unknown/absent → 'steady'. */
export function mapTrendLabel(label: string | null | undefined): PublicTrendLabel {
  const norm = (label ?? '').trim().toLowerCase()
  return (TREND_LABELS as readonly string[]).includes(norm) ? (norm as PublicTrendLabel) : 'steady'
}

/** Pure mapper: raw intersection row → public shape. Counts pass the false-zero guard. */
export function mapIntersection(row: IntersectionRow): PublicTopicIntersection {
  return {
    themeA: row.theme_a ?? '',
    themeB: row.theme_b ?? '',
    cooccurrenceEventCount: nullIfZero(row.cooccurrence_event_count),
    bridgePersonCount: nullIfZero(row.bridge_person_count),
    isNewPair: row.is_new_pair === true,
    intersectionScore: numOrNull(row.intersection_score),
  }
}

/** Pure mapper: raw movement row → public shape. trend_label mapped to the closed vocabulary. */
export function mapMovement(row: MovementRow): PublicTopicMovement {
  return {
    theme: row.theme ?? '',
    eventCount: nullIfZero(row.event_count),
    distinctSpeakerCount: nullIfZero(row.distinct_speaker_count),
    momentum: numOrNull(row.momentum),
    trendLabel: mapTrendLabel(row.trend_label),
    isLowConfidence: row.is_low_confidence === true,
  }
}

/** Latest as_of_date across all rows (ISO sorts lexically). */
function latestAsOf(rows: Array<{ as_of_date?: string | null }>): string | null {
  let latest: string | null = null
  for (const r of rows) {
    const d = r.as_of_date ?? null
    if (d && (latest === null || d > latest)) latest = d
  }
  return latest
}

/**
 * Fetch the public topic-intelligence payload. Without a spine read path (no env, or `signal_read`
 * not yet in exposed schemas → the query errors/returns nothing) returns EMPTY_TOPIC_INTEL → the
 * surface renders INSTRUMENTING. Any error on either view degrades the WHOLE payload to empty rather
 * than shipping a half-populated (and therefore misleading) render. Every path passes assertPublicSafe.
 *
 * Caching is owned by the consuming ROUTE SEGMENT (`export const revalidate`), not a fetch directive.
 */
export async function getPublicTopicIntelligence(): Promise<PublicTopicIntelligence> {
  const sb = spineClient()
  if (!sb) {
    assertPublicSafe(EMPTY_TOPIC_INTEL, 'topic-intel (no read path yet)')
    return EMPTY_TOPIC_INTEL
  }

  try {
    // signal_read schema (anon-granted, PII-free). all_time is the rich window today; the trend
    // windows (week/month) are near-empty until the corpus advances — surfaced honestly in the UI.
    const [ix, mv] = await Promise.all([
      sb
        .schema('signal_read')
        .from('v_topic_intersections')
        .select(
          'theme_a, theme_b, cooccurrence_event_count, bridge_person_count, is_new_pair, intersection_score, as_of_date',
        )
        .eq('window_type', 'all_time')
        .order('intersection_score', { ascending: false, nullsFirst: false }),
      sb
        .schema('signal_read')
        .from('v_topic_movement')
        .select(
          'theme, event_count, distinct_speaker_count, momentum, trend_label, is_low_confidence, as_of_date',
        )
        .eq('window_type', 'all_time')
        .order('event_count', { ascending: false, nullsFirst: false }),
    ])

    if (ix.error || mv.error || !ix.data || !mv.data) {
      assertPublicSafe(EMPTY_TOPIC_INTEL, 'topic-intel (query fallback)')
      return EMPTY_TOPIC_INTEL
    }

    const ixRows = ix.data as IntersectionRow[]
    const mvRows = mv.data as MovementRow[]

    const out: PublicTopicIntelligence = {
      intersections: ixRows.map(mapIntersection),
      movement: mvRows.map(mapMovement),
      asOfDate: latestAsOf([...ixRows, ...mvRows]),
    }
    assertPublicSafe(out, 'topic-intel public payload') // egress NET — throws on any PII hit
    return out
  } catch {
    assertPublicSafe(EMPTY_TOPIC_INTEL, 'topic-intel (exception fallback)')
    return EMPTY_TOPIC_INTEL
  }
}
