# AGENTS.md

**Read `CLAUDE.md` and `ARCHITECTURE.md` §0 (the PII contract) first.** This repo is public. The data it reads is private.

## Rules every automated change follows
1. Every public data fetch must end with `assertPublicSafe(payload)` (`lib/public-safety.ts`). Public renderers consume only `Public*` types.
2. You must never edit or weaken `lib/public-safety.ts`, `lib/public-view-safety.test.ts` or `lib/public-safety.test.ts`, except to **add** test cases.
3. You must never hardcode confidential names (employers, accounts, prospects). They live only in the `PII_DENYLIST` env.
4. No fabricated numbers. An empty panel renders `⊘ instrumenting — wired, awaiting first run`.
5. Projection layer only: read Linear, GitHub, Notion and Supabase. Never mirror their state into the repo.
6. PostHog stays pageview-only (no autocapture, no session recording), and `/cockpit/*` stays excluded.
7. `curriculum` `unit_id` slugs are immutable cross-table keys. Add new ones; never rename existing ones.
8. Verify with `bun run typecheck && bun test && bun run build` before the PR.
9. Specs live in `docs/specs/gtm/`. The cross-repo index is in `AlexYedi/Empire_State_Events_Pipeline_Take_3`, `docs/specs/README.md`. Put the spec ID (G-n) in the PR title.
