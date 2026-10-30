import { assertPublicSafe } from '../public-safety'
import { hubServiceClient } from '../supabase/hub'

/**
 * COCKPIT-ONLY signal-precision instrument panel (G-02 / GTM-8). Reads the Hub project's
 * `v_signal_precision` view (ARCHITECTURE.md §1: "Funnel · signal precision · run health |
 * Supabase"; the curriculum's d10-th-signal-precision case — precision of public-signal
 * detectors against a labelled sample) and projects it to a PII-safe `Public*` shape.
 *
 * Doctrine (mirrors topic-intelligence.ts / funnel.ts):
 *   - The view does not exist yet — the DDL belongs to the pipeline's migrations and Alex
 *     (G-02 "Must not": NO DDL). A missing view arrives as a PostgREST error (PGRST205),
 *     which is an ERROR → EMPTY, exactly like any other query failure.
 *   - Honest-empty on no read path / any error → the panel renders ⊘ instrumenting, never
 *     a fabricated number. A real measured precision of 0 is kept (service-role read, no
 *     RLS-shadow risk — unlike the topic-intelligence anon counts).
 *   - Signal names are pipeline-owned labels trimmed to strings; free text stays behind the
 *     assertPublicSafe() egress NET on every return path (repo invariant, even on cockpit).
 */

// Raw row shape (aggregate; we select only these columns). Column names are the Hub's
// proposal pending the pipeline migration — a rename upstream is a one-line change here.
interface SignalPrecisionRow {
  signal_name?: string | null
  detected_count?: number | string | null
  true_positive_count?: number | string | null
  precision?: number | string | null
  as_of_date?: string | null
}

export interface PublicSignalPrecision {
  signal: string
  detectedCount: number | null
  truePositiveCount: number | null
  precision: number | null // 0–1; a genuine measured 0 is meaningful and kept
  asOfDate: string | null
}

export const EMPTY_SIGNAL_PRECISION_PANEL: PublicSignalPrecision[] = []

// PostgREST serialises `numeric` as a number, but tolerate string form defensively
// (topic-intel-health num() analogue).
function num(v: number | string | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Pure mapper: raw row → public shape. Rows with no signal name are dropped, not faked. */
export function mapSignalPrecision(row: SignalPrecisionRow): PublicSignalPrecision | null {
  const signal = row.signal_name?.trim()
  if (!signal) return null
  return {
    signal,
    detectedCount: num(row.detected_count),
    truePositiveCount: num(row.true_positive_count),
    precision: num(row.precision),
    asOfDate: row.as_of_date?.trim() || null,
  }
}

/** Pure assembler: rows → panel (no client, no await). Exported for fixture tests. */
export function signalPrecisionPanelFromRows(
  rows: SignalPrecisionRow[] | null,
): PublicSignalPrecision[] {
  if (!rows || rows.length === 0) return EMPTY_SIGNAL_PRECISION_PANEL
  return rows.map(mapSignalPrecision).filter((s): s is PublicSignalPrecision => s !== null)
}

/**
 * Fetch the signal-precision panel. Missing view / any error / no env → EMPTY → ⊘ instrumenting.
 * Caching is owned by the consuming ROUTE SEGMENT (cockpit is force-dynamic), not a fetch directive.
 */
export async function getPublicSignalPrecisionPanel(): Promise<PublicSignalPrecision[]> {
  const sb = hubServiceClient()
  if (!sb) {
    assertPublicSafe(EMPTY_SIGNAL_PRECISION_PANEL, 'signal-precision (no read path)')
    return EMPTY_SIGNAL_PRECISION_PANEL
  }

  try {
    const { data, error } = await sb
      .from('v_signal_precision')
      .select('signal_name, detected_count, true_positive_count, precision, as_of_date')
      .order('precision', { ascending: false, nullsFirst: false })
      .limit(100)

    const out = signalPrecisionPanelFromRows(data as SignalPrecisionRow[] | null)
    if (error || !data) {
      assertPublicSafe(EMPTY_SIGNAL_PRECISION_PANEL, 'signal-precision (query fallback)') // missing view (PGRST205) lands here
      return EMPTY_SIGNAL_PRECISION_PANEL
    }

    assertPublicSafe(out, 'signal-precision panel') // egress NET — throws on any PII hit
    return out
  } catch {
    assertPublicSafe(EMPTY_SIGNAL_PRECISION_PANEL, 'signal-precision (exception fallback)')
    return EMPTY_SIGNAL_PRECISION_PANEL
  }
}
