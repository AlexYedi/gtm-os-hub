import { test, expect } from 'bun:test'
import {
  mapFunnelStage,
  funnelPanelFromRows,
  getPublicFunnelPanel,
  EMPTY_FUNNEL_PANEL,
} from './funnel'
import { assertPublicSafe } from '../public-safety'

// ---- empty (missing view / no rows → EMPTY, never a fabricated number) -----

test('funnelPanelFromRows: null data (missing view / any error) → EMPTY panel', () => {
  expect(funnelPanelFromRows(null)).toEqual(EMPTY_FUNNEL_PANEL)
})

test('funnelPanelFromRows: zero rows → EMPTY panel', () => {
  expect(funnelPanelFromRows([])).toEqual(EMPTY_FUNNEL_PANEL)
})

test('getPublicFunnelPanel returns honest-empty when there is no read path (no env)', async () => {
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  const out = await getPublicFunnelPanel()
  expect(out).toEqual(EMPTY_FUNNEL_PANEL)
})

// ---- populated fixture -----------------------------------------------------

test('funnelPanelFromRows: populated fixture maps faithfully and passes the egress net', () => {
  const out = funnelPanelFromRows([
    { stage: 'signal', entity_count: 120, as_of_date: '2026-10-30' },
    { stage: 'qualified', entity_count: 34, as_of_date: '2026-10-30' },
    { stage: 'conversation', entity_count: 0, as_of_date: '2026-10-30' }, // real measured 0 is kept
    { stage: 'paused', entity_count: null, as_of_date: null }, // can't-say stays null
  ])
  expect(out).toHaveLength(4)
  expect(out[0]).toEqual({ stage: 'signal', count: 120, asOfDate: '2026-10-30' })
  expect(out[2].count).toBe(0) // a genuine 0 survives — service-role read, no RLS shadow
  expect(out[3].count).toBe(null)
  expect(() => assertPublicSafe(out, 'funnel fixture')).not.toThrow()
})

test('mapFunnelStage drops rows with no stage label (not faked as an unnamed stage)', () => {
  expect(mapFunnelStage({ stage: '  ', entity_count: 5 })).toBe(null)
  expect(mapFunnelStage({ entity_count: 5 })).toBe(null)
})

test('funnel counts tolerate PostgREST string-serialized numerics', () => {
  const out = funnelPanelFromRows([{ stage: 'signal', entity_count: '42' }])
  expect(out[0].count).toBe(42)
})
