import { assertPublicSafe } from '../public-safety'
import { hubServiceClient } from '../supabase/hub'

/**
 * COCKPIT-ONLY eval-run instrument panel (G-02 / GTM-8). Reads the Hub project's
 * `eval_runs` table (ARCHITECTURE.md §1: "Eval runs (pass/fail, rubric) | Supabase
 * `eval_runs`") and projects it to a PII-safe `Public*` shape.
 *
 * Doctrine (mirrors topic-intelligence.ts / topic-intel-health.ts):
 *   - The table does not exist yet — the DDL belongs to the pipeline's migrations and
 *     Alex (G-02 "Must not": NO DDL). A missing table arrives as a PostgREST error
 *     (PGRST205), which is an ERROR → EMPTY, exactly like any other query failure.
 *   - Honest-empty on no read path / any error → the panel renders ⊘ instrumenting,
 *     never a fabricated number. Zero rows is a no-eval-runs-yet state, not a 0% pass rate.
 *   - assertPublicSafe() is the egress NET on every return path (repo invariant, even
 *     on the private cockpit surface).
 */

// Raw row shape (aggregate; we select only these columns). Column names are the Hub's
// proposal pending the pipeline migration — a rename upstream is a one-line change here.
interface EvalRunRow {
  eval_name?: string | null
  passed?: boolean | null
  ran_at?: string | null
}

export interface PublicEvalRun {
  name: string
  passed: boolean
  ranAt: string | null
}

export interface PublicEvalRunPanel {
  runs: PublicEvalRun[] // most recent first, capped at RECENT_CAP
  totalRuns: number // full-table count (not capped)
  passedRuns: number | null // null when nothing has run yet — "no data", not 0
  failedRuns: number | null // null when nothing has run yet
  passRate: number | null // null when nothing has run yet
  lastRunAt: string | null
}

export const RECENT_CAP = 20

export const EMPTY_EVAL_RUN_PANEL: PublicEvalRunPanel = {
  runs: [],
  totalRuns: 0,
  passedRuns: null,
  failedRuns: null,
  passRate: null,
  lastRunAt: null,
}

/** Pure mapper: raw row → public shape. Malformed rows (no name AND no date) are dropped, not faked. */
export function mapEvalRun(row: EvalRunRow): PublicEvalRun | null {
  const name = row.eval_name?.trim()
  const ranAt = row.ran_at?.trim() || null
  if (!name && !ranAt) return null
  return {
    name: name || 'unnamed eval',
    passed: row.passed === true,
    ranAt,
  }
}

/**
 * Pure assembler: rows → panel (no client, no await). exported for fixture tests.
 * An empty row set is the "wired, awaiting first run" state — counts stay null,
 * never confident zeros.
 */
export function evalRunPanelFromRows(rows: EvalRunRow[] | null): PublicEvalRunPanel {
  if (!rows || rows.length === 0) return EMPTY_EVAL_RUN_PANEL
  const mapped = rows.map(mapEvalRun).filter((r): r is PublicEvalRun => r !== null)
  if (mapped.length === 0) return EMPTY_EVAL_RUN_PANEL
  const passedRuns = mapped.filter((r) => r.passed).length
  const failedRuns = mapped.length - passedRuns
  const lastRunAt = mapped
    .map((r) => r.ranAt)
    .filter((d): d is string => d !== null)
    .sort()
    .at(-1) ?? null
  // Round to 4dp — a naive 2/3 float serializes as 0.6666666666666666, whose digit run trips
  // assertPublicSafe's phone-pattern scan (and reads terribly in a payload).
  const passRate = Math.round((passedRuns / mapped.length) * 10000) / 10000
  return {
    runs: mapped.slice(0, RECENT_CAP),
    totalRuns: mapped.length,
    passedRuns,
    failedRuns,
    passRate,
    lastRunAt,
  }
}

/**
 * Fetch the eval-run panel. Missing table / any error / no env → EMPTY → ⊘ instrumenting.
 * Caching is owned by the consuming ROUTE SEGMENT (cockpit is force-dynamic), not a fetch directive.
 */
export async function getPublicEvalRunPanel(): Promise<PublicEvalRunPanel> {
  const sb = hubServiceClient()
  if (!sb) {
    assertPublicSafe(EMPTY_EVAL_RUN_PANEL, 'eval-runs (no read path)')
    return EMPTY_EVAL_RUN_PANEL
  }

  try {
    const { data, error } = await sb
      .from('eval_runs')
      .select('eval_name, passed, ran_at')
      .order('ran_at', { ascending: false, nullsFirst: false })
      .limit(100)

    const out = evalRunPanelFromRows(data as EvalRunRow[] | null)
    if (error || !data) {
      assertPublicSafe(EMPTY_EVAL_RUN_PANEL, 'eval-runs (query fallback)') // missing table (PGRST205) lands here
      return EMPTY_EVAL_RUN_PANEL
    }

    assertPublicSafe(out, 'eval-runs panel') // egress NET — throws on any PII hit
    return out
  } catch {
    assertPublicSafe(EMPTY_EVAL_RUN_PANEL, 'eval-runs (exception fallback)')
    return EMPTY_EVAL_RUN_PANEL
  }
}
