// Shared display formatters. Pure, dependency-free, safe in both server and client
// components. Hoisted out of WorkStream so the System Map can format dates identically.

/** Format an ISO date as e.g. "Jun 27, 2026". Returns '' for empty/invalid input. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
