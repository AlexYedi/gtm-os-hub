---
name: gtm-hub-guardrails
description: Rules for gtm-os-hub (the dashboard-as-portfolio): the three-layer PII contract, the projection-layer rule, honest empty states, immutable curriculum keys, and verify commands. Load for any change under app/, lib/, content/ or scripts/.
triggers:
  - public
  - panel
  - cockpit
  - signal
  - university
  - curriculum
  - supabase
---

# gtm-os-hub guardrails

`ARCHITECTURE.md` §0 is the source of truth for the PII contract. Its three layers:
1. **Type-enforced allowlist:** public renderers take `Public*` types only, so a leaked field is a compile error.
2. **Publish gate:** nothing is public unless explicitly marked.
3. **Egress scrubber:** `assertPublicSafe` throws on email, phone or LinkedIn patterns and `PII_DENYLIST` terms.

## Guarded files (agents: tests-only)
`lib/public-safety.ts` · `lib/public-safety.test.ts` · `lib/public-view-safety.test.ts` · `lib/auth.ts` · `instrumentation-client.ts`.

## Data adapters
`lib/sources/*` each returns `Public*` types. A new adapter copies the pattern in `lib/sources/topic-intelligence.ts`:
- no client → an EMPTY payload;
- any query error → EMPTY for the whole payload;
- `assertPublicSafe` on every path.

## Verify
`bun run typecheck` · `bun test` · `bun run build`.
