# Phase 2 Build Spec — Topic-Intelligence render (`/signal`) + Orchid re-tone

Successor to `PHASE_1_BUILD_SPEC.md`. Turns the gtm-os → Hub handoff
(`SESSION_KICKOFF_topic-intel.md`, YED-122 §B) into a build. The gtm-os side is **done and
verified**; everything here is Hub-side. Two independent tracks: **A** re-tones the whole Hub to the
"Orchid" identity; **B** builds the `/signal` topic-intelligence surface.

---

## 0. What the handoff gave us

The signal-spine (`Signal_Pipeline_Analytical_Spine`, ref `abkvgihlbwfloentugtd`) exposes a
PII-safe read contract in schema `signal_read`:

| View | Columns | Access | Use |
|---|---|---|---|
| `v_topic_movement` | theme, window_type, event_count, distinct_speaker_count, momentum, trend_label, is_low_confidence, as_of_date | **anon** (PII-free) | movement table |
| `v_topic_intersections` | theme_a, theme_b, window_type, cooccurrence_event_count, bridge_person_count, is_new_pair, intersection_score, as_of_date | **anon** (counts only) | intersection ranking |
| `v_bridge_people` | display_name, current_title, theme_a, theme_b, … | **service_role ONLY** | ❌ **never rendered** |

Live today: **30 themes, 124 all-time intersections.** Trend windows (`week`/`month`) are near-empty
— the corpus ends 2026-07-17 — so `all_time` + intersections are the rich signal; the trend half is
**armed, not yet moving**.

## 1. Two external gating actions (NOT ours — Alex, in the dashboard)

The feature is fully buildable now and renders honest-empty until BOTH land:

1. **Exposed-schemas toggle** — Supabase → spine project → Settings → API → Exposed schemas → add
   `signal_read`. Until then nothing in `signal_read` is REST-reachable (deliberate egress switch).
2. **Env** — `SPINE_SUPABASE_URL` + `SPINE_SUPABASE_ANON_KEY` in Vercel (+ local `.env`). **Anon /
   publishable key only. Never the spine `service_role` key in the Hub.**

Until both exist: `spineClient()` returns `null` → adapters return honest-empty → `/signal` renders
`INSTRUMENTING`, `/system` spine node stays `instrumenting`. No fabricated numbers ever ship.

## 2. Guardrails (restate — non-negotiable)

- **Never render `v_bridge_people`** (service-role only; suppression unseeded → real names). Anon key
  can't read it; keep it that way. Bridge data surfaces as a **count** only (`bridge_person_count`).
- **Read `signal_read.*` only.** Base `signal.*` is anon-deny by design.
- Every public fetch ends with `assertPublicSafe()`. No fabricated numbers — empty → `INSTRUMENTING`.

---

## Track A — Orchid re-tone (Hub-wide)

**Decision:** the "Orchid" palette (sampled from `Design Inspo/` — a surreal botanical jungle)
becomes the Hub-wide identity, replacing warm-editorial cream/clay across `/`, `/system`,
`/university`, `/cockpit`, and the new `/signal`. Dark-first: **emerald ground + parchment ink**.

**Blast radius is one file.** Every page/component consumes semantic Tailwind-v4 tokens
(`text-ink`, `bg-paper`, `border-edge`, `var(--color-done)` …); no component holds a color literal
(audited). So the re-tone is a **value flip in `app/globals.css` `@theme`** — token *names* are kept
so no class usages change. The real work is the light→dark inversion: elevation now goes *lighter*
with height (`--color-cream` ground darkest < `--color-paper` < `--color-surface` raised), and status
colors (done/progress/pending) are remapped to read on emerald.

**Orchid tokens** — emerald + parchment, warmed with amber + coral (contrast-checked ≥ AA on the
emerald ground; ground↔surface gap widened so panels separate; magenta reserved for the data-heat
role, so brand accent is coral):

| Token | Value | Role |
|---|---|---|
| `--color-cream` | `#143029` | page ground — deep emerald (darkest) |
| `--color-paper` | `#1c3e34` | recessed container (nav, notices) |
| `--color-surface` | `#26493d` | raised card / active surface (clearly lighter) |
| `--color-ink` | `#f5efe0` | primary text — bright parchment |
| `--color-ink-muted` | `#bcc4b6` | secondary text |
| `--color-ink-soft` | `#9aa79c` | tertiary labels / hints |
| `--color-edge` | `#315448` | hairline borders |
| `--color-accent` / `-dark` | `#ee6a6a` / `#d64f4f` | brand accent = coral-rose (links, CTAs) |
| `--color-done` | `#7ccb8e` | status: live (spring green) |
| `--color-progress` | `#5aa9ce` | status: in-progress (sky) |
| `--color-pending` | `#f0972f` | status: instrumenting (amber gold) |
| `--color-signal` | `#ea5b95` | **data:** heat / momentum (dahlia magenta) |
| `--color-bridge` | `#43c2c6` | **data:** connectors / people (parrot teal) |
| `--color-newpair` | `#f0972f` | **data:** a new intersection pair (amber gold) |

