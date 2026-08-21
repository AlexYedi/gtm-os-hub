import { expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// DB-layer backstop for the `security_definer_view` Advisor CRITICALs on public.v_public_*.
// Those views run as owner (postgres) and bypass RLS on learning.* by design — that is the
// intended anon window (see ARCHITECTURE.md §0 "Advisor exceptions"). Because they bypass RLS,
// the view *definition* is the only PII boundary: a future edit that adds a private column to a
// v_public_* view would leak with no RLS to catch it. This test fails that PR.
//
// Static (parses the migration SQL, no DB/secrets) so it runs in CI beside public-safety.test.ts.
// Hub migrations == the live DB (kept in sync via `supabase db push`), so the SQL is authoritative.

const MIGRATIONS = join(import.meta.dir, '..', 'supabase', 'migrations')

// Column/identifier tokens that must NEVER appear inside a public.v_public_* view definition.
// PII (email/linkedin/phone) + explicitly-private schema columns (0001): body_md is cockpit-only,
// auth_user_id is an identity key, external_ref/content_hash are internal.
const FORBIDDEN = ['body_md', 'auth_user_id', 'email', 'linkedin', 'phone', 'external_ref', 'content_hash']

function stripLineComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '')
}

// Extract every `create view public.v_public_<name> as ... ;` block across all migrations.
function publicViewBlocks(): { name: string; body: string }[] {
  const blocks: { name: string; body: string }[] = []
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()
  for (const f of files) {
    const sql = stripLineComments(readFileSync(join(MIGRATIONS, f), 'utf8'))
    const re = /create\s+(?:or\s+replace\s+)?view\s+public\.(v_public_\w+)\b([\s\S]*?);/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(sql)) !== null) blocks.push({ name: m[1], body: m[0] })
  }
  return blocks
}

test('the three known public projection views are present (guard is not vacuous)', () => {
  const names = new Set(publicViewBlocks().map((b) => b.name))
  for (const expected of ['v_public_curriculum', 'v_public_progress', 'v_public_submissions']) {
    expect(names.has(expected)).toBe(true)
  }
})

test('no public.v_public_* view definition references a private/PII column', () => {
  for (const { name, body } of publicViewBlocks()) {
    for (const token of FORBIDDEN) {
      const hit = new RegExp(`\\b${token}\\b`, 'i').test(body)
      if (hit) {
        throw new Error(
          `public.${name} references forbidden column "${token}". ` +
            `v_public_* views bypass RLS (SECURITY DEFINER) — a private column here leaks to anon. ` +
            `Remove it, or if it is genuinely public, update ARCHITECTURE.md §0 and this denylist deliberately.`,
        )
      }
    }
  }
})
