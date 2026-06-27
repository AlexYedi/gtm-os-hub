import 'server-only'
import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'

// Minimal single-user cockpit gate (Tier 3). V2 swaps this for Clerk + Supabase Auth,
// at which point RLS (already written, dormant) becomes the enforcement boundary.
// The cookie stores a hash of COCKPIT_PASSWORD, never the password itself.

export const COCKPIT_COOKIE = 'gtmu_cockpit'

export function cockpitToken(): string {
  const pw = process.env.COCKPIT_PASSWORD
  if (!pw) throw new Error('COCKPIT_PASSWORD not set')
  return createHash('sha256').update(`gtmu:${pw}`).digest('hex')
}

export async function isCockpitAuthed(): Promise<boolean> {
  if (!process.env.COCKPIT_PASSWORD) return false
  const jar = await cookies()
  return jar.get(COCKPIT_COOKIE)?.value === cockpitToken()
}

/**
 * Re-verify auth INSIDE every Server Action. Server Actions are public POST
 * endpoints — the /cockpit middleware protects navigation, not the action.
 * This is the same severity as the PII gate: call it first, always.
 */
export async function assertCockpit(): Promise<void> {
  if (!(await isCockpitAuthed())) {
    throw new Error('Unauthorized: cockpit action requires authentication.')
  }
}
