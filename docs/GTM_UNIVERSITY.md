# GTM University

A de-time-boxed, **self-instrumented** full-stack GTM learning experience built into the Hub. It
presents an elevated 9-domain curriculum, captures submitted work + **time-on-task**, and forecasts
remaining effort from real velocity. It doubles as a public portfolio artifact — the rung-1
"data foundation" discipline applied reflexively to learning.

- **PRD:** ChatPRD — "GTM University — PRD (v1)"
- **Tracking:** Linear YED-98 (+ YED-99/100/101) · project *gtm-OS Hub — Dashboard-as-Portfolio*
- **Data plane:** Supabase `GTM_OS_HUB` (ref `nnywrmetdoixdbevvsvf`) → `learning` schema. (Note: the original `gtm-os-project` spine was deleted during a Supabase reorg on 2026-06-27; the schema was rebuilt verbatim from these migrations into `GTM_OS_HUB`.)

## Two planes (and why the Hub still owns "zero state")

The Hub now runs two planes:

1. **Projection plane** (existing) — reads external systems of truth (GitHub/Linear/Notion) read-only.
2. **Learning data plane** (new) — a first-party store in Supabase `learning`, *born in the cockpit*.

The invariant is preserved: **the public surface still owns zero canonical state.** `/university`
only reads PII-safe `public.v_public_*` views; the only writer is the auth-gated cockpit.

## Curriculum = content-as-code

The curriculum is authored in `content/curriculum/` (typed manifest). It is the source of truth;
`scripts/sync-curriculum.ts` projects it into `learning.curriculum_unit` (a derived cache) so SQL
can roll up progress + time. **`unit_id` slugs are immutable cross-table keys — never rename.**

```
bun run sync:curriculum:sql   # print idempotent upsert SQL (apply via migration / MCP)
bun run sync:curriculum       # live upsert (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
```

## Schema (supabase/migrations)

- `0001_learning_init.sql` — `learner`, `curriculum_unit`, `unit_progress`, `submission`,
  `time_entry`. Pure-SQL UUIDv7 (no extension), generated `duration_seconds`, a partial-unique
  **single-running-timer** guard, idempotency keys, RLS (written, dormant in V1).
- `0002_learning_views.sql` — internal rollup/forecast views + PII-safe public projections.
  Pace (time totals + forecast) has **no** anon-granted view → cockpit-only by construction.
- `0003_writer_rpcs.sql` — `SECURITY DEFINER` write RPCs in `public`, EXECUTE → `service_role` only.
  Keeps `learning` internal; timer-stop/status are atomic.
- `0004_cockpit_reader.sql` — `uni_cockpit_state()` pace reader (service_role only).

## Read / write boundary

- **Public read** (`/university`): anon/publishable key → `public.v_public_*` views → mapped to
  `Public*` types → `assertPublicSafe()` egress gate. ISR `revalidate = 900`.
- **Cockpit write** (`/cockpit/university`): Server Actions → service-role client → write RPCs.
  Every action calls `assertCockpit()` first (Server Actions are public POST endpoints; the
  middleware only gates navigation). Service-role key is `server-only`, never `NEXT_PUBLIC_`.

## Forecast

Velocity = logged hours per complexity-point over completed sub-tasks × remaining complexity.
Honest cold-start: **suppressed until ~4 sub-tasks are done** (`cold_start → warming → live`).
Pace + forecast are cockpit-only (see YED-101 to flip public).

## Testing

- `lib/sources/learning.test.ts` — the PII egress gate for the learning adapter (CI-enforced,
  alongside `lib/public-safety.test.ts`). `bun test lib/`.
- `bun run typecheck` · `bun run build`.

## Go-live (cockpit) — YED-99

1. Add `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API → service_role) + a real
   `COCKPIT_PASSWORD` to `.env.local` (and Vercel env).
2. `bun dev` → sign in at `/cockpit/login` → run a timer + submit work → see it on `/university`.
3. Start logging real time so the forecast calibrates.
