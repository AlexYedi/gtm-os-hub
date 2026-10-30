import { test, expect } from 'bun:test'
import {
  mapSignalPrecision,
  signalPrecisionPanelFromRows,
  getPublicSignalPrecisionPanel,
  EMPTY_SIGNAL_PRECISION_PANEL,
} from './signal-precision'
import { assertPublicSafe } from '../public-safety'

// ---- empty (missing view / no rows → EMPTY, never a fabricated number) -----

test('signalPrecisionPanelFromRows: null data (missing view / any error) → EMPTY panel', () => {
  expect(signalPrecisionPanelFromRows(null)).toEqual(EMPTY_SIGNAL_PRECISION_PANEL)
})

test('signalPrecisionPanelFromRows: zero rows → EMPTY panel', () => {
  expect(signalPrecisionPanelFromRows([])).toEqual(EMPTY_SIGNAL_PRECISION_PANEL)
})

test('getPublicSignalPrecisionPanel returns honest-empty when there is no read path (no env)', async () => {
  delete process.env.SUPABASE_URL
  delete process.env.SUPABASE_SERVICE_ROLE_KEY
  const out = await getPublicSignalPrecisionPanel()
  expect(out).toEqual(EMPTY_SIGNAL_PRECISION_PANEL)
})

// ---- populated fixture -----------------------------------------------------

test('signalPrecisionPanelFromRows: populated fixture maps faithfully and passes the egress net', () => {
  const out = signalPrecisionPanelFromRows([
    {
      signal_name: 'hiring spike',
      detected_count: 12,
      true_positive_count: 9,
      precision: 0.75,
      as_of_date: '2026-10-30',
    },
    {
      signal_name: 'funding round',
      detected_count: 0,
      true_positive_count: 0,
      precision: 0, // genuine measured 0 is meaningful — kept, not collapsed
      as_of_date: '2026-10-30',
    },
    { signal_name: 'tech migration', detected_count: 3, precision: null }, // can't-say stays null
  ])
  expect(out).toHaveLength(3)
  expect(out[0]).toEqual({
    signal: 'hiring spike',
    detectedCount: 12,
    truePositiveCount: 9,
    precision: 0.75,
    asOfDate: '2026-10-30',
  })
  expect(out[1].precision).toBe(0)
  expect(out[2].precision).toBe(null)
  expect(() => assertPublicSafe(out, 'signal-precision fixture')).not.toThrow()
})

test('mapSignalPrecision drops rows with no signal name (not faked as an unnamed signal)', () => {
  expect(mapSignalPrecision({ signal_name: null, precision: 1 })).toBe(null)
  expect(mapSignalPrecision({ signal_name: '  x  ', precision: '0.5' })).toEqual({
    signal: 'x',
    detectedCount: null,
    truePositiveCount: null,
    precision: 0.5, // string-serialized numeric tolerated
    asOfDate: null,
  })
})
