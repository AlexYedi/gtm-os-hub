# gtm-os-hub — Phase 1 Unified Build Spec

> **Provenance:** Synthesized 2026-07-30 by a 5-lens judge-panel ensemble (architect · product · design-engineering · PII/eval · systems), each draft adversarially critiqued, then merged. The "Key disagreements resolved" section at the end is the pressure-test trail.
>
> **One correction to the text below:** the `GTM_OS_HUB` Supabase project (University's data plane) is **live** as of 2026-07-30 — go-live / YED-99 is complete. Where §8 says "both Supabase hosts are NXDOMAIN," that is stale; only the *signal-spine* project's live-wiring is the deferred cross-repo dependency, and its pause state should be re-verified at wire time.

Synthesized from 5 adversarially-reviewed lens plans. Execution-ready for a fresh session. Every conflict is resolved with an explicit call. READ-ONLY design doc — no files were written.

The single most important convergent finding across all 5 critiques: **the public Linear surface ships counts-only in V1. No issue titles, no issue URLs reach any public page.** This is not a scope cut for time — it is the correct security posture, and it dissolves ~6 of the sharpest findings at once (URL slug leak, weaker-than-KIND_LABELS free text, the nonexistent `public` label, the scanner-can't-catch-names problem, the "no public consumer" dead code). Titles live only in the private, auth-gated cockpit.

---

## 1. Scope + explicit cut-lines

**IN (Phase 1):**
- `lib/sources/linear.ts` — PII-safe **counts-only** public Linear adapter + `lib/sources/linear.test.ts`.
- `lib/sources/cockpit-linear.ts` — private (`server-only`) full-fidelity reader for the cockpit.
- `app/cockpit/page.tsx` — new private Tier-3 index (what's next / in-progress / blockers).
- `app/system/page.tsx` + `components/system/*` + `content/system-map.ts` + `lib/sources/system-status.ts` — the public Tier-2 Living System Map, hand-authored SVG, no new dependency.
- `lib/supabase/spine.ts` + `lib/sources/spine.ts` — spine stats adapter shipping in the **honest-empty** state (null → instrumenting), wired to light up when the cross-repo view + env land.
- Enable the Tier-2 toggle at `app/page.tsx:25` (span → `<Link href="/system">`).
- Extend `scripts/verify-egress.ts` with a Linear **gate** proof (see §5).

**CUT / DEFERRED (explicit):**
| Item | Verdict | Why |
|---|---|---|
| Public issue `title` + `url` fields | **CUT from V1** | Largest new leak vector, no V1 public renderer, weaker than the KIND_LABELS precedent. Defer until a real public renderer + a dedicated PII-safe public field exist. |
| `TierNav`/`PublicTabs` unification onto live `/university` | **CUT** | Scope creep touching a shipped public page (YED-99 Done) for zero Tier-2 payoff. Enabling the toggle needs only `/` + new `/system`. Optional separate follow-up. |
| Linear panel on the public homepage `/` | **CUT** | "What's next" is private per PRD; only the toggle changes on `/`. |
| Snapshot layer (Vercel Cron → `dashboard_snapshot`) | **DEFER** | Direct ISR fan-out (V0 posture) is fine at 4 upstreams. First thing to migrate as sources grow. |
| shadcn/recharts/Framer Motion | **CUT** | Dependency-light mandate; hand-authored SVG suffices for ~7–12 static nodes. |
| Notion artifacts adapter | **DEFER (next slice)** | Same mirror pattern; lights up the `notion` node already drawn on the map. |
| `pass^k` eval framing + `docs/releases/.../eval-summary.md` | **CUT** | These are deterministic unit tests; the pass^k dressing inflates rigor and the report file is out of scope. |
| Live spine wiring (view + key) in this repo | **DEFER to cross-repo task** | Separate Supabase project, currently paused. Adapter ships ready; see §8. |
| Stale `apps/dashboard/*` path refs in `public-safety.ts:8` / `verify-egress.ts:14` | **NICE-TO-HAVE** | Cosmetic doc-drift cleanup; flag, don't block on it. |

---

## 2. Linear adapter contract — `lib/sources/linear.ts`

Mirrors `github.ts` doctrine: PII omitted at the **type level**, free text handled by **allowlist vocabulary not scrubbing**, `assertPublicSafe` on every return path, labelled empty fixture when `LINEAR_API_KEY` is unset.

### 2.1 Public types (counts-only)

```ts
// Closed enum derived from Linear WorkflowState.type. Never from state.name (free text).
// 'in_review' is intentionally absent — Linear has no such state *type*; it collapses to in_progress.
export type PublicIssueState = 'backlog' | 'planned' | 'in_progress' | 'done'

// The public projection is AGGREGATE ONLY. What is ABSENT (structurally, by never being
// selected in the GraphQL query): title, description, comments, assignee, creator, url, state.name.
export interface PublicRoadmapSummary {
  counts: Record<PublicIssueState, number>   // seeded to 0 for every key; label-independent
  total: number
  lastUpdatedAt: string | null               // ISO; null → renders instrumenting
}
```

There is **no** `PublicIssue` type with a title in V1. The only public payload is safe integers + one timestamp.

### 2.2 Fixed vocabulary (the KIND_LABELS analogue)

```ts
// Linear state.type closed enum: triage | backlog | unstarted | started | completed | canceled
const STATE_MAP: Record<string, PublicIssueState | null> = {
  triage: 'planned',      // documented fold: triage counts as planned
  backlog: 'backlog',
  unstarted: 'planned',
  started: 'in_progress',
  completed: 'done',
  canceled: null,         // dropped from counts
}
// Unknown/new type → 'planned' (safe default, mirrors KIND_LABELS → 'Update')
```

### 2.3 Publish-gate mechanism for free-text titles (the general rule)

The publish-gate is stated as policy even though V1 emits no titles, because it governs the moment titles are ever wanted:

1. **Structural first (V1):** the GraphQL query selects **only** `identifier`, `state { type }`, `updatedAt`, `labels { nodes { name } }`. It never selects `title`, `description`, `assignee`, `creator`, `url`, or `state.name`. You cannot leak what you never read (ARCHITECTURE §0 layer 1). This is why `state.name` is **not selected** — fetching-then-discarding it is the exact anti-pattern the contract forbids (PII-eval F6).
2. **Counts are label-independent:** aggregated over all scoped issues by state. A `public` label is *not* required for the counts to be real (architect F5) — so the map never shows a fabricated-looking "0 in progress" while work is happening.
3. **When titles are eventually wanted** (post-V1, private cockpit excepted): only issues carrying a `public` label may surface a title, and even then the text must come from a **dedicated author-written public field** (mirror `learning.ts` reading `public_summary`, never `body_md`) — never the raw working `title`, and never the issue `url` (its slug embeds the title). `scrub()` + `assertPublicSafe` are the **net, not the primary control**; the scanner only catches email/phone/LinkedIn/`PII_DENYLIST` and is blind to a novel company/prospect name.

**Prerequisite (non-code):** the `public` label does not currently exist in the workspace (verified live by two lenses; labels are `project-eval-harness, cycle-1, !implement, !review, !triage, !plan, Improvement, Feature, Bug`). Counts-only V1 does **not** depend on it. Create it (team-scoped, not workspace-global) only when the private cockpit or a future public title strip needs it.

### 2.4 Fetch / failure / caching

```ts
export async function getPublicRoadmap(): Promise<PublicRoadmapSummary> {
  const key = process.env.LINEAR_API_KEY
  if (!key) { assertPublicSafe(FIXTURE_ROADMAP, 'linear fixture'); return FIXTURE_ROADMAP }

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    // GOTCHA: Linear PERSONAL API key is sent raw, NO "Bearer" prefix (unlike github.ts).
    // Verify against a live 200/401 before finalizing.
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: COUNTS_QUERY, variables: { teamKey: process.env.LINEAR_TEAM_KEY ?? 'YED' } }),
    // NOTE: next:{revalidate} on a POST is IGNORED by the Next Data Cache (architect F3).
    // Caching is owned by the ROUTE SEGMENT (export const revalidate = 900 in the page),
    // not this fetch. Do not add a misleading fetch-level revalidate.
  })
  if (!res.ok) { assertPublicSafe(FIXTURE_ROADMAP, 'linear fixture (http fallback)'); return FIXTURE_ROADMAP }

  const json = await res.json()
  // GOTCHA: GraphQL returns 200 with an `errors` array on partial failure (architect F3).
  if (json.errors || !json.data) { assertPublicSafe(FIXTURE_ROADMAP, 'linear fixture (graphql fallback)'); return FIXTURE_ROADMAP }

  const summary = buildSummary(json.data /* paginate if >250, see below */)
  assertPublicSafe(summary, 'linear public roadmap')   // egress net
  return summary
}
```

- **Empty fixture (not populated):** `FIXTURE_ROADMAP = { counts: { backlog:0, planned:0, in_progress:0, done:0 }, total:0, lastUpdatedAt:null }`. Mirrors `learning.ts`'s empty fixture, NOT github's populated one. Zero counts → the UI renders the instrumenting string, never a placeholder number (PII-eval Blocker 1). A missing key in prod must degrade to instrumenting, never to fake counts.
- **Pagination:** a single page caps at 250 nodes; a lifetime team-scoped query will exceed it and silently under-count (Design C7). Paginate via `pageInfo.hasNextPage`, OR scope to the active cycle / Hub project with honest semantics. Decide `done` semantics deliberately (lifetime-cumulative "done" is misleading next to a live "in flight" count) — recommend scoping to the current project so all four counts share one honest denominator.
- **Two config values, not one (architect/critique F6):** `LINEAR_TEAM_KEY` (or project id) for the **public** counts must point at the Hub's own safe board; the **cockpit** reader (§4) may point at whichever project Alex operates from. Never unify them behind a single env var — that's how a confidential project's activity cadence reaches the public map.
- ISR: `export const revalidate = 900` at the consuming route segments.

---

## 3. `/system` Living System Map

### 3.1 Node inventory (node → data source → live-or-empty state)

Every node answers the same three questions: is it up, what's its latest measure, when last seen. Status is a first-class **honesty taxonomy** enforced in the component layer, not prose (systems lens leverage point):

```ts
export type NodeStatus = 'live' | 'instrumenting' | 'planned'
// live       = adapter has a real read path AND returned data
// instrumenting = wired, no data yet (renders the canonical string)
// planned    = not yet wired at all
```

| Node id | Label | Data source (probe) | V1 state | Metric derivation |
|---|---|---|---|---|
| `github` | The Work, Live | `getPublicCommits()` (wired) | **live** | last-commit `kind` + `formatDate` |
| `university` | GTM University | `getPublicUniversity()` + `computeInsights()` (wired via `v_public_*`) | **live** | `${subtasksTotal} units`, `${pctProgress}%`, `${publicSubmissions} shared` — **derived, never hardcoded** |
| `linear` | Roadmap | `getPublicRoadmap()` counts (§2) | **live** if `LINEAR_API_KEY` set, else **instrumenting** | `${counts.in_progress} in flight` — counts only, no titles |
| `spine` | Signal Spine | `getPublicSpineStats()` (§8) | **instrumenting** (no Hub read path yet) | null → instrumenting; **never** hardcode 396/59/452 |
| `egress-gate` | PII egress contract | static content-as-code | **live** | omit the test count OR derive it; never a stale "14 tests" literal |
| `hub` / `deploy` | The Hub (Vercel) | build-time env (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV`) | **live** (present) | no fabricated uptime number |
| `notion` | Artifacts | deferred adapter | **planned** | — |

**Edges are static and structural.** Do NOT draw a `spine → university` edge — it does not exist (product H2): university data lives in `GTM_OS_HUB`, the spine is a separate unwired project. Honest edges: `github + linear → hub`, `learning-supabase → university`, `hub → egress-gate → public surfaces`, `spine` as an **isolated** node not yet feeding anything.

### 3.2 Component structure

```
content/system-map.ts              STATIC topology: NODES (id,label,kind,blurb,x,y,source) + EDGES.
                                   Content-as-code, PII-safe by authorship (like curriculum).
lib/sources/system-status.ts       Pure buildStatusMap(parts) + async getSystemStatus() that fans
                                   out to existing safe adapters; assertPublicSafe at the boundary.
lib/sources/system-status.test.ts  Egress test against the PURE assembler (see §5).
app/system/page.tsx                Server Component. export const revalidate = 900 (public/cacheable,
                                   NOT force-dynamic). Promise.all fan-out → assertPublicSafe(nodes,
                                   'system map') ONCE, wrapped in try/catch → degraded state on throw
                                   (never 500 the public page). Passes serializable props to island.
components/system/SystemMap.tsx     'use client' island. Owns only useState<selectedId>. No fetching.
components/system/SystemDiagram.tsx SVG edges only (<line>/<path>, aria-hidden) BEHIND absolutely-
                                   positioned HTML <button> nodes at authored % coords.
components/system/NodeDetail.tsx    aria-live="polite": label, status dot+word, blurb, metric | INSTRUMENTING.
components/system/MobileSystemList.tsx  Same node data as a stacked semantic list < md (no SVG lines).
```

**Assembler resilience (architect F2):** the page-boundary `assertPublicSafe` is a *throw*. Wrap page assembly in `try/catch` and render a degraded/instrumenting map on throw — one leaking or throwing node must not 500 the flagship public page. Keep each adapter's own `assertPublicSafe` as the real per-source net. Note the CI caveat: `PII_DENYLIST` is env-only and empty in CI, so authored `blurb` strings pass tests but could throw at prod render — run the egress CI job with the real `PII_DENYLIST` injected as a secret, and keep authored strings clear of denylist terms.

### 3.3 Dependency-light approach (call: no new dependency)

Hand-author the diagram. ~7–12 nodes, fixed topology — `react-flow`/`recharts`/Framer Motion are unjustified weight against the dependency-light mandate and read as generic AI-diagram slop.

- **Authored coordinates, not measured:** each node carries `{x,y}` percentages in `content/system-map.ts`; edges are pure functions of those static coords → SSR-safe, no `getBoundingClientRect`/`ResizeObserver`/`useLayoutEffect`, no hydration jank.
- **HTML buttons over an SVG edge layer — NOT `<foreignObject>`** (design C12): a `position:relative` container, one `aria-hidden` `<svg>` drawing only edges, and real absolutely-positioned `<button>`s on top. Gets every authored-coordinate benefit with first-class DOM focus/keyboard/pointer behavior and none of foreignObject's cross-browser flakiness.
- **A11y:** real `<button>`s (native Tab/Enter/Space), status is dot **+ word** never color-only, edges decorative with relationships also stated as text in `NodeDetail`, `:focus-visible` outline, `prefers-reduced-motion` guard on any live-edge animation.
- **Responsive:** below `md`, render `MobileSystemList` (stacked cards) instead of the SVG — body never scrolls horizontally.

### 3.4 Tier-2 toggle wiring

- `app/page.tsx:25` is currently a disabled `<span … title="Coming in V1">Living System Map ⊘</span>`. Replace with `<Link href="/system">`. Add a reciprocal nav on `/system` back to `/` and `/university`.
- **Do NOT** refactor `/university`'s nav into a shared component in this slice (cut-line §1). Minimal enablement only.
- Standardize the empty string on the **canonical** value from ARCHITECTURE.md:116 / CLAUDE.md guardrail #3: `⊘ instrumenting — wired, awaiting first run` (design C10 — do not adopt the mission prompt's shortened phrasing). Export it as `lib/ui-constants.ts:INSTRUMENTING` and reuse.

---

## 4. Cockpit "what is next" slice (private Tier 3)

Per the PRD correction this is **private**, never the public homepage. `/cockpit` has no index today (only `login/`, `university/`); `middleware.ts` already gates `/cockpit/*` (matcher `['/cockpit/:path*']` matches the bare `/cockpit` — verified).

**`lib/sources/cockpit-linear.ts`** — full-fidelity reader, distinct module so public code never imports it:
```ts
import 'server-only'   // REQUIRED (design C5) — bundling into a client would ship raw Linear prose
export interface CockpitIssue {
  identifier: string; title: string; state: string; priority: number
  url: string; isBlocked: boolean; updatedAt: string
}
export interface CockpitBoard { next: CockpitIssue[]; inProgress: CockpitIssue[]; blockers: CockpitIssue[] }
export async function getCockpitBoard(): Promise<CockpitBoard | null>  // null if LINEAR_API_KEY unset
```
- **Full titles/URLs allowed here** — auth-gated, never egressed. It **does not** call `assertPublicSafe` (that would wrongly strip legitimate private titles). Its three guards: distinct `Cockpit*` type, `server-only`, and auth. Mirrors the `cockpit.ts` (private) vs `learning.ts` (public) asymmetry.
- Optionally add an ESLint `no-restricted-imports` rule banning `lib/sources/cockpit-linear` from public route files (belt-and-suspenders for the convention-enforced boundary).

**`app/cockpit/page.tsx`** — new index:
- `export const dynamic = 'force-dynamic'` (private, uncached — mirror `app/cockpit/university/page.tsx`).
- First line: `if (!(await isCockpitAuthed())) redirect('/cockpit/login')` — the page must self-guard; middleware presence-check is UX, not the boundary.
- Renders `getCockpitBoard()` grouped **Next · In progress · Blockers** (stack on mobile); `null` → the "one step to go live" card pattern. Links to `/cockpit/university`.

---

## 5. Egress test cases — `lib/sources/linear.test.ts`

Dependency-free (`bun:test`, no network), testing the pure mapper + gate + `assertPublicSafe`, auto-enforced by `bun test lib/` in CI:

1. **Type-level omission.** Mapper output: `expect('title' in out).toBe(false)`, `'assignee'`, `'description'`, `'url'` all false. The highest-risk fields cannot exist on the public type.
2. **State from closed enum, never `state.name`.** Feed `state:{ type:'started', name:'CONFIDENTIAL client demo' }` → summary attributes it to `in_progress` and `'CONFIDENTIAL'` is absent from `JSON.stringify(out)`.
3. **Unknown/new state.type → safe default** (`'planned'`); `canceled` → dropped from counts.
4. **`triage` folds to `planned`** (documented behavior, explicit assertion).
5. **Counts are label-independent and real zeros.** 3 issues (2 started, 1 completed) → `counts.in_progress===2`, `counts.done===1`, `counts.backlog===0`. Empty categories are true zeros → instrumenting downstream, never invented.
6. **Empty fixture path.** With no key, `getPublicRoadmap()` → `total===0`, all counts 0, `lastUpdatedAt===null` (reconciles the fixture with the no-fabrication rule).
7. **`assertPublicSafe` passes a clean summary.**
8. **`assertPublicSafe` throws on a simulated leak** (a hand-crafted payload with a raw title field that bypassed the type) → `.toThrow(/egress blocked/i)`.
9. **Denylist backstop.** Set `PII_DENYLIST` in-test → `assertPublicSafe` throws on a payload carrying that term (proves layer-3 catches a hypothetical layer-2 miss).

**Do NOT** write a test asserting `scanForPii(rawLinear).clean === false` (PII-eval Blocker 3 / product H1): raw Linear titles/assignee **names** contain no email/phone/LinkedIn pattern and (usually) no denylist term, so the scanner returns clean and the "raw-dirty/projection-clean" GitHub proof does **not** transfer. The Linear egress proof must exercise the **gate/omission**: assert a known private title string is absent from the projection, and that the projection object has no title/assignee/url keys. Extend `scripts/verify-egress.ts` with a Linear block that demonstrates this projection-shape guarantee on live data (not scanner-dirtiness).

**System map test** (`lib/sources/system-status.test.ts`): factor a pure `buildStatusMap(parts)` and test *that* with an injected leak (mirrors how `learning.test.ts` tests the pure mapper, not the async fetcher). Assert: clean map passes `assertPublicSafe`; instrumenting nodes carry `metric:null`; an injected leaking `blurb`/`metric` throws.

---

## 6. Build sequence (ordered, each demoable)

Verify gate after each: `bun test lib/ · bun run build`.

1. **`lib/ui-constants.ts`** (canonical `INSTRUMENTING`) + hoist `formatDate` → `lib/format.ts`. *Demo: build green, no behavior change.*
2. **`lib/sources/linear.ts` (counts-only) + `lib/sources/linear.test.ts`.** Confirm the no-`Bearer` auth header live. *Demo: `bun test lib/` green (9 cases); riskiest egress surface proven before any consumer.*
3. **`lib/sources/cockpit-linear.ts`** (`server-only`, full titles). *Demo: typecheck.*
4. **`app/cockpit/page.tsx`** — auth-guarded index consuming step 3. *Demo: log in → real Next/In-progress/Blockers; unauthed → login redirect.*
5. **`lib/supabase/spine.ts` + `lib/sources/spine.ts`** — honest-empty (null → instrumenting). *Demo: returns nulls with no env, build passes.*
6. **`content/system-map.ts`** (static topology) + **`lib/sources/system-status.ts` + test** (all nodes instrumenting initially, reusing only already-safe adapters). *Demo: assembler returns nodes, egress test green.*
7. **`components/system/*` + `app/system/page.tsx`** (SVG-edges + HTML-button nodes, mobile list, page-boundary `assertPublicSafe` in try/catch). *Demo: `/system` renders public, click→detail, mobile stacks.*
8. **Enable toggle** `app/page.tsx:25` (span→`<Link>`) + reciprocal nav on `/system`. *Demo: `/ ↔ /system` round-trips.* — **This is the first shippable public Tier 2.**
9. **Wire live statuses** into `system-status.ts`: github, university, linear counts, hub/deploy → live; spine → instrumenting; notion → planned. *Demo: live badges beside honest instrumenting/planned nodes.*
10. **Extend `scripts/verify-egress.ts`** with the Linear projection-shape block; run full gate; human-in-the-loop public flip.

---

## 7. Verification

- `bun test lib/` — `public-safety.test.ts` + `learning.test.ts` + new `linear.test.ts` + `system-status.test.ts`. Run the CI egress job with the **real `PII_DENYLIST`** injected as a secret so authored content-as-code is validated pre-deploy, not at runtime.
- `bun run build` — clean; confirm **no new dependency** added to `package.json`; `tsconfig` already excludes `**/*.test.ts` + `scripts/**` from the build.
- `bun run scripts/verify-egress.ts` — existing GitHub raw-vs-projection proof + new Linear projection-shape proof (gate/omission, not scanner-dirtiness).
- **Drive routes:** `/system` renders every node with honest status, click→detail works, keyboard-accessible, no horizontal scroll on mobile; `/ ↔ /system` toggle both ways; `/cockpit` authed shows real board, unauthed redirects; grep the rendered public payload to confirm zero non-zero numbers on instrumenting/planned nodes.

---

## 8. Open risks + dependencies

**Signal-spine cross-project access (the hard one):**
- The spine (`Signal_Pipeline_Analytical_Spine`, ref `abkvgihlbwfloentugtd`) is a **separate** Supabase project whose keys live in the `gtm-os` repo. The Hub has **no** read path. `lib/supabase/public.ts` is hardwired to `GTM_OS_HUB` and cannot reach it — a **second client factory** (`spineClient()` reading `SPINE_SUPABASE_URL` / `SPINE_SUPABASE_ANON_KEY`) is required.
- **The signal-spine project may be idle-paused** (free-tier auto-pause after ~7 idle days — re-verify at wire time; `GTM_OS_HUB` itself is live and running University). You cannot add a view or key to a paused project — un-pause/restore is an unlisted prerequisite to lighting the node up. V1 ships the honest-empty state; the honest instrumenting node *is* the portfolio proof, not a gap.
- **When wiring (cross-repo `gtm-os` task, NOT this repo):** create `public.v_public_spine_stats` on the spine — **aggregate counts only** (`entity_count`, `event_count`, `signal_count`, `last_signal_at`), no rows, no PII. **Pin the view security explicitly** so counts are real (architect F1): if `security_invoker` + base-table RLS denies `anon`, `count(*)` silently returns **0, not an error** → the map would publish a confident wrong "0". Defensively, either emit `NULLIF(count(*),0)` or have the adapter map `count===0 ? null : count` so an RLS-shadowed read renders instrumenting, not a fabricated zero. `grant select` only on the view; base tables RLS-denied.
- **Never** put the spine `service_role` key in the Hub. The anon key's confidentiality control is the view grant + RLS, not the env prefix — but keep it server-side (the read is in a Server Component) since there's no reason to ship it to the browser.
- **Never hardcode 396/59/452** anywhere in `/system` — any spine number before the live view exists is a fabricated number.

**Other dependencies / risks:**
- Linear auth header shape (personal key, no `Bearer`) — verify against a live response before finalizing (the one place the github.ts mirror diverges).
- `public` label must be created (team-scoped) before any private-cockpit title curation or future public title strip; not needed for counts-only V1.
- Cockpit leak-prevention is **convention-enforced, not type-enforced** — the weaker guarantee is inherent (it must show titles). Mitigate with `server-only` + auth + optional ESLint import ban.
- Contract decoupling: the Hub depends only on `v_public_spine_stats` column names and on `PublicRoadmapSummary` — never on base tables or the Linear GraphQL schema directly. The views/projections are the contracts.
- Which Linear project drives public counts vs the cockpit board is Alex's call — but they must be **two** config values, not one (confidentiality).

---

## Key disagreements resolved

- **Public Linear titles/URLs: include (architect, product, design, pii-eval base plans) vs drop (all 5 critiques).** → **DROP. Counts-only V1.** Raw titles are strictly weaker than the KIND_LABELS precedent PR #3 established, have no V1 public renderer, the `url` slug re-leaks the title, and the scanner can't catch confidential nouns. This is the highest-consensus fix and it dissolves the nonexistent-`public`-label risk.
- **Spine access: wire now (a) vs honest-empty (b).** → **(b) now, (a) as a specified cross-repo follow-up.** Forced by paused hosts + no Hub read path; anything else fabricates numbers. Added the `security_invoker`/RLS false-zero guard (architect F1) that no base plan caught.
- **Fixture: populated (github-style) vs empty (learning-style).** → **Empty.** Roadmap counts are a live metric, not immutable historical SHAs; a populated fixture ships fabricated counts if the key is ever unset in prod. Reconciled the internal contradiction (populated fixture vs zero-count audit) in the pii-eval plan.
- **`assertPublicSafe(raw)` catches names for the egress proof (product/pii-eval base) vs it doesn't (both critiques).** → **It doesn't.** The Linear egress proof tests the gate/omission, not scanner-dirtiness; the real control is type-level omission.
- **Diagram rendering: `<foreignObject>` buttons (design) vs HTML overlay + SVG edges (its own critique).** → **HTML buttons over an aria-hidden SVG edge layer.** Same authored-coordinate benefits, first-class DOM a11y, avoids foreignObject flakiness. No new dependency (unanimous).
- **Single Linear project id (architect) vs two (critique F6).** → **Two.** Public counts from a safe board; cockpit from Alex's operating board. Prevents a confidential project's cadence reaching the public map.
- **`TierNav`/`PublicTabs` unification touching live `/university` (design/architect) vs de-bundle (critiques).** → **De-bundle.** Enable the toggle minimally; leave the shipped public page alone.
- **INSTRUMENTING string wording.** → **Canonical `⊘ instrumenting — wired, awaiting first run`** (ARCHITECTURE.md/CLAUDE.md), not the mission prompt's shortened form.
- **`state.name` fetched-then-discarded (architect/pii-eval base) vs never select it (pii-eval critique).** → **Never select it.** Layer-1 discipline: don't read what you'd only trust yourself not to emit.
- **Fetch-level `next:{revalidate}` "matches github.ts" (all base plans) vs ineffective on POST (architect critique F3).** → **Route-segment `revalidate` only;** no misleading fetch-level directive.
- **`spine → university` edge (product/design topology) vs remove (product critique H2).** → **Remove.** No such data flow exists; a fabricated edge is a self-inflicted wound on the honesty centerpiece.
- **Systems lens node-status taxonomy** (live / instrumenting / planned, enforced in component layer) → **adopted** as the `NodeStatus` union — the strongest structural idea for making honesty a first-class, self-labeling property rather than prose.

Files to CREATE: `lib/sources/linear.ts`, `lib/sources/linear.test.ts`, `lib/sources/cockpit-linear.ts`, `lib/sources/spine.ts`, `lib/supabase/spine.ts`, `lib/sources/system-status.ts`, `lib/sources/system-status.test.ts`, `content/system-map.ts`, `app/system/page.tsx`, `app/cockpit/page.tsx`, `components/system/{SystemMap,SystemDiagram,NodeDetail,MobileSystemList}.tsx`, `lib/ui-constants.ts`, `lib/format.ts`.
Files to EDIT: `app/page.tsx` (line 25 toggle), `scripts/verify-egress.ts` (Linear projection block), `.env.example` (`LINEAR_API_KEY`, `LINEAR_TEAM_KEY`, cockpit project id, `SPINE_SUPABASE_URL`, `SPINE_SUPABASE_ANON_KEY`).
Files verified already-wired (no change): `lib/public-safety.ts`, `lib/sources/github.ts`, `lib/sources/learning.ts`, `lib/supabase/public.ts`, `lib/supabase/admin.ts`, `lib/auth.ts`, `middleware.ts`, `.github/workflows/ci.yml`.