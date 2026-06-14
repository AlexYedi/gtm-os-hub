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
app/                 # routes — / (The Work, Live)
components/           # presentational
lib/public-safety.ts # the PII egress guard (the first module, with CI gate)
lib/sources/         # source adapters — each returns PII-safe Public* types
```

## Status
V0 (2026-06). The Work, Live renders from GitHub. Next: Linear wiring + Cockpit (V1).
