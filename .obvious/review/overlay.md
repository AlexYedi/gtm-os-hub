# Review overlay: gtm-os-hub

Read `AGENTS.md` and `ARCHITECTURE.md` §0 first.

## Blocker (score ≥ 90) if the PR:
- adds a public fetch path that doesn't end in `assertPublicSafe`
- changes the logic in `lib/public-safety.ts` or removes or relaxes a test in either public-safety test file
- hardcodes a company, person or account name outside fixtures marked fictional
- renders a number with no measured source (a fabricated or estimated value)
- writes to Supabase, Linear or Notion
- enables PostHog autocapture or session recording, or includes `/cockpit/*` in analytics
- renames a curriculum `unit_id`
- commits `.env*`

## High scrutiny
- New `lib/sources/*` adapters: EMPTY on error, `Public*` return types.
- `/cockpit/*`: must stay behind `lib/auth.ts`.

## Expected in every PR body
The spec ID (G-n), and the output of `bun run typecheck && bun test && bun run build`.
