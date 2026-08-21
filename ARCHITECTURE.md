# The Hub

One Next.js app. Two audiences. Three depths. A live, projection-based surface — a management
**cockpit** plus a public **dashboard-as-portfolio** — useful from day one and compounding into
the portfolio. Standalone repo; reads its data sources (a separate private workspace) over
external APIs and never vendors private state.

**Status:** V0 (2026-06). The Work, Live page renders from GitHub.

---

## 0. Confidentiality & PII contract — READ FIRST (risk #3)

The public surface reads from systems full of PII and employer-confidential data. Leaks here
are the single most likely Phase 1 mistake. The control is **default-deny, defense in depth.**

### Threat model

| Source | Leak vector |
|---|---|
| GitHub | Commit **author email** (in every commit), names/secrets in messages or diffs |
| Linear | Named contacts, target companies, deal data, **employer-confidential** matter |
| Notion | Embedded prospect/customer PII inside artifacts |
| Supabase | People/Companies rows — emails, LinkedIn URLs |

> Note the second axis beyond GDPR PII: **employer / outreach confidentiality.** Sensitive CRM
> and outreach data must never reach a public surface. The publish gate (layer 2) handles this —
> that content simply never gets marked public.

### Three layers

1. **Allowlist projection (type-enforced).** Public renderers consume only `Public*` types
   that omit PII *at the type level*. Leaking a field is a TypeScript compile error, not a
   runtime hope. The GitHub raw type (`lib/sources/github.ts`) does not even declare
   `author.email` — we cannot render what we never read.
2. **Publish gate (private by default).** Nothing is public unless explicitly marked: Linear
   `public` label, a repo allowlist, tagged Notion pages. Default-deny.
3. **Egress scrubber + CI gate.** `assertPublicSafe()` (`lib/public-safety.ts`) serializes the
   assembled public payload and scans for email/phone/LinkedIn patterns + a denylist of
   sensitive entities. On a hit it **throws**, failing the build/test. Shipped as the first
   module, with `public-safety.test.ts`, before any page existed.

### Operational rules
- Every public data fetch ends with `assertPublicSafe(payload, where)`.
- The cockpit (Tier 3) is the only place raw/sensitive data appears, and it is auth-gated.
- Supabase public reads go through `v_public_*` views that exclude PII columns by construction.
- Audit the rendered public JSON before the first public deploy.

### Advisor exceptions (accepted-by-design)

The Supabase Security Advisor flags the three public projection views as **CRITICAL
`security_definer_view`** (`public.v_public_curriculum`, `v_public_progress`, `v_public_submissions`).
This is a **true-positive detection but accepted-by-design** — do **not** "fix" it by flipping to
`security_invoker`:

- The views are the deliberate **anon window**. Anon holds no grant on `learning.*` (no schema
  USAGE, no table SELECT) and reads only these narrow, explicit-column, PII-free views. DEFINER
  semantics (view runs as owner, bypassing RLS) are *required* for anon to get any rows.
- Supabase's suggested fix (`security_invoker = true`) is a **security downgrade here**: an invoker
  view runs as anon, so keeping it working would force `GRANT SELECT` on the `learning.*` base
  tables to anon plus RLS policies — giving anon direct base-table access and column-level PII
  exposure on any "public" row. Larger surface, weaker contract.
- With RLS bypassed, the **view definition is the PII boundary**. It is guarded two ways: explicit
  column lists (never `select *`; rule above), and `lib/public-view-safety.test.ts`, a CI test that
  fails any PR adding a private/PII column (`body_md`, `auth_user_id`, email/linkedin, etc.) to a
  `v_public_*` view.

Disposition: these three lints are **dismissed with a rationale pointing here** in the Advisor UI so
the dashboard stays clean and future *real* findings aren't buried. `function_search_path_mutable`
(the two `learning.*` helpers) is a genuine gap and **is** fixed — `supabase/migrations/0005_advisor_hardening.sql`.

---

## 1. Surfaces — progressive disclosure

A visitor descends only as far as their interest takes them.

