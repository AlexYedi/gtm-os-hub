import { test, expect } from 'bun:test'
import {
  mapIntersection,
  mapMovement,
  mapTrendLabel,
  getPublicTopicIntelligence,
  keepLatestAsOf,
  EMPTY_TOPIC_INTEL,
} from './topic-intelligence'
import { assertPublicSafe } from '../public-safety'

// ---- pure mappers ---------------------------------------------------------

test('mapIntersection maps a real row through faithfully', () => {
  const out = mapIntersection({
    theme_a: 'Agent Orchestration',
    theme_b: 'Evals & Benchmarks',
    cooccurrence_event_count: 42,
    bridge_person_count: 4,
    is_new_pair: true,
    intersection_score: 0.87,
    as_of_date: '2026-07-17',
  })
  expect(out.themeA).toBe('Agent Orchestration')
  expect(out.themeB).toBe('Evals & Benchmarks')
  expect(out.cooccurrenceEventCount).toBe(42)
  expect(out.bridgePersonCount).toBe(4)
  expect(out.isNewPair).toBe(true)
  expect(out.intersectionScore).toBe(0.87)
})

test('false-zero guard: zero COUNTS collapse to null, but a real score of 0 is kept', () => {
  const out = mapIntersection({
    theme_a: 'A',
    theme_b: 'B',
    cooccurrence_event_count: 0,
    bridge_person_count: 0,
    is_new_pair: false,
    intersection_score: 0, // a genuine measured 0 — NOT a false zero, must survive
  })
  expect(out.cooccurrenceEventCount).toBe(null)
  expect(out.bridgePersonCount).toBe(null)
  expect(out.intersectionScore).toBe(0)
})

test('mapMovement maps a real row and normalises the trend label', () => {
  const out = mapMovement({
    theme: 'Dev Tooling',
    event_count: 128,
    distinct_speaker_count: 12,
    momentum: 1.4,
    trend_label: 'Rising',
    is_low_confidence: true,
  })
  expect(out.theme).toBe('Dev Tooling')
  expect(out.eventCount).toBe(128)
  expect(out.distinctSpeakerCount).toBe(12)
  expect(out.momentum).toBe(1.4)
  expect(out.trendLabel).toBe('rising')
  expect(out.isLowConfidence).toBe(true)
})

test('mapMovement zero counts collapse to null (false-zero guard)', () => {
  const out = mapMovement({ theme: 'X', event_count: 0, distinct_speaker_count: 0, momentum: null })
  expect(out.eventCount).toBe(null)
  expect(out.distinctSpeakerCount).toBe(null)
  expect(out.momentum).toBe(null)
})

// ---- closed trend vocabulary ---------------------------------------------

test('mapTrendLabel accepts known labels case-insensitively', () => {
  expect(mapTrendLabel('rising')).toBe('rising')
  expect(mapTrendLabel('  FALLING ')).toBe('falling')
  expect(mapTrendLabel('Emerging')).toBe('emerging')
})

test('mapTrendLabel folds unknown/absent labels to the safe default (steady)', () => {
  expect(mapTrendLabel('surging-uncharted')).toBe('steady')
  expect(mapTrendLabel('')).toBe('steady')
  expect(mapTrendLabel(null)).toBe('steady')
  expect(mapTrendLabel(undefined)).toBe('steady')
})

test('mapTrendLabel translates the gtm-os upstream vocabulary to the public vocabulary (YED-130)', () => {
  expect(mapTrendLabel('heating')).toBe('rising')
  expect(mapTrendLabel('cooling')).toBe('falling')
  expect(mapTrendLabel('steady')).toBe('steady')
  expect(mapTrendLabel('new')).toBe('new')
  expect(mapTrendLabel('INSUFFICIENT_DATA')).toBe('steady') // caveat rides on isLowConfidence
})

// ---- snapshot filter (YED-249) -------------------------------------------

