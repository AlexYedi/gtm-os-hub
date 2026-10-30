import { assertPublicSafe } from '../public-safety'
import { hubServiceClient } from '../supabase/hub'

/**
 * COCKPIT-ONLY funnel instrument panel (G-02 / GTM-8). Reads the Hub project's `v_funnel`
 * view (ARCHITECTURE.md §1: "Funnel · signal precision · run health | Supabase") and
 * projects it to a PII-safe `Public*` shape.
 *
 * Doctrine (mirrors topic-intelligence.ts / eval-runs.ts):
 *   - The view does not exist yet — the DDL belongs to the pipeline's migrations and Alex
 *     (G-02 "Must not": NO DDL). A missing view arrives as a PostgREST error (PGRST205),
 *     which is an ERROR → EMPTY, exactly like any other query failure.
 *   - Honest-empty on no read path / any error → the panel renders ⊘ instrumenting, never
 *     a fabricated number. A real measured count of 0 is kept (service-role read, no
 *     RLS-shadow risk — unlike the topic-intelligence anon counts).
 *   - Stage names are pipeline-owned labels trimmed to strings; free text stays behind the
 *     assertPublicSafe() egress NET on every return path (repo invariant, even on cockpit).
 */

// Raw row shape (aggregate; we select only these columns). Column names are the Hub's
// proposal pending the pipeline migration — a rename upstream is a one-line change here.
interface FunnelRow {
  stage?: string | null
  entity_count?: number | string | null
  as_of_date?: string | null
}

export interface PublicFunnelStage {
  stage: string
  count: number | null
  asOfDate: string | null
}

export const EMPTY_FUNNEL_PANEL: PublicFunnelStage[] = []

// PostgREST serialises `numeric` as a number, but tolerate string form defensively
// (topic-intel-health num() analogue).
function num(v: number | string | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Pure mapper: raw row → public shape. Rows with no stage label are dropped, not faked. */
export function mapFunnelStage(row: FunnelRow): PublicFunnelStage | null {
  const stage = row.stage?.trim()
  if (!stage) return null
  return {
    stage,
    count: num(row.entity_count),
    asOfDate: row.as_of_date?.trim() || null,
  }
}

/** Pure assembler: rows → panel (no client, no await). Exported for fixture tests. */
export function funnelPanelFromRows(rows: FunnelRow[] | null): PublicFunnelStage[] {
  if (!rows || rows.length === 0) return EMPTY_FUNNEL_PANEL
  return rows.map(mapFunnelStage).filter((s): s is PublicFunnelStage => s !== null)
}

/**
 * Fetch the funnel panel. Missing view / any error / no env → EMPTY → ⊘ instrumenting.
 * Caching is owned by the consuming ROUTE SEGMENT (cockpit is force-dynamic), not a fetch directive.
 */
export async function getPublicFunnelPanel(): Promise<PublicFunnelStage[]> {
  const sb = hubServiceClient()
  if (!sb) {
    assertPublicSafe(EMPTY_FUNNEL_PANEL, 'funnel (no read path)')
    return EMPTY_FUNNEL_PANEL
  }

  try {
    const { data, error } = await sb
      .from('v_funnel')
      .select('stage, entity_count, as_of_date')
      .order('entity_count', { ascending: false, nullsFirst: false })
      .limit(100)

    const out = funnelPanelFromRows(data as FunnelRow[] | null)
    if (error || !data) {
      assertPublicSafe(EMPTY_FUNNEL_PANEL, 'funnel (query fallback)') // missing view (PGRST205) lands here
      return EMPTY_FUNNEL_PANEL
    }

    assertPublicSafe(out, 'funnel panel') // egress NET — throws on any PII hit
    return out
  } catch {
    assertPublicSafe(EMPTY_FUNNEL_PANEL, 'funnel (exception fallback)')
    return EMPTY_FUNNEL_PANEL
  }
}
