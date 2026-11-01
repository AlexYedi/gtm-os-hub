# G-03 · University curriculum drafts: D1, D2, D5 (GTM)

**Linear:** GTM-10 · **Repo:** gtm-os-hub

## Product
The curriculum structure (9 areas, every sub-task) is authored in `content/curriculum/`, but lesson bodies and rubric descriptors are deepest only in the D3 "Signal & Data Engineering" slice. Draft the other **Own** areas: D1 Commercial, D2 GTM Systems, D5 AI/Agent. Alex reviews and owns the voice. **These are drafts.**

## Technical
- For each module in D1, D2 and D5 that lacks one, add a markdown `body` lesson and per-skill rubric descriptors, matching the shape and depth of the D3 slice. Read D3 first and mirror its structure.
- Lessons MUST teach method, not claim experience. Write no first-person claims about Alex and no numbers about his career.
- **`unit_id` slugs are immutable.** Add fields to existing units. Add new units only where the structure already lists them. Never rename.
- Keep `lib/curriculum.test.ts` passing, and add a test that every D1, D2 and D5 module has a non-empty `body`.
- One PR per area (three PRs).

## Must not
Run `sync:curriculum` against a live database (it needs a service key; the sync is a follow-up for Alex) · change complexity ratings (they come from logged time).

**Done when:** D1, D2 and D5 each have bodies and descriptors, the tests pass, and the PR body lists every module touched for Alex's review.

## Voice review (Alex, 2026-11-01)
- Substance, method-not-experience compliance and D3 structure parity: **pass**.
- Voice: **adjusted**. At most one "X, not Y" contrast per lesson body; each capstone opens on its own sentence (no shared "integration test for D_" template). Applied in the voice-pass PR.
- **House heading idiom going forward:** a named-thesis opener (a heading that states the lesson's point) plus a `## What you are building` closer, the pattern D10 and the G-03 bodies use. Capstones keep `## What the capstone assembles` as the opener. Pre-existing `## Why this matters` bodies stay as they are until next touched.

