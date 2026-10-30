---
name: local-dev
description: How to run the gtm-os-hub Next.js app locally in the sandbox (bun, no local DB)
---

# local-dev — gtm-os-hub

Recorded from the onboarding run on 2026-10-30 (fresh checkout, all checks green).

## Steps
1. **Deps:** `bun install` (bun 1.3.x). If a pre-built root-owned `node_modules` exists (sandbox
   image artifact), `bun install` fails with `EEXIST` linking errors and plain `rm` gets permission
   denied — fix with `sudo rm -rf node_modules && bun install`.
2. **Env:** `cp .env.example .env`. All variables are optional — without tokens the app renders
   labelled fixtures (`⊘ instrumenting`), never fake counts. Real data needs `GITHUB_TOKEN`
   (fine-grained, read-only Contents on AlexYedi/gtm-os); `/signal` needs `MI_SUPABASE_URL`/`ANON_KEY`.
3. **Run:** `bun dev` → Next.js prints `Local: http://localhost:3000`. Parse the port from that
   output; no leftover `.next/dev-server.lock` issues observed.
4. **Verify primary flow:** curl `/`, `/system`, `/signal`, `/university` — expect HTTP 200 and
   `instrumenting` fixture panels on data-driven surfaces (that is the honest-empty state working).
   `/cockpit` is auth-gated (needs `COCKPIT_PASSWORD`).
5. **Proof:**
   - `bun test` → 54 pass / 0 fail across 8 files (egress guard, curriculum, sources).
   - `bun run typecheck` → clean.
   - `bun run build` → production build succeeds.

## Notes
- No Docker/Compose and no local Postgres — Supabase projects are external; there is nothing to
  migrate/seed locally.
- `bun run scripts/verify-egress.ts` proves the PII egress contract on real GitHub data (requires
  `GITHUB_TOKEN`); run it before any real-data work.
- Dev server was verified running during snapshot capture; snapshot template
  `31p3urzwou17jtounas3:default` (2026-10-30T15:20:16Z) restores the working state.
- **Do not run `bun run build` while `bun dev` is running** — both share `.next/`; the build
  clobbers the dev server's cache and causes `TypeError: a[d] is not a function` → HTTP 500s.
  Fix: stop dev, `rm -rf .next`, restart (`bun dev`), all routes recover to 200.
