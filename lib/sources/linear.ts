import { assertPublicSafe } from '../public-safety'

/**
 * PUBLIC roadmap shape — COUNTS ONLY. Note what is ABSENT (structurally, by never
 * being selected in the GraphQL query): title, description, comments, assignee,
 * creator, url, and even state.name. The public Linear projection is aggregate
 * integers + one timestamp. There is deliberately NO `PublicIssue` type carrying a
 * title in V1 — titles live only in the private, auth-gated cockpit (cockpit-linear.ts).
 *
 * Mirrors github.ts doctrine: PII omitted at the TYPE level (primary control), free
 * text handled by a fixed vocabulary not scrubbing, assertPublicSafe as the egress net.
 */

// Closed enum derived from Linear's WorkflowState.type — never from state.name (free text).
// 'in_review' is intentionally absent: Linear has no such state *type*; it is a `started`
// state and collapses to in_progress.
export type PublicIssueState = 'backlog' | 'planned' | 'in_progress' | 'done'

export interface PublicRoadmapSummary {
  counts: Record<PublicIssueState, number> // seeded to 0 for every key; label-independent
  total: number // sum of counts (canceled issues are excluded)
  lastUpdatedAt: string | null // ISO; null → renders the INSTRUMENTING string
}

// Linear state.type is a closed enum: triage | backlog | unstarted | started | completed | canceled.
// This is the KIND_LABELS analogue from github.ts — a fixed vocabulary, never free text.
const STATE_MAP: Record<string, PublicIssueState | null> = {
  triage: 'planned', // documented fold: triage counts as planned
  backlog: 'backlog',
  unstarted: 'planned',
  started: 'in_progress',
  completed: 'done',
  canceled: null, // dropped from counts entirely
}

/**
 * Map a raw Linear state.type to the public enum. Known keys use STATE_MAP (including
 * `canceled` → null, i.e. dropped). Any unknown/new type collapses to 'planned' — the
 * safe default, mirroring github.ts's `KIND_LABELS[...] || 'Update'`.
 */
export function mapState(stateType: string | null | undefined): PublicIssueState | null {
  if (stateType && stateType in STATE_MAP) return STATE_MAP[stateType]
  return 'planned'
}

// Broad shape of a raw issue node. buildSummary reads ONLY state.type + updatedAt;
// every other field a real Linear response might carry (title, assignee, url, state.name,
// labels) is ignored here and — for the fields we never select — never fetched at all.
interface RawIssueNode {
  identifier?: string
  state?: { type?: string | null } | null
  updatedAt?: string | null
  labels?: { nodes?: Array<{ name?: string }> } | null
}

function emptyCounts(): Record<PublicIssueState, number> {
  return { backlog: 0, planned: 0, in_progress: 0, done: 0 }
}

/**
 * Pure aggregator: raw issue nodes → counts-only summary. Reads state.type + updatedAt
 * and nothing else, so confidential free text (titles, assignee names, state.name) is
 * structurally incapable of reaching the output. `total` and `lastUpdatedAt` describe the
 * COUNTED set (canceled issues are excluded from both), so all figures share one denominator.
 */
export function buildSummary(nodes: RawIssueNode[]): PublicRoadmapSummary {
  const counts = emptyCounts()
  let total = 0
  let lastUpdatedAt: string | null = null

  for (const n of nodes) {
    const mapped = mapState(n.state?.type)
    if (mapped === null) continue // canceled / dropped — not counted
    counts[mapped] += 1
    total += 1
    const u = n.updatedAt ?? null
    if (u && (lastUpdatedAt === null || u > lastUpdatedAt)) lastUpdatedAt = u // ISO sorts lexically
  }

  return { counts, total, lastUpdatedAt }
}

// Empty fixture (learning.ts-style, NOT github.ts's populated one). Roadmap counts are a
// LIVE metric, not immutable history — a populated fixture would ship fabricated counts the
// moment the key is unset in prod. Zero counts → the UI renders INSTRUMENTING, never a number.
export const FIXTURE_ROADMAP: PublicRoadmapSummary = {
  counts: { backlog: 0, planned: 0, in_progress: 0, done: 0 },
  total: 0,
  lastUpdatedAt: null,
}

// Selects ONLY state.type, updatedAt, identifier, labels — never title/description/assignee/
// creator/url/state.name. You cannot leak what you never read (ARCHITECTURE §0 layer 1).
const COUNTS_QUERY = `
  query RoadmapCounts($teamKey: String!, $after: String) {
    issues(first: 250, after: $after, filter: { team: { key: { eq: $teamKey } } }) {
      nodes { identifier state { type } updatedAt labels { nodes { name } } }
      pageInfo { hasNextPage endCursor }
    }
  }`

/**
 * Fetch the PUBLIC roadmap as a counts-only summary. Without LINEAR_API_KEY (local dev /
 * no network) returns the empty fixture → the panel renders INSTRUMENTING, never fake counts.
 * Any HTTP/GraphQL failure — including mid-pagination — degrades to the same empty fixture
 * rather than shipping a partial (and therefore wrong) count.
 *
 * Caching is owned by the consuming ROUTE SEGMENT (`export const revalidate = 900`), NOT a
 * fetch-level directive: `next: { revalidate }` is ignored by Next's Data Cache on a POST.
 */
export async function getPublicRoadmap(): Promise<PublicRoadmapSummary> {
  const key = process.env.LINEAR_API_KEY
  if (!key) {
    assertPublicSafe(FIXTURE_ROADMAP, 'linear fixture')
    return FIXTURE_ROADMAP
  }

  // Public counts read from the Hub's own safe board (LINEAR_TEAM_KEY). This env is
  // intentionally SEPARATE from the cockpit's operating board (cockpit-linear.ts) so a
  // confidential project's activity cadence can never reach the public map.
  const teamKey = process.env.LINEAR_TEAM_KEY ?? 'YED'

  const nodes: RawIssueNode[] = []
  let after: string | null = null

  // Paginate to avoid the silent >250-node under-count. Hard page cap is a runaway backstop.
  for (let page = 0; page < 20; page++) {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      // GOTCHA: a Linear PERSONAL API key is sent RAW, with NO "Bearer" prefix (unlike github.ts).
      headers: { Authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: COUNTS_QUERY, variables: { teamKey, after } }),
    })
    if (!res.ok) {
      assertPublicSafe(FIXTURE_ROADMAP, 'linear fixture (http fallback)')
      return FIXTURE_ROADMAP
    }

    const json = await res.json()
    // GraphQL returns HTTP 200 with an `errors` array on partial failure — check it explicitly.
    if (json.errors || !json.data?.issues) {
      assertPublicSafe(FIXTURE_ROADMAP, 'linear fixture (graphql fallback)')
      return FIXTURE_ROADMAP
    }

    const conn = json.data.issues as {
      nodes?: RawIssueNode[]
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null }
    }
    nodes.push(...(conn.nodes ?? []))
    if (!conn.pageInfo?.hasNextPage) break
    after = conn.pageInfo.endCursor ?? null
    if (!after) break
  }

  const summary = buildSummary(nodes)
  assertPublicSafe(summary, 'linear public roadmap') // egress NET — throws on any PII hit
  return summary
}
