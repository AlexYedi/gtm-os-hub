import { test, expect } from 'bun:test'
import {
  deriveHealthStatus,
  mapHealthTripwire,
  bySeverity,
  getCockpitTopicIntelHealth,
  type CockpitHealthTripwire,
} from './topic-intel-health'
import { assertPublicSafe } from '../public-safety'

// ---- deriveHealthStatus — exact parity with the view's SQL CASE (migration 0013) ----

test('deriveHealthStatus: metric > threshold trips', () => {
  expect(deriveHealthStatus(96, 5)).toBe('trip') // canonicalization_backlog live value
  expect(deriveHealthStatus(1.0, 0.4)).toBe('trip') // granularity_insufficient live value
})

test('deriveHealthStatus: metric in the top quartile of threshold watches', () => {
  expect(deriveHealthStatus(0.181, 0.2)).toBe('watch') // granularity_occupancy live value
  expect(deriveHealthStatus(0.75, 1.0)).toBe('watch') // exactly 0.75·thr is the watch floor
})

test('deriveHealthStatus: below the watch floor is ok', () => {
  expect(deriveHealthStatus(3.0, 10)).toBe('ok') // bridge_inflation live value
  expect(deriveHealthStatus(0.106, 0.15)).toBe('ok') // membership_confidence live value
  expect(deriveHealthStatus(0, 1)).toBe('ok') // runtime_snapshot_gap live value — a real 0 is healthy
})

test('deriveHealthStatus: null metric is no_data, never a fabricated 0', () => {
  expect(deriveHealthStatus(null, 5)).toBe('no_data')
  expect(deriveHealthStatus(undefined, 5)).toBe('no_data')
})

// ---- mapHealthTripwire ----

const REAL_ROW = {
  tripwire: 'bridge_inflation',
  decision: 'B',
  metric: 3.0,
  threshold: 10.0,
  description: 'worst bridge:co-occurrence ratio',
  status: 'ok', // informational — the mapper derives its own
}

test('mapHealthTripwire maps a real view row faithfully', () => {
  const out = mapHealthTripwire(REAL_ROW)
  expect(out).toEqual({
    tripwire: 'bridge_inflation',
    decision: 'B',
    metric: 3.0,
    threshold: 10.0,
    description: 'worst bridge:co-occurrence ratio',
    status: 'ok',
  })
})

test('mapHealthTripwire derives status from metric+threshold, not the status column', () => {
  // A stale/lying status column cannot flip the render.
  const out = mapHealthTripwire({ ...REAL_ROW, status: 'ok' })
  expect(out?.status).toBe('ok')
  const tripped = mapHealthTripwire({ ...REAL_ROW, metric: 99, status: 'ok' })
  expect(tripped?.status).toBe('trip')
})

test('mapHealthTripwire tolerates numeric-as-string wire form', () => {
  const out = mapHealthTripwire({ ...REAL_ROW, metric: '3.00', threshold: '10.000' })
  expect(out?.metric).toBe(3.0)
  expect(out?.threshold).toBe(10.0)
})

test('mapHealthTripwire drops malformed rows instead of faking them', () => {
  expect(mapHealthTripwire({ ...REAL_ROW, tripwire: '  ' })).toBe(null)
  expect(mapHealthTripwire({ ...REAL_ROW, threshold: null })).toBe(null)
  // An unparseable metric degrades to no_data — the view's own null-metric semantics — not a drop.
  expect(mapHealthTripwire({ ...REAL_ROW, metric: 'not-a-number' })?.status).toBe('no_data')
  expect(mapHealthTripwire({ ...REAL_ROW, metric: null })?.status).toBe('no_data')
})

// ---- bySeverity ----

function tw(status: CockpitHealthTripwire['status'], tripwire: string): CockpitHealthTripwire {
  return {
    tripwire,
    decision: '',
    metric: status === 'no_data' ? null : 1,
    threshold: 1,
    description: '',
    status,
  }
}

test('bySeverity: trip < watch < ok < no_data, stable within a group', () => {
  const rows = [tw('no_data', 'd'), tw('ok', 'c'), tw('trip', 'b'), tw('watch', 'a'), tw('trip', 'e')]
  const sorted = [...rows].sort(bySeverity).map((r) => r.tripwire)
  expect(sorted).toEqual(['b', 'e', 'a', 'c', 'd'])
})

// ---- egress guard on the payload ----

test('the cockpit health payload passes assertPublicSafe (counts/ratios, no PII)', () => {
  const payload = [
    mapHealthTripwire(REAL_ROW)!,
    mapHealthTripwire({
      tripwire: 'granularity_occupancy',
      decision: 'D2',
      metric: 0.181,
      threshold: 0.2,
      description: 'largest theme share of attended, theme-tagged events',
      status: 'watch',
    })!,
  ]
  expect(() => assertPublicSafe(payload, 'test: cockpit health')).not.toThrow()
})

// ---- honest-empty on no read path ----

test('getCockpitTopicIntelHealth returns null (instrumenting) when env is absent', async () => {
  const prevUrl = process.env.MI_SUPABASE_URL
  const prevKey = process.env.MI_SUPABASE_SERVICE_ROLE_KEY
  delete process.env.MI_SUPABASE_URL
  delete process.env.MI_SUPABASE_SERVICE_ROLE_KEY
  try {
    expect(await getCockpitTopicIntelHealth()).toBe(null)
  } finally {
    if (prevUrl !== undefined) process.env.MI_SUPABASE_URL = prevUrl
    if (prevKey !== undefined) process.env.MI_SUPABASE_SERVICE_ROLE_KEY = prevKey
  }
})
