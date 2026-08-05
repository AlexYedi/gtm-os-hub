// Local egress verification — exercises the REAL source → projection → guard paths against
// live (private) data. NOT part of the build; run manually:
//   bun run scripts/verify-egress.ts
//
// Two proofs, two shapes:
//   1. GitHub — raw data CARRIES PII (author emails) and FAILS the scan; the public
//      projection that actually ships PASSES it. (raw-dirty / projection-clean.)
//   2. Linear — the scanner does NOT transfer here: raw Linear titles/assignee names carry
//      no email/phone/LinkedIn pattern, so a "raw-dirty" proof is impossible. The real control
//      is TYPE-LEVEL OMISSION, so this proves the GATE/OMISSION: a known raw title is ABSENT
//      from the counts-only projection, and the projection has no title/assignee/url keys.
import { getPublicCommits } from '../lib/sources/github'
import { getPublicRoadmap } from '../lib/sources/linear'
import { scanForPii } from '../lib/public-safety'

const line = '─'.repeat(64)
let anyRun = false

// ── 1. GitHub: raw-dirty / projection-clean ────────────────────────────────
const ghToken = process.env.GITHUB_TOKEN
const repo = process.env.GTM_OS_REPO ?? 'AlexYedi/gtm-os'
if (!ghToken) {
  console.log('• GitHub block SKIPPED — no GITHUB_TOKEN in env (.env.local).')
} else {
  anyRun = true
  const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, {
    headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) {
    console.error(`✗ GitHub fetch failed: ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const raw = (await res.json()) as Array<Record<string, any>>
  const rawEmails = [...new Set(raw.map((c) => c.commit?.author?.email).filter(Boolean))]
  const rawScan = scanForPii(JSON.stringify(raw))

  console.log(line)
  console.log(`RAW GitHub response (${raw.length} commits) — the data we read FROM:`)
  console.log('  author emails present:', rawEmails.length)
  console.log('  scanForPii(raw).clean :', rawScan.clean)

  const pub = await getPublicCommits(5)
  const pubScan = scanForPii(JSON.stringify(pub))
  console.log(line)
  console.log('PUBLIC projection — the data we ship (assertPublicSafe passed):')
  console.log('  scanForPii(public).clean:', pubScan.clean)
  console.log(
    rawScan.clean === false && pubScan.clean === true
      ? '✓ GitHub CONTRACT HOLDS: raw carries PII, projection is clean.'
      : '✗ GitHub CONTRACT VIOLATION — investigate before any deploy.',
  )
}

// ── 2. Linear: gate/omission (NOT scanner-dirtiness) ───────────────────────
const linKey = process.env.LINEAR_API_KEY
const teamKey = process.env.LINEAR_TEAM_KEY ?? 'YED'
if (!linKey) {
  console.log(line)
  console.log('• Linear block SKIPPED — no LINEAR_API_KEY in env (.env.local).')
} else {
  anyRun = true
  // RAW — deliberately select the confidential fields the public query NEVER selects, to prove
  // there IS sensitive text upstream that the projection structurally cannot carry.
  const rawQuery = `
    query($teamKey: String!) {
      issues(first: 25, filter: { team: { key: { eq: $teamKey } } }) {
        nodes { identifier title assignee { name } url state { name } }
      }
    }`
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { Authorization: linKey, 'Content-Type': 'application/json' }, // raw key, no Bearer
    body: JSON.stringify({ query: rawQuery, variables: { teamKey } }),
  })
  if (!res.ok) {
    console.error(`✗ Linear fetch failed: ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const json = await res.json()
  if (json.errors || !json.data?.issues) {
    console.error('✗ Linear GraphQL error:', JSON.stringify(json.errors ?? 'no data'))
    process.exit(1)
  }
  const rawNodes = json.data.issues.nodes as Array<{ title?: string; assignee?: { name?: string } | null }>
  const rawTitles = rawNodes.map((n) => n.title ?? '').filter(Boolean)
  const rawAssignees = [...new Set(rawNodes.map((n) => n.assignee?.name).filter(Boolean))]

  // PUBLIC projection — counts only. assertPublicSafe() runs INSIDE this.
  const pub = await getPublicRoadmap()
  const pubJson = JSON.stringify(pub)
  const pubKeys = Object.keys(pub)

  // The gate proofs:
  const noForbiddenKeys = !['title', 'assignee', 'url', 'description'].some((k) => k in pub)
  const titlesAbsent = rawTitles.every((t) => !pubJson.includes(t))
  const assigneesAbsent = rawAssignees.every((a) => !pubJson.includes(a as string))

  console.log(line)
  console.log(`RAW Linear response (${rawNodes.length} issues, team ${teamKey}) — the data we read FROM:`)
  console.log('  raw issues with a title      :', rawTitles.length, '(confidential — NOT printed)')
  console.log('  distinct raw assignee names  :', rawAssignees.length, '(PII — NOT printed)')
  console.log(line)
  console.log('PUBLIC projection — counts only (assertPublicSafe passed):')
  console.log('  keys                         :', pubKeys.join(', '))
  console.log('  no title/assignee/url keys   :', noForbiddenKeys)
  console.log('  every raw title absent       :', titlesAbsent)
  console.log('  every raw assignee absent    :', assigneesAbsent)
  console.log('  counts                       :', JSON.stringify(pub.counts), '· total', pub.total)
  console.log(
    noForbiddenKeys && titlesAbsent && assigneesAbsent
      ? '✓ Linear CONTRACT HOLDS: raw titles/names exist upstream; projection omits them by type.'
      : '✗ Linear CONTRACT VIOLATION — a private field reached the public projection.',
  )
}

console.log(line)
if (!anyRun) {
  console.log('Nothing ran — set GITHUB_TOKEN and/or LINEAR_API_KEY in .env.local first.')
  process.exit(1)
}
