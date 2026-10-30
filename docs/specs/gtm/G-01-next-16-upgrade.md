# G-01 · Next 16 upgrade (GTM)

**Linear:** GTM-8 (item 4, "Next.js 16 + Cache Components upgrade") · **Repo:** gtm-os-hub

## Technical
- Upgrade `next` from `^15.5.0` to Next 16, following the official upgrade guide.
  - Read the installed package's `node_modules/next/dist/docs/` after the bump.
  - Match the version `AlexYedi/empire-state-hub` runs (`16.2.x`) unless the guide says otherwise.
- Migrate the APIs the guide marks breaking: async request APIs, caching defaults, config keys.
  - Each route's `export const revalidate` behaviour MUST be preserved. Data freshness here is part of the "no fabricated numbers" contract.
- Adopt Cache Components **only** where the guide makes it the replacement for an existing pattern. No new caching behaviour beyond that.
- Update `CLAUDE.md` and `.obvious/obvious.md`, which still say "Next.js 15.5".

## Must not
Change any `lib/public-safety*` file · change the PostHog config · change data adapters beyond the API migration.

**Done when:** `bun run typecheck && bun test && bun run build` pass, every route renders in `bun dev` (list them in the PR), and the 54 existing tests still pass.
