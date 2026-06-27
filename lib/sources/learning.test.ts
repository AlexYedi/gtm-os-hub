import { test, expect } from 'bun:test'
import { mapSubmission, mapProgress } from './learning'
import { assertPublicSafe } from '../public-safety'

// The CI egress gate for the learning adapter — the analogue of public-safety.test.ts
// for the GitHub adapter. Dependency-free (no DB): proves the PII contract on the mappers.

test('mapSubmission never exposes body_md', () => {
  const out = mapSubmission({
    unit_id: 'd3-sde-spine-scaffold',
    kind: 'project',
    title: 'My work',
    public_summary: 'A clean summary',
    artifact_url: 'https://github.com/x/y',
    submitted_on: '2026-06-27',
  })
  expect('body' in out).toBe(false)
  expect((out as Record<string, unknown>).body_md).toBeUndefined()
  expect(out.summary).toBe('A clean summary')
})

test('mapSubmission scrubs PII that sneaks into title/summary', () => {
  const out = mapSubmission({
    unit_id: 'u',
    kind: 'exercise',
    title: 'ping alex.e.yedi@gmail.com',
    public_summary: 'see linkedin.com/in/alexyedi for details',
    artifact_url: null,
    submitted_on: '2026-06-27',
  })
  expect(out.title).not.toContain('@gmail.com')
  expect(out.summary).not.toContain('linkedin.com')
})

test('mapProgress coerces nulls to zero', () => {
  const p = mapProgress({ unit_id: 'u', level: 'module', subtasks_total: null, subtasks_done: null, pct_done: null })
  expect(p.subtasksTotal).toBe(0)
  expect(p.subtasksDone).toBe(0)
  expect(p.pctDone).toBe(0)
})

test('assertPublicSafe passes a clean mapped payload', () => {
  const payload = {
    progress: [mapProgress({ unit_id: 'd3', level: 'area', subtasks_total: 8, subtasks_done: 1, pct_done: 13 })],
    submissions: [
      mapSubmission({
        unit_id: 'u', kind: 'project', title: 'Clean title',
        public_summary: 'A safe public summary', artifact_url: null, submitted_on: '2026-06-27',
      }),
    ],
  }
  expect(() => assertPublicSafe(payload, 'clean payload')).not.toThrow()
})

test('assertPublicSafe throws if raw PII reaches a public payload (simulated leak)', () => {
  const leaked = {
    submissions: [
      { unitId: 'u', kind: 'project', title: 'x', summary: 'email me at boss@acme.com', artifactUrl: null, submittedOn: '2026-06-27' },
    ],
  }
  expect(() => assertPublicSafe(leaked, 'simulated leak')).toThrow(/egress blocked/i)
})
