# The Hub — Dashboard-as-Portfolio

A live, projection-based hub: **The Work, Live** (public proof-of-work) → **Living System Map**
(public technical drill-down) → **Cockpit** (private management). One Next.js app, two audiences,
three depths. It reads its data sources (Linear / GitHub / Notion / Supabase) over external APIs
and owns ~zero canonical state.

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full design — start with §0, the PII contract.

## Run locally

```bash
bun install
cp .env.example .env   # optional; without GITHUB_TOKEN, dev uses a labelled fixture
bun dev                # http://localhost:3000
```

## Test the safety layer (no install needed)

```bash
bun test lib/public-safety.test.ts
```

## Verify the PII egress contract against real data

```bash
bun run scripts/verify-egress.ts   # needs GITHUB_TOKEN in .env
```

## Layout
```
app/                 # routes — / (The Work, Live) · /system · /signal · /university · /cockpit (gated)
components/           # presentational
content/              # content-as-code (system-map topology, curriculum)
docs/                 # build specs + build journal (the "arc")
lib/public-safety.ts # the PII egress guard (the first module, with CI gate)
lib/sources/         # source adapters — each returns PII-safe Public* types
```

## Status
- **V0** — The Work, Live (GitHub). ✅ shipped.
- **V1** — Living System Map, counts-only Linear roadmap, GTM University, cockpit board. ✅ shipped.
- **Signal** (`/signal`) — topic-intelligence render over the signal-spine `signal_read` views
  (counts only, PII-safe). ✅ built; renders honest-empty until the spine read path is opened
  (exposed-schemas toggle + `SPINE_SUPABASE_*` env). See `docs/SLICE_1B_SIGNAL_RENDER_SPEC.md`.
- **Next** — Notion artifacts adapter; then eval/funnel panels light up (V2).

Every surface is a projection — no fabricated numbers; empty panels render
`⊘ instrumenting — wired, awaiting first run`.