**Trade-off:** touches every surface visually, but no code churn beyond `globals.css`; risk is
contrast regressions, mitigated by walking each page after the flip. Fonts (Lora serif / Inter)
unchanged. `shadow-sm` on active-tab chips leans on `bg-surface` contrast — survives the flip.

---

## Track B — `/signal` topic-intelligence surface

### B1 · Adapter + gate — `lib/sources/topic-intelligence.ts`

Mirrors `spine.ts` / `linear.ts` doctrine: PII omitted at the **type level**, honest-empty fixtures,
`assertPublicSafe()` on every return path. Reuses `spineClient()` with `.schema('signal_read')`.

```ts
export interface PublicTopicIntersection {
  themeA: string; themeB: string;
  cooccurrenceEventCount: number | null;
  bridgePersonCount: number | null;   // COUNT only — never names
  isNewPair: boolean;
  intersectionScore: number | null;
}
export interface PublicTopicMovement {
  theme: string;
  eventCount: number | null;
  distinctSpeakerCount: number | null;
  momentum: number | null;
  trendLabel: string;                 // closed vocabulary, mapped (never free text)
  isLowConfidence: boolean;
}
export interface PublicTopicIntelligence {
  intersections: PublicTopicIntersection[];  // all_time window
  movement: PublicTopicMovement[];           // 30 themes
  asOfDate: string | null;
}
```

- Read `window_type = 'all_time'` for intersections; `false-zero` guard (0 count → null) as in
  `spine.ts` so an RLS-shadowed read renders `INSTRUMENTING`, not a confident "0".
- Honest-empty `EMPTY_TOPIC_INTEL` when `spineClient()` is null or any error.
- **Tests** (`topic-intelligence.test.ts`, mirror `spine.test.ts`): mapper faithfulness, false-zero
  guard, honest-empty on no-env, `assertPublicSafe` passes empty, and a fixture with a fake name in a
  theme field is BLOCKED by the gate.

### B2 · Render — `app/signal/page.tsx`

Route **`/signal`** (matches the "Signal Spine" node). Public, cacheable: `export const
revalidate = 900`. Orchid-themed. Degraded fallback like `/system` (never 500 the page).

**Layout — intersections-led** (the rich signal today):
1. **Metric strip** — themes / intersections / new pairs / trend ("◔ armed").
2. **Intersection ranking** — top pairs as magenta (`--color-signal`) bars scaled by
   `intersection_score`, each with a teal (`--color-bridge`) `bridge_person_count` pill
   ("N people bridge") and an amber (`--color-newpair`) marker when `is_new_pair`.
3. **Movement table — all 30 themes, tiered progressive disclosure** (Alex's call):
   - **Top 10** (by event_count): full detail — theme, event count, distinct speakers, momentum,
     trend label, low-confidence marker.
   - **Next 10**: reduced — theme, event count, trend label only.
   - **Last 10**: names only — theme + a faint low-confidence/steady dot.
   Trend column reads **"armed — not yet moving"**; low-confidence rows are marked, not hidden.

**Explicitly OUT of v1 scope:**
- **Health strip** — the tripwire view `topic_intelligence_health` is in schema `signal`, not
  `signal_read`, so it's not anon-readable. Surfacing it needs a ~5-line gtm-os wrapper
  (`signal_read.v_topic_intelligence_health` + grant) **owned by the gtm-os thread**, or cockpit-only
  rendering. Deferred.
- **Bridge names** (`v_bridge_people`) — gated until suppression is seeded. Counts only for now.

### B3 · Wire into `/system`

`system-status.ts` already lights the `spine` node from `PublicSpineStats`. Add topic-intelligence
so the node metric becomes e.g. `30 themes · 124 pairs` (live) and links to `/signal`; update
`content/system-map.ts` to draw the now-real `spine → egress-gate → public` path (today it's isolated).

---

## Phasing & sequence

1. **Phase 1 — Track A (Orchid re-tone).** `globals.css` flip + per-page contrast audit + build.
   *Do first so `/signal` is born in the final skin.*
2. **Phase 2 — B1** adapter + gate + tests (buildable now; asserts honest-empty).
3. **Phase 3 — B2** `/signal` render + B3 `/system` wiring.
4. **Phase 4 — verify + docs.** Run `scripts/verify-egress.ts` on real data once Alex flips the
   exposed-schemas toggle + sets env; update `ARCHITECTURE.md` + system-map topology.
   **Human-in-the-loop before public.**

## Open decisions — resolved
- **Route name:** `/signal`.
- **Movement table:** all 30 themes, tiered 10 (full) / 10 (brief) / 10 (names).
