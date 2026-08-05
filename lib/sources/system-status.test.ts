import { test, expect } from 'bun:test'
import { buildStatusMap, type StatusParts } from './system-status'
import { NODES } from '../../content/system-map'
import { assertPublicSafe } from '../public-safety'
import { FIXTURE_ROADMAP } from './linear'
import { EMPTY_SPINE } from './spine'

// Egress test against the PURE assembler (mirrors learning.test.ts testing the mapper, not the
// async fetcher). Asserts: instrumenting nodes carry metric:null; a clean payload passes the
// gate; an injected leaking blurb/metric throws.

const EMPTY_PARTS: StatusParts = {
  commits: [],
  roadmap: FIXTURE_ROADMAP,
  linearConfigured: false,
  university: null,
  spine: EMPTY_SPINE,
  deploy: { env: null, sha: null },
}

test('empty parts → data sources instrumenting with metric:null; notion planned', () => {
  const m = buildStatusMap(EMPTY_PARTS)
  for (const id of ['github', 'linear', 'learning', 'university', 'spine']) {
    expect(m[id].status).toBe('instrumenting')
    expect(m[id].metric).toBe(null)
  }
  expect(m.notion.status).toBe('planned')
  expect(m.notion.metric).toBe(null)
  // Live-by-construction nodes still carry a (non-fabricated) metric.
  expect(m.hub.status).toBe('live')
  expect(m['egress-gate'].status).toBe('live')
})

test('every topology node has a status entry (no orphan nodes)', () => {
  const m = buildStatusMap(EMPTY_PARTS)
  for (const n of NODES) expect(m[n.id]).toBeDefined()
})

test('live parts derive real metrics, never hardcoded', () => {
  const m = buildStatusMap({
    ...EMPTY_PARTS,
    commits: [{ sha: 'abc1234', kind: 'Feature', date: '2026-07-01T00:00:00Z', url: 'https://x/y' }],
    linearConfigured: true,
    roadmap: { counts: { backlog: 5, planned: 1, in_progress: 3, done: 9 }, total: 18, lastUpdatedAt: '2026-07-01T00:00:00Z' },
    spine: { entityCount: 396, eventCount: 452, signalCount: 59, lastSignalAt: '2026-07-01T00:00:00Z' },
  })
  expect(m.github.status).toBe('live')
  expect(m.github.metric).toContain('Feature')
  expect(m.linear.status).toBe('live')
  expect(m.linear.metric).toContain('3 in flight')
  expect(m.spine.status).toBe('live')
  expect(m.spine.metric).toContain('59')
})

test('a clean assembled payload passes assertPublicSafe', () => {
  const payload = { nodes: NODES, status: buildStatusMap(EMPTY_PARTS) }
  expect(() => assertPublicSafe(payload, 'system map')).not.toThrow()
})

test('an injected leaking blurb throws at the gate', () => {
  const leakedNodes = [...NODES, { id: 'x', label: 'x', kind: 'source', blurb: 'ping boss@acme.com', source: 'x', x: 0, y: 0 }]
  const payload = { nodes: leakedNodes, status: buildStatusMap(EMPTY_PARTS) }
  expect(() => assertPublicSafe(payload, 'system map leak')).toThrow(/egress blocked/i)
})

test('an injected leaking metric throws at the gate', () => {
  const status = buildStatusMap(EMPTY_PARTS)
  status.github = { status: 'live', metric: 'contact boss@acme.com' }
  expect(() => assertPublicSafe({ nodes: NODES, status }, 'system map metric leak')).toThrow(/egress blocked/i)
})
