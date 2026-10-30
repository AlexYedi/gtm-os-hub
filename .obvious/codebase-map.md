# Codebase map — gtm-os-hub

Depth-2 view. The app is a Next.js projection layer over external sources (GitHub, Linear,
Notion, Supabase); it owns no canonical state.

| Path | Kind | What it is |
|---|---|---|
| `app/` | routes | Next.js App Router: `/` (The Work, Live), `/system`, `/signal`, `/university`, `/cockpit` (auth-gated) |
| `app/cockpit/` | routes | Private management surface: `login/`, `university/` actions + pages, main cockpit page |
| `app/{signal,system,university}/` | routes | Public drill-downs (one `page.tsx` each) |
| `components/` | ui | Presentational components mirroring routes |
| `components/system/` | ui | `SystemMap`, `SystemDiagram`, `NodeDetail`, `MobileSystemList` |
| `components/signal/`, `components/university/` | ui | Signal & University render primitives |
| `content/` | data | Content-as-code: `system-map.ts` topology, `curriculum/` learning content |
| `lib/` | core | Domain logic + safety: `public-safety.ts` (PII egress guard), `auth.ts`, `curriculum.ts`, `format.ts`, `supabase/` clients |
| `lib/sources/` | adapters | Source adapters — each returns PII-safe `Public*` types (`github.ts`, `linear.ts`, `cockpit.ts`, `cockpit-linear.ts`, `learning.ts`) + tests |
| `scripts/` | tools | `verify-egress.ts` (PII contract on real data), `sync-curriculum.ts`, `check-signal.ts` |
| `supabase/migrations/` | db | Supabase migrations (external Supabase projects, not local) |
| `docs/` | docs | Build specs + build journal: `PHASE_1_BUILD_SPEC.md`, `SLICE_1B_SIGNAL_RENDER_SPEC.md`, `GTM_UNIVERSITY.md`, `build-journal.md` |
| `.github/workflows/` | ci | `ci.yml` (egress tests etc.), `supabase-health.yml` |

Key invariants: public renderers consume only `Public*` types; every public fetch ends with
`assertPublicSafe()`; empty panels render `⊘ instrumenting`, never fabricated counts.
