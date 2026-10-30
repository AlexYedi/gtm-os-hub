# gtm-os-hub — The Hub (Dashboard-as-Portfolio)

One Next.js App Router app, two audiences, three depths: The Work, Live (`/`), Living System Map
(`/system`), Cockpit (`/cockpit`, auth-gated). Also `/signal` and `/university`. It is a
**projection layer** — it owns ~zero canonical state and reads GitHub / Linear / Notion / Supabase
over external APIs.

**Non-negotiable guardrails (see CLAUDE.md / ARCHITECTURE.md §0):**
1. PII/confidentiality egress is risk #1 — every public fetch ends with `assertPublicSafe(payload)`.
2. Never hardcode confidential names in source — they live only in `PII_DENYLIST` (env).
3. No fabricated numbers — empty panels render `⊘ instrumenting`.
4. Projection layer, not a source of truth — read sources, don't mirror them.

## Stack
- Next.js 16 (App Router; Turbopack default; `cacheComponents` not enabled) · TypeScript · Tailwind v4 (CSS-first `@theme`)
- `@supabase/supabase-js` · `posthog-js` (env-gated, pageviews only)
- Package manager / runtime: **bun** (bun 1.3.x; Node 20 present)

## Commands
```bash
bun install          # deps
bun dev              # dev server → http://localhost:3000 (port from startup output)
bun run typecheck    # tsc --noEmit
bun test             # bun test runner (54 tests across 8 files)
bun run build        # production build
bun run scripts/verify-egress.ts   # proves PII contract on real data (needs GITHUB_TOKEN)
```

## Env
Copy `.env.example` → `.env`. **Every variable is optional in local dev** — without tokens the app
renders clearly-labelled fixtures (`⊘ instrumenting` panels), never fake counts. Key vars:
`GITHUB_TOKEN` (fine-grained, read-only Contents) · `GTM_OS_REPO` · `LINEAR_API_KEY` ·
`COCKPIT_PASSWORD` · `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` (public read) ·
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (secret write path) · `MI_SUPABASE_URL`/`ANON_KEY`
(/signal read path) · `NEXT_PUBLIC_POSTHOG_KEY`/`HOST` · `PII_DENYLIST`.
Secrets live in `.env` (gitignored) or Vercel env — never committed.

## Codebase map
| Path | What it is |
|---|---|
| `app/` | Routes: `/` (Work, Live), `/system`, `/signal`, `/university`, `/cockpit` (gated, incl. `login/`, `university/`) |
| `components/` | Presentational components mirroring routes (`system/`, `signal/`, `university/`, `WorkStream.tsx`) |
| `content/` | Content-as-code: system-map topology (`system-map.ts`), `curriculum/` |
| `lib/` | `public-safety.ts` (PII egress guard + tests), `sources/` (source adapters returning PII-safe `Public*` types), `auth.ts`, `curriculum.ts`, `supabase/` |
| `scripts/` | `verify-egress.ts`, `sync-curriculum.ts`, `check-signal.ts` |
| `supabase/` | Supabase project dir: `migrations/` |
| `docs/` | Build specs + build journal (PHASE_1_BUILD_SPEC, SLICE_1B, GTM_UNIVERSITY) |
| `.github/workflows/` | CI (`ci.yml`) and supabase health check |

## Local verification
1. `bun install` → `bun dev` → curl `/`, `/system`, `/signal`, `/university` (all 200; fixture panels render `instrumenting`).
2. `bun test` → 54 pass, 0 fail.
3. `bun run typecheck` → clean.
4. `bun run build` → succeeds.
All verified during onboarding (2026-10-30). No local DB required — Supabase is external; no
Docker/Compose in the repo.

## Sandbox snapshot
- Snapshot ID/template: `31p3urzwou17jtounas3:default`
- Captured: 2026-10-30T15:20:16.407Z (from a fresh checkout with deps installed, dev server verified)

## Gotchas
- A pre-built root-owned `node_modules` in the sandbox image breaks `bun install` (`EEXIST` /
  permission denied on rm). Fix: `sudo rm -rf node_modules && bun install`.
- The repo is destined to go public — keep it free of secrets and confidential references; audit
  egress before flipping public.

## Work queue and rules

- **Rules:** `AGENTS.md`, plus the `gtm-hub-guardrails` skill (its invariants load on every turn).
- **Specs:** `docs/specs/gtm/` (G-01, G-02, G-03). The cross-repo index is in `AlexYedi/Empire_State_Events_Pipeline_Take_3`, `docs/specs/README.md`.
