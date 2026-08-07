# Topic-Intelligence → Hub Handoff (YED-122, Section B)

A **handoff**, not an implementation plan. It states what the gtm-os side delivered, the facts you read against, and the decisions worth weighing — then the Hub thread investigates its own repo and charts the render.

---

## What was accomplished on the gtm-os side (2026-08-06)

The topic-intelligence layer went from nothing to a validated, self-instrumented modeling substrate — and a Hub-facing API that's applied and proven PII-safe:

- **Slice 0** (PR #11): 170 event topics → **30 canonical themes** (calibrated N=30) + a content-proof piece.
- **Slice 1 Section A** (PR #12): `topic_trend` + `topic_pair_metric` computed substrate; a nightly `compute_topic_intelligence` function **validated against an independent reference** (exact match); a health/tripwire view; nightly `pg_cron` (job 1, 03:30 UTC); a keep-warm heartbeat.
- **Section B gtm-os side** (`signal_08`, applied): the `signal_read` view contract — **security-reviewed PASS/clean, live output verified**: no PII reachable via anon.

**Net: everything the Hub needs from gtm-os exists, is applied, and is verified. The render + one dashboard toggle are all that remain — both Hub-side.**

## The contract you read against

Spine project `Signal_Pipeline_Analytical_Spine` (ref `abkvgihlbwfloentugtd`), schema `signal_read`:

| View | Columns | Access |
|---|---|---|
| `v_topic_movement` | theme, window_type, event_count, distinct_speaker_count, momentum, trend_label, is_low_confidence, as_of_date | **anon-granted** (PII-free) |
| `v_topic_intersections` | theme_a, theme_b, window_type, cooccurrence_event_count, bridge_person_count, is_new_pair, intersection_score, as_of_date | **anon-granted** (counts only) |
| `v_bridge_people` | display_name, current_title, theme_a, theme_b, as_of_date | **service_role ONLY** |

Live today: 30 themes, 124 all-time intersections. Existing Hub entry points (FYI, for your investigation — not prescriptions): `lib/supabase/spine.ts` (anon client), the `lib/sources/*` adapter pattern, `app/system` (Living System Map).

## The one dashboard action that gates everything

**Exposed-schemas toggle:** Supabase → spine project → Settings → API → Exposed schemas → add `signal_read`. Until then *nothing* in `signal_read` is REST-reachable (currently exposed: `public, graphql_public, signal`). This is the deliberate public-egress switch.

## Guardrails (non-negotiable)

- **Never render `v_bridge_people`.** Service-role only; suppression is unseeded, so it would expose real named people. The anon key can't read it — keep it that way.
- **Never put the spine `service_role` key in the Hub.** Anon/publishable only.
- **Read `signal_read.*` only.** Base `signal.*` is anon-deny by design.

---

## Most relevant for the Hub's next-steps investigation

Decisions to weigh — flagged, not decided for you:

1. **The trend half is dormant.** The corpus ends 2026-07-17, so `month`/`week` windows are near-empty; `all_time` + intersections are the rich signal today. How to present a partially-static dataset honestly is a real call — the System Map's degraded/"instrumenting" ethos already fits. Worth deciding whether to lead with intersections and state "trend armed, not yet moving."

2. **Health-strip schema gotcha.** The tripwire view `topic_intelligence_health` lives in schema `signal`, **not** `signal_read` — so it's not anon-readable. To surface it publicly you'd need a small `signal_read.v_topic_intelligence_health` wrapper + grant (a ~5-line gtm-os follow-up), *or* render it cockpit-only. Genuine fork — decide which.

3. **Bridge people are built but gated.** The "who to know" view works (verified — Snowflake CEO, Vercel CTO, etc. bridging themes) but is withheld until suppression is seeded. Whether/when the public surface wants it drives a gtm-os follow-up chain (seed suppression → grant to anon → bridge-count small-cell masking). Decide if it's first-render scope or a later pass.

4. **Design continuity.** A published explainer already established a visual language (mono uppercase labels, serif headings, **ember = trend/heat**, **teal = bridges/people**, cool ground). Aligning the render buys coherence — the Hub's call. Ref: `gtm-os/scripts/topic_intelligence/topic_intelligence_explainer.html`.

5. **Freshness / caching.** The free-tier spine can idle-pause; `spineClient()` already degrades-to-empty on absent env. Weigh ISR window vs the "static until fresh events" reality.

## Pointers
YED-122 (tracking + loop-in steps) · memory `topic-intelligence-slice1-view-constraint` (anon-grant contract) · `gtm-os/docs/build-journal.md` (the arc) · gtm-os branch `alex/signal-read-views` = `signal_08` (applied).
