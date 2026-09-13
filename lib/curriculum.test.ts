import { test, expect } from 'bun:test'
import { assertUniqueIds, assertPathCoverage, pathStages, allSubtasks, stageResources } from './curriculum'
import { curriculum } from '../content/curriculum'

// Content-as-code integrity. Unit ids are cross-table keys in Supabase, and the
// path must place every subtask exactly once so sequencing can never drop work.

// The v1 subtask ids (2026-06-27). Work is logged against these — never rename or remove.
const V1_SUBTASK_IDS = [
  'd1-deal-memo', 'd1-discovery-call', 'd1-exec-email', 'd1-cap-velocity-build',
  'd2-funnel-decomp', 'd2-capacity-model', 'd2-roe', 'd2-cap-build',
  'd3-orch-webhook-schema', 'd3-orch-idempotency', 'd3-sde-spine-scaffold', 'd3-sde-identity',
  'd3-sde-dedup', 'd3-sde-provenance', 'd3-sde-icp-attrs', 'd3-sde-score-model', 'd3-sde-waterfall',
  'd3-sde-reverse-etl', 'd3-act-outbound', 'd3-act-inbound', 'd3-act-ads', 'd3-stack-eval',
  'd3-stack-crm-model', 'd3-cap-1-signal-pipeline', 'd3-cap-2-outbound-engine', 'd3-cap-3-consulting-sim',
  'd4-mode-sql', 'd4-dbt-model', 'd4-metrics-dict', 'd4-cohort', 'd4-cap-build',
  'd5-prompt-craft', 'd5-eval-harness', 'd5-mcp-server', 'd5-agentic-system', 'd5-ce-pipeline', 'd5-cap-build',
  'd6-positioning-onepager', 'd6-battlecard', 'd6-narrative', 'd6-cap-build',
  'd7-msp', 'd7-health', 'd7-winloss', 'd7-cap-build',
  'd8-hard-things', 'd8-working-backwards',
  'd9-exec-brief', 'd9-scqa-rewrite', 'd9-cadence', 'd9-decision-journal', 'd9-weekly-review', 'd9-cap-build',
]

test('unit ids are unique', () => {
  expect(() => assertUniqueIds()).not.toThrow()
})

test('v1 subtask ids are preserved', () => {
  const ids = new Set(allSubtasks().map((r) => r.subtask.id))
  for (const id of V1_SUBTASK_IDS) expect(ids.has(id)).toBe(true)
})

test('every subtask sits in exactly one path stage', () => {
  expect(() => assertPathCoverage()).not.toThrow()
})

test('coverage check catches a dropped subtask', () => {
  const broken = {
    ...curriculum,
    path: curriculum.path.map((s, i) => (i === 1 ? { ...s, subtaskIds: s.subtaskIds.slice(1) } : s)),
  }
  expect(() => assertPathCoverage(broken)).toThrow(/missing from the path/)
})

test('coverage check catches a subtask placed twice', () => {
  const dup = curriculum.path[1].subtaskIds[0]
  const broken = {
    ...curriculum,
    path: curriculum.path.map((s, i) => (i === 2 ? { ...s, subtaskIds: [...s.subtaskIds, dup] } : s)),
  }
  expect(() => assertPathCoverage(broken)).toThrow(/two path stages/)
})

test('stage resources are https and de-duplicated', () => {
  for (const ref of pathStages()) {
    const urls = stageResources(ref).map((r) => r.url)
    expect(new Set(urls).size).toBe(urls.length)
    for (const u of urls) expect(u.startsWith('https://')).toBe(true)
  }
})
