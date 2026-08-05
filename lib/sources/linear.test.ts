import { test, expect, afterEach } from 'bun:test'
import { buildSummary, mapState, getPublicRoadmap } from './linear'
import { assertPublicSafe } from '../public-safety'

// CI egress gate for the Linear adapter. Dependency-free (no network): exercises the pure
// mapper + aggregator + the assertPublicSafe gate. Per §5 the Linear proof tests the
// GATE/OMISSION (type-level absence of title/assignee/url), NOT scanner-dirtiness — raw
// Linear titles/names carry no email/phone/LinkedIn pattern, so the GitHub "raw-dirty /
// projection-clean" proof does not transfer here.

afterEach(() => {
  delete process.env.PII_DENYLIST
  delete process.env.LINEAR_API_KEY
})

// 1. Type-level omission — the highest-risk fields cannot exist on the public summary.
test('summary structurally omits title/assignee/description/url', () => {
  const out = buildSummary([{ state: { type: 'started' }, updatedAt: '2026-07-01T00:00:00Z' }])
  expect('title' in out).toBe(false)
  expect('assignee' in out).toBe(false)
  expect('description' in out).toBe(false)
  expect('url' in out).toBe(false)
  // Only the three safe keys exist.
  expect(Object.keys(out).sort()).toEqual(['counts', 'lastUpdatedAt', 'total'])
})

// 2. State comes from the closed enum (state.type), NEVER state.name (free text).
test('state.name free text never reaches the projection', () => {
  const node = {
    identifier: 'YED-1',
    state: { type: 'started', name: 'CONFIDENTIAL client demo' },
    updatedAt: '2026-07-01T00:00:00Z',
    title: 'Secret prospect ACME outreach',
  } as unknown as Parameters<typeof buildSummary>[0][number]
  const out = buildSummary([node])
  expect(out.counts.in_progress).toBe(1)
  const json = JSON.stringify(out)
  expect(json).not.toContain('CONFIDENTIAL')
  expect(json).not.toContain('ACME')
})

// 3. Unknown/new state.type → safe default 'planned'; canceled → dropped from counts.
test('unknown type folds to planned; canceled is dropped', () => {
  expect(mapState('some_future_type')).toBe('planned')
  expect(mapState('canceled')).toBe(null)
  const out = buildSummary([
    { state: { type: 'some_future_type' }, updatedAt: '2026-07-01T00:00:00Z' },
    { state: { type: 'canceled' }, updatedAt: '2026-07-02T00:00:00Z' },
  ])
  expect(out.counts.planned).toBe(1)
  expect(out.total).toBe(1) // canceled excluded from total too
})

// 4. triage folds to planned (documented behaviour, explicit).
test('triage folds to planned', () => {
  expect(mapState('triage')).toBe('planned')
  const out = buildSummary([{ state: { type: 'triage' }, updatedAt: '2026-07-01T00:00:00Z' }])
  expect(out.counts.planned).toBe(1)
})

// 5. Counts are label-independent and are REAL zeros, not fabricated.
test('counts are real; empty categories are true zeros', () => {
  const out = buildSummary([
    { state: { type: 'started' }, updatedAt: '2026-07-01T00:00:00Z' },
    { state: { type: 'started' }, updatedAt: '2026-07-03T00:00:00Z' },
    { state: { type: 'completed' }, updatedAt: '2026-07-02T00:00:00Z' },
  ])
  expect(out.counts.in_progress).toBe(2)
  expect(out.counts.done).toBe(1)
  expect(out.counts.backlog).toBe(0)
  expect(out.counts.planned).toBe(0)
  expect(out.total).toBe(3)
  expect(out.lastUpdatedAt).toBe('2026-07-03T00:00:00Z') // max over counted nodes
})

// 6. Empty fixture path — no key degrades to instrumenting, never fake counts.
test('missing LINEAR_API_KEY returns the honest empty fixture', async () => {
  delete process.env.LINEAR_API_KEY
  const out = await getPublicRoadmap()
  expect(out.total).toBe(0)
  expect(out.counts).toEqual({ backlog: 0, planned: 0, in_progress: 0, done: 0 })
  expect(out.lastUpdatedAt).toBe(null)
})

// 7. assertPublicSafe passes a clean summary.
test('assertPublicSafe passes a clean summary', () => {
  const out = buildSummary([{ state: { type: 'backlog' }, updatedAt: '2026-07-01T00:00:00Z' }])
  expect(() => assertPublicSafe(out, 'clean roadmap')).not.toThrow()
})

// 8. assertPublicSafe throws on a simulated leak (a raw title field that bypassed the type).
test('assertPublicSafe throws if a raw title with PII bypasses the type', () => {
  const leaked = {
    counts: { backlog: 0, planned: 0, in_progress: 1, done: 0 },
    total: 1,
    lastUpdatedAt: '2026-07-01T00:00:00Z',
    title: 'follow up with boss@acme.com', // must never exist — this is the simulated bypass
  }
  expect(() => assertPublicSafe(leaked, 'simulated leak')).toThrow(/egress blocked/i)
})

// 9. Denylist backstop — proves layer-3 catches a hypothetical layer-2 miss.
test('assertPublicSafe throws on a denylisted term (layer-3 backstop)', () => {
  process.env.PII_DENYLIST = 'Umbrella Corp'
  const leaked = {
    counts: { backlog: 0, planned: 0, in_progress: 0, done: 0 },
    total: 0,
    lastUpdatedAt: null,
    note: 'roadmap for Umbrella Corp',
  }
  expect(() => assertPublicSafe(leaked, 'denylist backstop')).toThrow(/egress blocked/i)
})
