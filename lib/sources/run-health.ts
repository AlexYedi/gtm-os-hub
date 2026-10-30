import { assertPublicSafe } from '../public-safety'
import { hubServiceClient } from '../supabase/hub'

/**
 * COCKPIT-ONLY run-health instrument panel (G-02 / GTM-8). Reads the Hub project's
 * `v_run_health` view (ARCHITECTURE.md §1: "Funnel · signal precision · run health |
 * Supabase") and projects it to a PII-safe `Public*` shape.
 *
 * Doctrine (mirrors topic-intelligence.ts / funnel.ts):
 *   - The view does not exist yet — the DDL belongs to the pipeline's migrations and Alex
 *     (G-02 "Must not": NO DDL). A missing view arrives as a PostgREST error (PGRST205),
 *     which is an ERROR → EMPTY, exactly like any other query failure.
 *   - Honest-empty on no read path / any error → the panel renders ⊘ instrumenting, never
 *     a fabricated state.
 *   - Pipeline names are pipeline-owned labels trimmed to strings; free text stays behind
 *     the assertPublicSafe() egress NET on every return path (repo invariant, even on cockpit).
 */

// Closed PUBLIC run-status vocabulary. Upstream free text is NOT passed through raw — anything
// unrecognised folds to 'unknown' (mapTrendLabel's closed-vocabulary analogue).
export type RunHealthStatus = 'ok' | 'failing' | 'stale' | 'running' | 'unknown'
const UPSTREAM_STATUS_MAP: Readonly<Record<string, RunHealthStatus>> = {
  ok: 'ok',
  healthy: 'ok',
  pass: 'ok',
  failing: 'failing',
  fail: 'failing',
  error: 'failing',
  stale: 'stale',
  overdue: 'stale',
  over_due: 'stale',
  running: 'running',
  in_progress: 'running',
}

export function mapRunHealthStatus(status: string | null | undefined): RunHealthStatus {
  const norm = (status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return UPSTREAM_STATUS_MAP[norm] ?? 'unknown'
}

// Raw row shape (aggregate; we select only these columns). Column names are the Hub's
// proposal pending the pipeline migration — a rename upstream is a one-line change here.
interface RunHealthRow {
  pipeline?: string | null
  status?: string | null
  last_run_at?: string | null
  last_success_at?: string | null
}

export interface PublicRunHealth {
  pipeline: string
  status: RunHealthStatus
  lastRunAt: string | null
  lastSuccessAt: string | null
}

export const EMPTY_RUN_HEALTH_PANEL: PublicRunHealth[] = []

/** Pure mapper: raw row → public shape. Rows with no pipeline name are dropped, not faked. */
export function mapRunHealth(row: RunHealthRow): PublicRunHealth | null {
  const pipeline = row.pipeline?.trim()
  if (!pipeline) return null
  return {
    pipeline,
    status: mapRunHealthStatus(row.status),
    lastRunAt: row.last_run_at?.trim() || null,
    lastSuccessAt: row.last_success_at?.trim() || null,
  }
}

/** Pure assembler: rows → panel (no client, no await). Exported for fixture tests. */
export function runHealthPanelFromRows(rows: RunHealthRow[] | null): PublicRunHealth[] {
  if (!rows || rows.length === 0) return EMPTY_RUN_HEALTH_PANEL
  return rows.map(mapRunHealth).filter((r): r is PublicRunHealth => r !== null)
}

/**
 * Fetch the run-health panel. Missing view / any error / no env → EMPTY → ⊘ instrumenting.
 * Caching is owned by the consuming ROUTE SEGMENT (cockpit is force-dynamic), not a fetch directive.
 */
export async function getPublicRunHealthPanel(): Promise<PublicRunHealth[]> {
  const sb = hubServiceClient()
  if (!sb) {
    assertPublicSafe(EMPTY_RUN_HEALTH_PANEL, 'run-health (no read path)')
    return EMPTY_RUN_HEALTH_PANEL
  }

  try {
    const { data, error } = await sb
      .from('v_run_health')
      .select('pipeline, status, last_run_at, last_success_at')
      .order('pipeline', { ascending: true })
      .limit(100)

    const out = runHealthPanelFromRows(data as RunHealthRow[] | null)
    if (error || !data) {
      assertPublicSafe(EMPTY_RUN_HEALTH_PANEL, 'run-health (query fallback)') // missing view (PGRST205) lands here
      return EMPTY_RUN_HEALTH_PANEL
    }

    assertPublicSafe(out, 'run-health panel') // egress NET — throws on any PII hit
    return out
  } catch {
    assertPublicSafe(EMPTY_RUN_HEALTH_PANEL, 'run-health (exception fallback)')
    return EMPTY_RUN_HEALTH_PANEL
  }
}
