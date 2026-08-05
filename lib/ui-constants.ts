// Canonical, single-sourced UI strings shared across public surfaces.

/**
 * The one true "no data yet" string (ARCHITECTURE.md §6 / CLAUDE.md guardrail #3).
 * An empty/instrumenting panel renders THIS verbatim — never a fabricated number,
 * never a shortened paraphrase. Import it everywhere so the phrasing can't drift.
 */
export const INSTRUMENTING = '⊘ instrumenting — wired, awaiting first run'
