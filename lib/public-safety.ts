// Risk #3 mitigation — PII & confidentiality egress guard for PUBLIC surfaces.
//
// Default-deny. Public renderers may ONLY consume `Public*` types produced by the
// source adapters (lib/sources/*). This module is the egress NET: the allowlist
// projection (type-level omission of PII) is the primary control; everything below
// is belt-and-suspenders that fails loudly if PII ever reaches a public payload.
//
// See ARCHITECTURE.md §0 for the full contract.

// --- PII patterns ---------------------------------------------------------
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
// Conservative NANP-style phone matcher (3-3-4). Deliberately strict so ISO
// dates (YYYY-MM-DD, 8 digits) and short commit SHAs never false-positive.
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
const LINKEDIN = /(?:https?:\/\/)?(?:[\w.]+\.)?linkedin\.com\/[^\s")]+/gi

// Denylist of confidential entities (employer, target accounts, prospect /
// hiring-manager names) that must never reach a public surface. Sourced from env
// so the actual names live in PRIVATE config (Vercel env / local .env) and never
// in this public source tree. Read at call time so config changes need no rebuild.
//   PII_DENYLIST="acme corp,jane doe,target inc"
function denylist(): string[] {
  return (process.env.PII_DENYLIST ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface PiiScanResult {
  clean: boolean
  hits: string[]
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Scan an arbitrary string for PII patterns + denylisted entities. */
export function scanForPii(input: string): PiiScanResult {
  const hits: string[] = []
  for (const re of [EMAIL, PHONE, LINKEDIN]) {
    const m = input.match(re)
    if (m) hits.push(...m)
  }
  for (const term of denylist()) {
    if (term && new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(input)) {
      hits.push(term)
    }
  }
  return { clean: hits.length === 0, hits }
}

/**
 * Redact any PII found in a string. Use on free-text fields (e.g. commit
 * subjects) during projection — a second line of defence behind the allowlist.
 */
export function scrub(input: string): string {
  return input
    .replace(EMAIL, '[redacted-email]')
    .replace(LINKEDIN, '[redacted-link]')
    .replace(PHONE, '[redacted-phone]')
}

/**
 * Hard gate for a fully-assembled public payload. Serializes and scans the whole
 * object graph; throws if any PII / denylisted entity is present. Call this at the
 * boundary of every public data fetch so a leak fails the build/test, never ships.
 */
export function assertPublicSafe(payload: unknown, where = 'public payload'): void {
  const json = JSON.stringify(payload ?? '')
  const { clean, hits } = scanForPii(json)
  if (!clean) {
    const unique = [...new Set(hits)].join(', ')
    throw new Error(`PII/confidential egress blocked in ${where}: ${unique}`)
  }
}
