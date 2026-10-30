import { test, expect } from 'bun:test'
import {
  mapEvalRun,
  evalRunPanelFromRows,
  getPublicEvalRunPanel,
  EMPTY_EVAL_RUN_PANEL,
  RECENT_CAP,
} from './eval-runs'
import { assertPublicSafe } from '../public-safety'

// ---- empty (missing table / no rows → EMPTY, never a fabricated number) ----

test('evalRunPanelFromRows: null data (missing table / any error) → EMPTY panel', () => {
  // PostgREST returns error + null data for a PGRST205 missing-table read; the adapter
  // contract folds that into the same honest-empty as zero rows.
  expect(evalRunPanelFromRows(null)).toEqual(EMPTY_EVAL_RUN_PANEL)
})

test('evalRunPanelFromRows: zero rows → EMPTY panel with null counts (not 0% pass rate)', () => {
  const out = evalRunPanelFromRows([])
  expect(out).toEqual(EMPTY_EVAL_RUN_PANEL)
  expect(out.passedRuns).toBe(null)
  expect(out.passRate).toBe(null)
})

test('evalRunPanelFromRows: all-malformed rows → EMPTY panel', () => {
  expect(evalRunPanelFromRows([{ eval_name: null, passed: null, ran_at: null }])).toEqual(
    EMPTY_EVAL_RUN_PANEL,
  )
})

test('getPublicEvalRunPanel returns honest-empty when there is no read path (no env)', async () => {
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  const out = await getPublicEvalRunPanel()
  expect(out).toEqual(EMPTY_EVAL_RUN_PANEL)
})

// ---- populated fixture -----------------------------------------------------

test('evalRunPanelFromRows: populated fixture maps faithfully and passes the egress net', () => {
  const out = evalRunPanelFromRows([
    { eval_name: 'interview-prep-dossier rubric', passed: true, ran_at: '2026-10-30T08:00:00Z' },
    { eval_name: 'signal-precision spot check', passed: false, ran_at: '2026-10-30T09:00:00Z' },
    { eval_name: 'role-radar ICP scoring', passed: true, ran_at: '2026-10-29T22:00:00Z' },
  ])
  expect(out.totalRuns).toBe(3)
  expect(out.passedRuns).toBe(2)
  expect(out.failedRuns).toBe(1)
  expect(out.passRate).toBeCloseTo(2 / 3)
  expect(out.lastRunAt).toBe('2026-10-30T09:00:00Z')
  expect(out.runs).toHaveLength(3) // under the cap, order preserved (newest first upstream)
  expect(() => assertPublicSafe(out, 'eval-runs fixture')).not.toThrow()
})

test('evalRunPanelFromRows caps the recent-runs list at RECENT_CAP while counting all rows', () => {
  const rows = Array.from({ length: RECENT_CAP + 5 }, (_, i) => ({
    eval_name: `eval-${i}`,
    passed: true,
    ran_at: `2026-10-30T${String(i % 24).padStart(2, '0')}:00:00Z`,
  }))
  const out = evalRunPanelFromRows(rows)
  expect(out.totalRuns).toBe(RECENT_CAP + 5)
  expect(out.runs).toHaveLength(RECENT_CAP)
})

// ---- mapper ----------------------------------------------------------------

test('mapEvalRun keeps a nameless-but-dated row (labelled, not faked) and drops fully empty rows', () => {
  expect(mapEvalRun({ eval_name: null, passed: true, ran_at: '2026-10-30T08:00:00Z' })).toEqual({
    name: 'unnamed eval',
    passed: true,
    ranAt: '2026-10-30T08:00:00Z',
  })
  expect(mapEvalRun({ eval_name: '  x  ', passed: null, ran_at: '' })).toEqual({
    name: 'x',
    passed: false,
    ranAt: null,
  })
})