test('keepLatestAsOf keeps only the latest-date rows from a two-date fixture (movement shape)', () => {
  const rows = [
    { theme: 'Agent Orchestration', event_count: 40, as_of_date: '2026-10-29' },
    { theme: 'Evals & Benchmarks', event_count: 21, as_of_date: '2026-10-29' },
    { theme: 'Agent Orchestration', event_count: 33, as_of_date: '2026-10-30' }, // nightly append
    { theme: 'Evals & Benchmarks', event_count: 25, as_of_date: '2026-10-30' },
    { theme: 'Dev Tooling', event_count: 12, as_of_date: '2026-10-30' },
  ]
  const out = keepLatestAsOf(rows)
  expect(out).toHaveLength(3)
  expect(out.every((r) => r.as_of_date === '2026-10-30')).toBe(true)
  expect(out.map((r) => r.theme).sort()).toEqual([
    'Agent Orchestration',
    'Dev Tooling',
    'Evals & Benchmarks',
  ])
})

test('keepLatestAsOf keeps only the latest-date rows (intersections shape)', () => {
  const rows = [
    { theme_a: 'A', theme_b: 'B', intersection_score: 0.9, as_of_date: '2026-10-28' },
    { theme_a: 'A', theme_b: 'B', intersection_score: 0.87, as_of_date: '2026-10-30' },
    { theme_a: 'C', theme_b: 'D', intersection_score: 0.5, as_of_date: '2026-10-29' },
  ]
  const out = keepLatestAsOf(rows)
  expect(out).toHaveLength(1)
  expect(out[0].intersection_score).toBe(0.87)
})

test('keepLatestAsOf keeps ALL rows when every row has a null date', () => {
  const rows = [
    { theme: 'A', event_count: 3, as_of_date: null },
    { theme: 'B', event_count: 2, as_of_date: null },
    { theme: 'C', event_count: 1 },
  ]
  expect(keepLatestAsOf(rows)).toHaveLength(3)
})

test('keepLatestAsOf drops undated rows once a dated snapshot exists (stale residue)', () => {
  const rows = [
    { theme: 'A', event_count: 3, as_of_date: null },
    { theme: 'B', event_count: 2, as_of_date: '2026-10-30' },
  ]
  const out = keepLatestAsOf(rows)
  expect(out).toHaveLength(1)
  expect(out[0].theme).toBe('B')
})

test('keepLatestAsOf returns an empty array unchanged (honest-empty stays empty)', () => {
  expect(keepLatestAsOf([])).toEqual([])
})

// ---- honest-empty ---------------------------------------------------------

test('getPublicTopicIntelligence returns honest-empty when there is no read path (no env)', async () => {
  delete process.env.MI_SUPABASE_URL
  delete process.env.MI_SUPABASE_ANON_KEY
  delete process.env.SPINE_SUPABASE_URL
  delete process.env.SPINE_SUPABASE_ANON_KEY
  const out = await getPublicTopicIntelligence()
  expect(out).toEqual(EMPTY_TOPIC_INTEL)
})

// ---- egress gate ----------------------------------------------------------

test('assertPublicSafe passes the empty payload', () => {
  expect(() => assertPublicSafe(EMPTY_TOPIC_INTEL, 'topic-intel')).not.toThrow()
})

test('the egress net BLOCKS a payload if PII ever reaches a theme field (email pattern)', () => {
  const leak = {
    ...EMPTY_TOPIC_INTEL,
    intersections: [
      mapIntersection({ theme_a: 'contact jane@acme.com', theme_b: 'B', intersection_score: 1 }),
    ],
  }
  expect(() => assertPublicSafe(leak, 'topic-intel leak')).toThrow(/egress blocked/i)
})

test('the egress net BLOCKS a denylisted confidential term in a theme field', () => {
  const prev = process.env.PII_DENYLIST
  process.env.PII_DENYLIST = 'Umbrella Corp'
  try {
    const leak = {
      ...EMPTY_TOPIC_INTEL,
      movement: [mapMovement({ theme: 'GTM at Umbrella Corp', event_count: 5, trend_label: 'new' })],
    }
    expect(() => assertPublicSafe(leak, 'topic-intel denylist')).toThrow(/egress blocked/i)
  } finally {
    if (prev === undefined) delete process.env.PII_DENYLIST
    else process.env.PII_DENYLIST = prev
  }
})
