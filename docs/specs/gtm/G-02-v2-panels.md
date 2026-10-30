# G-02 · V2 panels + topic-movement filter (GTM)

**Linear:** GTM-8 · YED-249 (hub part) · **Repo:** gtm-os-hub

## 1 · Topic-movement filter (YED-249). A bug, ship first.
`lib/sources/topic-intelligence.ts` reads `signal_read.v_topic_movement` and `v_topic_intersections` with `window_type = all_time` but **no date filter**. The nightly compute appends a snapshot per day, so `/signal` shows one row per theme **per day**. `latestAsOf()` already computes the latest date, but nothing uses it to filter.
- **Fix:** keep only rows whose `as_of_date` equals the latest date, per view. Do it client-side after the fetch (simplest), or with an `.eq('as_of_date', …)` after a latest-date query. Justify the choice in the PR.
- **Test:** add cases to `lib/sources/topic-intelligence.test.ts` with fixture rows from two dates. Only the latest survives. A view where every row has a null date keeps all rows.

## 2 · V2 instrument panels (GTM-8)
- **Eval-run panel** (Supabase `eval_runs`) and **funnel, signal-precision and run-health panels.**
- For each panel:
  - a `lib/sources/<panel>.ts` adapter that returns a `Public*` type, following the `topic-intelligence.ts` pattern (no client or any error → EMPTY; `assertPublicSafe` on every path);
  - a component that renders `⊘ instrumenting — wired, awaiting first run` while the source is empty.
- **The tables may not exist yet.** The adapter MUST treat a missing table or view as EMPTY. Never invent a number.
- Tests for each adapter cover: empty, error, and a populated fixture that passes `assertPublicSafe`.
- Panels go on `/system` (public) or `/cockpit` (private). Put any panel whose data isn't proven PII-free on `/cockpit`.

## Must not
Create tables or views (DDL belongs to the pipeline repo's migrations and Alex) · render placeholder numbers.

**Done when:** the filter test passes and `/signal` shows one row per theme; each panel renders its honest empty state with no env; `bun run typecheck && bun test && bun run build` pass.
