import { assertPublicSafe } from '../public-safety'
import { formatDate } from '../format'
import { NODES, type SystemNode } from '../../content/system-map'
import { getPublicCommits, type PublicCommit } from './github'
import { getPublicRoadmap, type PublicRoadmapSummary } from './linear'
import { getPublicSpineStats, type PublicSpineStats } from './spine'
import { getPublicTopicIntelligence } from './topic-intelligence'
import { getPublicUniversity } from './learning'
import { toProgressMap, computeInsights } from '../university-view'

/**
 * Node status is a first-class HONESTY TAXONOMY, enforced here in the data layer, not in
 * prose (systems-lens leverage point):
 *   live         = adapter has a real read path AND returned data → carries a real metric
 *   instrumenting = wired, no data yet → metric is null, UI renders the INSTRUMENTING string
 *   planned      = not yet wired at all → metric null, UI renders '—'
 * A metric is only ever attached to a `live` node; instrumenting/planned carry metric:null so
 * no number can appear beside a node that hasn't measured anything.
 */
export type NodeStatus = 'live' | 'instrumenting' | 'planned'

export interface NodeState {
  status: NodeStatus
  metric: string | null
}
export type StatusMap = Record<string, NodeState>

export interface SystemStatus {
  nodes: SystemNode[]
  status: StatusMap
}

// Inputs to the PURE assembler — already-safe values fanned in from existing adapters.
export interface StatusParts {
  commits: PublicCommit[]
  roadmap: PublicRoadmapSummary
  linearConfigured: boolean
  university: { pctProgress: number; publicSubmissions: number; subtasksTotal: number } | null
  spine: PublicSpineStats
  topic: { themes: number; intersections: number } | null
  deploy: { env: string | null; sha: string | null }
}

const INSTRUMENTING_STATE: NodeState = { status: 'instrumenting', metric: null }
const PLANNED_STATE: NodeState = { status: 'planned', metric: null }
function liveState(metric: string): NodeState {
  return { status: 'live', metric }
}

/**
 * Pure assembler: safe parts → per-node status map. No I/O. Every metric is DERIVED from the
 * parts, never hardcoded (no 396/59/452, no stale "14 tests" literal). This is the tested core.
 */
export function buildStatusMap(p: StatusParts): StatusMap {
  return {
    github:
      p.commits.length > 0
        ? liveState(`${p.commits[0].kind} · ${formatDate(p.commits[0].date)}`)
        : INSTRUMENTING_STATE,

    // Live only when configured AND real counts came back; a keyed-but-empty read stays honest.
    linear:
      p.linearConfigured && p.roadmap.total > 0
        ? liveState(`${p.roadmap.counts.in_progress} in flight · ${p.roadmap.total} tracked`)
        : INSTRUMENTING_STATE,

    learning: p.university ? liveState(`${p.university.pctProgress}% complete`) : INSTRUMENTING_STATE,

    university: p.university
      ? liveState(`${p.university.publicSubmissions} shared · ${p.university.subtasksTotal} units`)
      : INSTRUMENTING_STATE,

    // Topic intelligence is the richest live read from the spine — prefer it. Falls back to raw
    // signal counts, then instrumenting. All derived, never hardcoded; empty → instrumenting.
    spine: p.topic
      ? liveState(`${p.topic.themes} themes · ${p.topic.intersections} pairs`)
      : p.spine.signalCount != null
        ? liveState(`${p.spine.signalCount} signals`)
        : INSTRUMENTING_STATE,

    // Live by construction (you are looking at it). No fabricated uptime — just where it runs.
    hub: liveState(
      p.deploy.env
        ? `${p.deploy.env}${p.deploy.sha ? ` · ${p.deploy.sha.slice(0, 7)}` : ''}`
        : 'local dev',
    ),

    // Live by construction; qualitative metric, never a stale test-count literal.
    'egress-gate': liveState('default-deny · enforced on every fetch'),

    public: liveState('serving / · /system'),

    notion: PLANNED_STATE,
  }
}

/**
 * Fan out to the already-safe source adapters, assemble the status map, and gate the WHOLE
 * public payload (nodes + status) once at the boundary. Each adapter already runs its own
 * assertPublicSafe; this is the belt over the suspenders. Degrades gracefully — a source that
 * returns nothing simply renders instrumenting.
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const [commits, roadmap, spine, topicIntel, uni] = await Promise.all([
    getPublicCommits(1).catch(() => [] as PublicCommit[]),
    getPublicRoadmap(),
    getPublicSpineStats(),
    getPublicTopicIntelligence(),
    getPublicUniversity(),
  ])

  // Live only when real rows came back; a keyed-but-empty read stays honest (instrumenting).
  const topic =
    topicIntel.movement.length > 0 || topicIntel.intersections.length > 0
      ? { themes: topicIntel.movement.length, intersections: topicIntel.intersections.length }
      : null

  const university =
    uni.progress.length > 0
      ? (() => {
          const insights = computeInsights(toProgressMap(uni.progress), uni.submissions.length)
          return {
            pctProgress: insights.pctProgress,
            publicSubmissions: insights.publicSubmissions,
            subtasksTotal: insights.subtasksTotal,
          }
        })()
      : null

  const status = buildStatusMap({
    commits,
    roadmap,
    linearConfigured: Boolean(process.env.LINEAR_API_KEY),
    university,
    spine,
    topic,
    deploy: {
      env: process.env.VERCEL_ENV ?? null,
      sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    },
  })

  const payload: SystemStatus = { nodes: NODES, status }
  assertPublicSafe(payload, 'system map') // gate nodes (authored blurbs) + derived metrics
  return payload
}
