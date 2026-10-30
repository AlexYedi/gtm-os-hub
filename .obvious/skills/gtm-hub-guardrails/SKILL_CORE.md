Invariants for every task in gtm-os-hub. They must never be violated:
- Every public data fetch ends with assertPublicSafe(payload). Public renderers use only Public* types.
- NEVER weaken lib/public-safety.ts or its tests. Adding test cases is allowed.
- NEVER hardcode confidential names (employers, accounts, prospects). They live only in the PII_DENYLIST env.
- NEVER fabricate numbers. Empty panels render "⊘ instrumenting".
- NEVER write to Supabase, Linear or Notion from tests or the sandbox. Use fixtures.
- curriculum unit_id slugs are immutable. Only add.
- PostHog: pageviews only. No autocapture, no session recording; /cockpit excluded.
- Before the PR: bun run typecheck && bun test && bun run build. Put the spec ID (G-n) in the PR title.
