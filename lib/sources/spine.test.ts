import { test, expect } from 'bun:test'
import { mapSpineStats, getPublicSpineStats, EMPTY_SPINE } from './spine'
import { assertPublicSafe } from '../public-safety'

// The false-zero guard is the load-bearing contract here (architect F1): an RLS-shadowed
// count(*) returns 0, not an error, so a naive adapter would publish a fabricated confident
// "0". Mapping 0 → null makes it render INSTRUMENTING instead.

test('mapSpineStats maps a real non-zero row through faithfully', () => {
  const out = mapSpineStats({
    entity_count: 396,
    event_count: 452,
    signal_count: 59,
    last_signal_at: '2026-07-01T00:00:00Z',
  })
  expect(out.entityCount).toBe(396)
  expect(out.signalCount).toBe(59)
  expect(out.lastSignalAt).toBe('2026-07-01T00:00:00Z')
})

test('zero counts collapse to null (false-zero guard, not a fabricated 0)', () => {
  const out = mapSpineStats({ entity_count: 0, event_count: 0, signal_count: 0, last_signal_at: null })
  expect(out.entityCount).toBe(null)
  expect(out.eventCount).toBe(null)
  expect(out.signalCount).toBe(null)
  expect(out.lastSignalAt).toBe(null)
})

test('null counts stay null', () => {
  const out = mapSpineStats({ entity_count: null, event_count: null, signal_count: null, last_signal_at: null })
  expect(out).toEqual(EMPTY_SPINE)
})

test('getPublicSpineStats returns honest-empty when no read path (no env)', async () => {
  delete process.env.SPINE_SUPABASE_URL
  delete process.env.SPINE_SUPABASE_ANON_KEY
  const out = await getPublicSpineStats()
  expect(out).toEqual(EMPTY_SPINE)
})

test('assertPublicSafe passes the empty spine payload', () => {
  expect(() => assertPublicSafe(EMPTY_SPINE, 'spine')).not.toThrow()
})
