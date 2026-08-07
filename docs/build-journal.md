# Build Journal — gtm-os Hub

The Hub-side companion to `gtm-os/docs/build-journal.md`. One entry per logical milestone:
**what** was built, **why**, **why it was built that way**, **deviations**, **learnings**.
Chronological. Feeds the Hub's own "Work, Live" build-journal surface when that ships.

---

## 2026-08-07 · Slice 1 Section B — `/signal` render + Orchid re-tone · YED-122 · PR #6

- **What.** The Hub-side of the topic-intelligence layer. (1) `lib/sources/topic-intelligence.ts` +
  tests — a counts-only adapter over the spine's `signal_read` anon views (`v_topic_movement`,
  `v_topic_intersections`) via `spineClient().schema('signal_read')`. (2) `app/signal/page.tsx` — a
  dedicated `/signal` Tier-2 surface: intersection ranking + a 30-theme movement table with tiered
  progressive disclosure (10 full / 10 brief / 10 names). (3) Spine node wired into the system map
  (`egress-gate → public`, metric derives from topic intel, deep-links to `/signal`). (4) A Hub-wide
  **Orchid** re-tone — dark-first emerald + parchment identity, warmed with amber + coral, sampled
  from a design-inspo illustration. Spec: `docs/SLICE_1B_SIGNAL_RENDER_SPEC.md`.

- **Why.** YED-122 §B: gtm-os defined + verified the `signal_read` views; the Hub renders them. This
  render clears (partially — see deviations) red-flag #4 and is the R2-dashboard proof (ARCHITECTURE §9).

- **Why this way.** Mirrored the `spine.ts`/`linear.ts` doctrine exactly — PII omitted at the type
  level, `assertPublicSafe` on every path, false-zero guard (0 → null → INSTRUMENTING), closed trend
  vocabulary. Counts-only, `v_bridge_people` never read (suppression unseeded). Built fully against the
  not-yet-exposed schema so it ships honest-empty and lights up unchanged when the toggle + env land —
  no fabricated numbers. A dedicated `/signal` route rather than inlining on The Work, Live, because a
  30-theme / 124-pair dataset would bloat the proof-of-work stream.

- **Deviations (caught in a mid-build recalibration audit, 2026-08-07).**
  - Built the code **before** reading the canonical specs (ARCHITECTURE §9, PHASE_1 spec, the ChatPRD
    Hub PRD) or the tracker (YED-122). Code aligned by mirroring existing adapters — luck, not rigor.
  - **Surface-model divergence:** §9/YED-122 said "render on The Work, Live / Tiers 1–2"; built a new
    `/signal` route instead. Kept it deliberately and reconciled ARCHITECTURE §1/§9 to record it.
  - **Health strip deferred:** `topic_intelligence_health` is in YED-122 scope but its view is in
    schema `signal` (not anon-readable) → deferred; so YED-122 is **not done** and red-flag #4 is only
    partially cleared. Recorded on the issue.
  - **Scope bundling:** the Orchid re-tone (cross-cutting, no issue) rode in the YED-122 PR; now
    tracked as its own Linear issue.
  - **Naming/branch:** first spec was mis-named "Phase 2" (collides with V0/V1/V2 and Slice/Section);
    renamed to `SLICE_1B_SIGNAL_RENDER_SPEC.md`. Branch `alex/hub-orchid-retone` didn't follow the
    issue-ref convention (`alex/yed-122-…`) — noted, adopt going forward.

- **Learnings.** Code discipline (the guardrails) held under speed, but the **tracking + strategy
  layer got outrun**: treating the kickoff handoff as sufficient and skipping the canonical trio is
  where the surface intent, the in-scope health strip, and the bridge-people end-state were missed.
  New cadence: read the tracked issue + PRD/ARCHITECTURE section + confirm the surface model *before*
  building the next slice, and journal each milestone rather than relying on commit messages.