| Tier | View | Route | Audience | Auth |
|---|---|---|---|---|
| 1 | **The Work, Live** (leads) | `/` | Recruiter / hiring manager / anyone | public |
| 2 | **Living System Map** (drill-in) | `/system` | Technical interviewer / curious engineer | public |
| 2 | **Signal** (topic intelligence) | `/signal` | Technical interviewer / curious engineer | public |
| 2 | **GTM University** (learning) | `/university` | Recruiter / interviewer | public |
| 3 | **The Cockpit** (operate) | `/cockpit` | Alex daily; shown selectively in interviews | gated |

A tier nav on the public site moves between the Tier-1/2 surfaces. Same data, progressive depth.
`/signal` and `/university` are **Tier-2 sibling surfaces** — dedicated homes for datasets too rich
to inline on The Work, Live. (`/signal` records a deliberate divergence from §9's original "render on
The Work, Live" intent — see §9.)

---

## 2. Stack
**Installed now** (`package.json`): Next.js App Router (15.5 → **16 + Cache Components is a tracked upgrade**) · TypeScript · Vercel · Tailwind v4 (CSS-first `@theme`) · `@supabase/supabase-js` · `server-only` · `posthog-js` (public-page pageview analytics, PII-safe + env-gated — see `instrumentation-client.ts`). Package manager: bun. Standalone repo deployed to Vercel.
**Planned, NOT yet installed** (do not assume these are present): shadcn/ui (cockpit build-out) · recharts (charts) · Framer **Motion** (animation — Framer-Motion, not Framer-the-builder). Add them when the cockpit/System-Map build actually needs them.

---

## 3. Data sources — the projection layer
The dashboard owns **near-zero canonical state**. It is a read/aggregation layer over the
sources of truth — `source_of_truth_discipline` made visible:

```
Linear  (GraphQL) → what's next · in-progress · blockers · logged ideas (label: idea)
GitHub  (REST)    → shipped: commits · PRs · releases   → "The Work, Live"
Notion  (API)     → produced artifacts: writeups · briefs · drafts
Supabase          → metrics · evals · signals · funnel  (lights up W3→W7→W9)
roadmap doc → structural skeleton: domains · milestones · funnel
```

This also fixes the plan-tracker's flaw: it stored status in IndexedDB, duplicating Linear.
V2 reads status *from* Linear.

---

## 4. Freshness model
**Snapshot, not per-request live pull.** A Vercel Cron job (+ Linear/GitHub webhooks for
instant) reads sources, normalizes, writes a `dashboard_snapshot` to Supabase; Server
Components render from Supabase. Why: render never blocks on a flaky upstream; trend history
for free; **it's the same ingest→normalize→store→project pattern as Capstone 1** — building the
Hub is practice for the capstone. *V0 exception:* direct cached reads (ISR `revalidate`) so the
Hub isn't blocked on the spine; migrate to the snapshot path once the W3 schema lands.

---

## 5. Auth
Public (Tiers 1–2): unauthed, ISR, PII-safe `v_public_*` projections only. Cockpit (Tier 3):
`/cockpit/*` behind a password middleware for V0/V1 → Clerk free tier if a second viewer needs
in (matches §8's "Clerk in Phase 2").

---

## 6. What's live when (no fabricated numbers)

| Panel | Source | Live |
|---|---|---|
| Shipped stream (commits/PRs/releases) | GitHub | V0 (now) |
| What's next · in-progress · blockers · ideas | Linear | V0–V1 |
| Plan progress (domains/milestones/funnel) | repo + Linear | V0–V1 |
| Artifacts (writeups, briefs) | Notion | V1 |
| Eval runs (pass/fail, rubric) | Supabase `eval_runs` | W7 |
| Funnel · signal precision · run health | Supabase | W9 |

Empty panels render as `⊘ instrumenting — wired, awaiting first run`. Never fake numbers.

---

## 7. Phased build (against 6–10 hr/wk)
- **V0 — W3 (~6–8 hrs):** scaffold + safety layer + The Work, Live (GitHub) → deploy. *This file + the safety module is the start.*
- **V1 — W4–6 (~8 hr/wk):** Cockpit (authed; migrate plan progress off IndexedDB → Linear) + Living System Map + Notion artifacts; move to snapshot-via-Supabase; wire honest empty panels.
- **V2 — W7–9 (passive):** eval panels light up (W7), funnel/signals (W9). **This becomes the §8 R2 dashboard milestone** — shell front-loaded, data catches up.

---

## 8. Tracking
- **Linear** — issues (V0 / V1 / V2) in the project *gtm-OS Hub — Dashboard-as-Portfolio*. Single source of truth for open work.
- **ChatPRD** — the product-requirements / product-intent doc.
- **Data sources** live in a separate private workspace; this repo reads them over external APIs only and never vendors private state into its own tree.

---

## 9. Relationship to gtm-os — the R2 dashboard decision (resolved 2026-08-06)

**The R2 measurement dashboard IS the Hub.** There is no separate `gtm-os/apps/dashboard` — it
was never built, and the R2 role was absorbed here when the Hub became its own repo (extraction
2026-06-13). The gtm-os roadmap says the Hub "reaches R2-dashboard completeness"; this section
makes that authoritative from the Hub side. (Stale `apps/dashboard` pointers remain in
`gtm-os/Phase_1/architecture.md:377,404` — drift for that thread to clean up.)

The R2 surface splits on PII, along the boundary the Hub already has:

| Half | Renders | Surface | Read path |
|---|---|---|---|
| **Public** | topic movement · intersections · bridge people | Tiers 1–2 (public) | anon key + `signal_read.*` views (PII-safe by construction) |
| **Private** | conflict-log review · eval runs · funnel · the "V1 assumptions" tripwire strip | Cockpit (Tier 3) | service-role, server-side, auth-gated |

- **Coupling = the `signal_read` view contract** (gtm-os architecture §6 / D0) — the database-native
  equivalent of an API; the Hub reads `signal_read.*`, never writes `signal.*`, shares no code.
- **Public views must be anon-grantable** (mirror `learning.*`'s `v_public_*` pattern) — the public
  egress contract can't ride a service-role key. This reconciles the internal contradiction in gtm-os
  architecture.md (line 402 "dashboard uses anon key + RLS" vs line 404 "service-role server-side"):
  **anon for the public half, service-role only in the cockpit.**
- **Every public `signal_read` payload still ends with `assertPublicSafe`** (§0). The spine node and
  topic panels sit behind the same egress gate as GitHub / Linear / University. Bridge people reach a
  public surface only via the allow-listed `PublicBridgePerson` projection (name + public title +
  themes; never email/linkedin/phone) plus the suppression gate.
- **Red-flag #4 gate** ("no sixth content skill before the R2 dashboard exists") is satisfied when the
  Hub renders the `signal_read` topic views — i.e. **Hub Slice-1 rendering IS the R2 gate.**

### 9.1 Render status (Slice 1 Section B / YED-122 — updated 2026-08-07)

Build spec: `docs/SLICE_1B_SIGNAL_RENDER_SPEC.md`. Adapter `lib/sources/topic-intelligence.ts`
(counts-only, `assertPublicSafe` on every path), surface `app/signal/page.tsx`.

- **Surface:** the topic views render on a **dedicated `/signal` Tier-2 surface** (§1), *not* inlined
  on The Work, Live as this section originally implied — a 30-theme / 124-pair dataset warrants its
  own home. Linked from `/` and `/system` (spine node deep-links to it). Deliberate divergence.
- **Live today:** movement (30 themes, tiered 10/10/10 disclosure) + intersections (ranked, with
  bridge **counts**). Honest-empty (`INSTRUMENTING`) until the spine's exposed-schemas toggle
  (`signal_read`) + `SPINE_SUPABASE_*` env land — no fabricated numbers cross the gate.
- **Deferred, so red-flag #4 is only PARTIALLY cleared:** the `topic_intelligence_health` tripwire
  strip (YED-122 scope) — its view is in schema `signal`, not `signal_read`, so it needs a gtm-os
  `signal_read` wrapper or cockpit-only rendering; and **public bridge people** (`PublicBridgePerson`)
  which stay gated until `signal.suppression` day-1 rows are seeded. Counts-only until then.
