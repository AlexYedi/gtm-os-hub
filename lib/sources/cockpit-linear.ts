import 'server-only'

/**
 * PRIVATE, full-fidelity Linear reader for the auth-gated cockpit (Tier 3).
 *
 * This is the deliberate ASYMMETRY to the public counts-only adapter (linear.ts):
 * here titles and URLs ARE surfaced, because this data is auth-gated and never
 * egressed to a public surface. It therefore does NOT call assertPublicSafe — doing
 * so would wrongly strip the legitimate private titles this view exists to show.
 *
 * Its three guards, mirroring cockpit.ts vs learning.ts:
 *   1. a distinct `Cockpit*` type (public code consumes `Public*`, never this),
 *   2. `import 'server-only'` (bundling raw Linear prose into a client is a build error),
 *   3. auth — the consuming page self-guards with isCockpitAuthed().
 *
 * The leak-prevention here is convention + server-only + auth, NOT type-level omission.
 * That weaker guarantee is inherent: a cockpit must show titles. Never import this from a
 * public route file.
 */

export interface CockpitIssue {
  identifier: string
  title: string
  state: string // human state.name — allowed here, never public
  priority: number // Linear: 0 none · 1 urgent · 2 high · 3 medium · 4 low
  url: string
  isBlocked: boolean
  updatedAt: string
}

export interface CockpitBoard {
  next: CockpitIssue[]
  inProgress: CockpitIssue[]
  blockers: CockpitIssue[]
}

interface RawCockpitNode {
  identifier: string
  title: string
  url: string
  priority: number | null
  updatedAt: string
  state: { type: string; name: string } | null
  inverseRelations?: { nodes?: Array<{ type?: string }> } | null
}

// Full fidelity — but STILL never selects assignee/creator/description/comments. The cockpit
// needs title/state/url/priority + a blocked signal; it does not need PII-bearing people fields.
// An issue is "blocked" when something blocks it → it appears in another issue's `blocks`
// relation, i.e. it carries an inverse "blocks" relation.
const BOARD_QUERY = `
  query CockpitBoard($teamKey: String!) {
    issues(first: 100, filter: { team: { key: { eq: $teamKey } } }) {
      nodes {
        identifier
        title
        url
        priority
        updatedAt
        state { type name }
        inverseRelations { nodes { type } }
      }
    }
  }`

// Urgent(1) first, then high/medium/low, then none(0) last.
function priorityRank(p: number): number {
  return p === 0 ? 99 : p
}

function sortIssues(a: CockpitIssue, b: CockpitIssue): number {
  const r = priorityRank(a.priority) - priorityRank(b.priority)
  if (r !== 0) return r
  return b.updatedAt.localeCompare(a.updatedAt) // most recently touched first
}

function toCockpitIssue(n: RawCockpitNode): CockpitIssue {
  const isBlocked = (n.inverseRelations?.nodes ?? []).some((r) => r?.type === 'blocks')
  return {
    identifier: n.identifier,
    title: n.title,
    state: n.state?.name ?? 'Unknown',
    priority: n.priority ?? 0,
    url: n.url,
    isBlocked,
    updatedAt: n.updatedAt,
  }
}

/**
 * Fetch Alex's operating board grouped into Next · In progress · Blockers.
 * Returns `null` when LINEAR_API_KEY is unset (→ the page shows the "one step to go live"
 * card). A blocked active issue is surfaced in `blockers` only, not double-listed.
 */
export async function getCockpitBoard(): Promise<CockpitBoard | null> {
  const key = process.env.LINEAR_API_KEY
  if (!key) return null

  // SEPARATE config knob from the public board (linear.ts's LINEAR_TEAM_KEY). Two values,
  // never one — so the cockpit can point at Alex's confidential operating project without
  // that project's cadence ever leaking to the public map. Independent default, not a
  // fall-through to LINEAR_TEAM_KEY.
  const teamKey = process.env.LINEAR_COCKPIT_TEAM_KEY ?? 'YED'

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' }, // raw key, no Bearer
    body: JSON.stringify({ query: BOARD_QUERY, variables: { teamKey } }),
    cache: 'no-store', // private, always fresh; the page is force-dynamic
  })
  if (!res.ok) return null

  const json = await res.json()
  if (json.errors || !json.data?.issues) return null

  const nodes = (json.data.issues.nodes ?? []) as RawCockpitNode[]
  const board: CockpitBoard = { next: [], inProgress: [], blockers: [] }

  for (const n of nodes) {
    const type = n.state?.type
    if (type === 'completed' || type === 'canceled') continue // active work only
    const issue = toCockpitIssue(n)
    if (issue.isBlocked) board.blockers.push(issue)
    else if (type === 'started') board.inProgress.push(issue)
    else board.next.push(issue) // triage · backlog · unstarted · planned
  }

  board.next.sort(sortIssues)
  board.inProgress.sort(sortIssues)
  board.blockers.sort(sortIssues)
  return board
}
