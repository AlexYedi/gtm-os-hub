import { test, expect } from 'bun:test'
import {
  mapRunHealth,
  mapRunHealthStatus,
  runHealthPanelFromRows,
  getPublicRunHealthPanel,
  EMPTY_RUN_HEALTH_PANEL,
} from './run-health'
import { assertPublicSafe } from '../public-safety'

// ---- empty (missing view / no rows → EMPTY, never a fabricated state) ------

test('runHealthPanelFromRows: null data (missing view / any error) → EMPTY panel', () => {
  expect(runHealthPanelFromRows(null)).toEqual(EMPTY_RUN_HEALTH_PANEL)
})

test('runHealthPanelFromRows: zero rows → EMPTY panel', () => {
  expect(runHealthPanelFromRows([])).toEqual(EMPTY_RUN_HEALTH_PANEL)
})

test('getPublicRunHealthPanel returns honest-empty when there is no read path (no env)', async () => {
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  const out = await getPublicRunHealthPanel()
  expect(out).toEqual(EMPTY_RUN_HEALTH_PANEL)
})

// ---- closed status vocabulary ----------------------------------------------

test('mapRunHealthStatus translates the known upstream vocabulary (case/spacing-insensitive)', () => {
  expect(mapRunHealthStatus('ok')).toBe('ok')
  expect(mapRunHealthStatus('Healthy')).toBe('ok')
  expect(mapRunHealthStatus('FAILING')).toBe('failing')
  expect(mapRunHealthStatus('over-due')).toBe('stale')
  expect(mapRunHealthStatus('in progress')).toBe('running')
})

test('mapRunHealthStatus folds unknown/absent statuses to the safe default (unknown)', () => {
  expect(mapRunHealthStatus('detonated-uncharted')).toBe('unknown')
  expect(mapRunHealthStatus('')).toBe('unknown')
  expect(mapRunHealthStatus(null)).toBe('unknown')
})

// ---- populated fixture -----------------------------------------------------

test('runHealthPanelFromRows: populated fixture maps faithfully and passes the egress net', () => {
  const out = runHealthPanelFromRows([
    {
      pipeline: 'nightly topic compute',
      status: 'ok',
      last_run_at: '2026-10-30T06:00:00Z',
      last_success_at: '2026-10-30T06:00:00Z',
    },
    {
      pipeline: 'weekly digest',
      status: 'STALE',
      last_run_at: '2026-10-20T06:00:00Z',
      last_success_at: null,
    },
    { pipeline: 'signal precision scorer', status: 'some-new-upstream-state' }, // folds to unknown
  ])
  expect(out).toHaveLength(3)
  expect(out[0]).toEqual({
    pipeline: 'nightly topic compute',
    status: 'ok',
    lastRunAt: '2026-10-30T06:00:00Z',
    lastSuccessAt: '2026-10-30T06:00:00Z',
  })
  expect(out[1].status).toBe('stale')
  expect(out[1].lastSuccessAt).toBe(null)
  expect(out[2].status).toBe('unknown')
  expect(() => assertPublicSafe(out, 'run-health fixture')).not.toThrow()
})

test('mapRunHealth drops rows with no pipeline name (not faked as an unnamed pipeline)', () => {
  expect(mapRunHealth({ pipeline: null, status: 'ok' })).toBe(null)
  expect(mapRunHealth({ pipeline: '  x  ', status: null })).toEqual({
    pipeline: 'x',
    status: 'unknown',
    lastRunAt: null,
    lastSuccessAt: null,
  })
})
