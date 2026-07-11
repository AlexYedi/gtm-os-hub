<project_architecture>
## gtm-os Hub — Dashboard-as-Portfolio

### What this is
A live, projection-based hub. One Next.js app, two audiences, three depths:
- **The Work, Live** (`/`) — public proof-of-work stream (shipped commits / PRs / releases).
- **Living System Map** (`/system`) — public technical drill-down (interactive architecture).
- **The Cockpit** (`/cockpit`) — private, auth-gated management surface.

It is a **projection layer**: it owns ~zero canonical state and reads its data sources
(GitHub, Linear, Notion, Supabase) over external APIs. The data lives in a separate private
workspace; this repo never vendors private state into its own tree.

Full design lives in **`ARCHITECTURE.md` — start with §0, the PII contract.**

### Non-negotiable guardrails
1. **PII / confidentiality egress is risk #1.** Every public data fetch ends with
   `assertPublicSafe(payload)` (`lib/public-safety.ts`). Default-deny, defense in depth:
   (a) **type-enforced allowlist** — public renderers consume only `Public*` types that omit PII
   at the type level (leaking a field is a compile error); (b) **publish gate** — nothing is
   public unless explicitly marked; (c) **egress scrubber** — scans for email / phone / LinkedIn
   patterns plus the `PII_DENYLIST` env terms and **throws** on a hit. CI runs the egress tests on
   every change to keep the guard enforced, not aspirational.
2. **Public code ≠ public data.** The code is (or will be) public; the data it reads stays private
   behind tokens and Supabase RLS `v_public_*` views. **Never hardcode confidential names in
   source** — employer / account / prospect names live only in `PII_DENYLIST` (env). Keep the repo
   free of secrets and confidential references; audit before flipping public.
3. **No fabricated numbers.** Empty panels render `⊘ instrumenting — wired, awaiting first run`.
   Never substitute estimates for measured values.
4. **Projection layer, not a source of truth.** Never duplicate state — point. Linear = open work;
   GitHub = code state; Notion = artifacts; Supabase = metrics. Read them; don't mirror them.
5. **Human-in-the-loop before publishing.** Going public (repo or deployment) is a deliberate,
   gated step — verify real-data egress locally first, then a protected preview, then public.

### Stack
Next.js App Router (15.5; Next 16 + Cache Components is a tracked upgrade) · TypeScript ·
Tailwind v4 (CSS-first `@theme`) · `@supabase/supabase-js` · `posthog-js` (public-page pageview
analytics — see below) · bun · Vercel. `lib/sources/*` are the source adapters — each returns
PII-safe `Public*` types. **Not yet installed (planned):** recharts (charts), Framer Motion
(animation), shadcn/ui (cockpit) — add when the build needs them.

**Analytics (PostHog):** `instrumentation-client.ts` (Next auto-loads it). **PII-safe by design and
env-gated** — dormant unless `NEXT_PUBLIC_POSTHOG_KEY` is set. Pageviews only; **autocapture OFF,
session recording OFF**; the private `/cockpit/*` surface is excluded via `before_send`. Project:
`gtm_os_hub` (PostHog US cloud). Key is a *publishable* project key (client-safe by design).

### Commands
- `bun install` · `bun dev` → http://localhost:3000
- `bun test lib/public-safety.test.ts` — the egress guard (dependency-free)
- `bun run build` — production build
- `bun run scripts/verify-egress.ts` — proves the PII contract on real data (needs `GITHUB_TOKEN`)

### Env (see `.env.example`)
`GITHUB_TOKEN` (fine-grained, read-only Contents) · `GTM_OS_REPO` · `PII_DENYLIST` (confidential
terms — private) · `LINEAR_API_KEY` (V1) · `COCKPIT_PASSWORD` (V1) · `NEXT_PUBLIC_POSTHOG_KEY` +
`NEXT_PUBLIC_POSTHOG_HOST` (publishable analytics key; dormant if unset). Secrets in `.env`
(gitignored) / Vercel env only — never committed.

### Tracking (single sources of truth)
- **Linear** project *gtm-OS Hub — Dashboard-as-Portfolio* — open work (V0 / V1 / V2).
- **ChatPRD** — product-requirements doc.

### Data sources (private workspace, read over APIs)
This Hub reads — but does not own — data in a separate private repo/workspace (the signal
pipeline). Coordination is API-only; no shared code, no cross-repo imports.

### MCP
Project-scoped MCP config is intentionally NOT committed (public repo). A dev session inherits
user-scope MCP connectors (Linear, etc.). Add a gitignored `.mcp.json` for project-scoped servers
if needed; never commit one carrying secrets.
</project_architecture>
