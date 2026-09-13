#!/usr/bin/env bun
/**
 * Sync the content-as-code curriculum -> learning.curriculum_unit.
 *
 *   bun scripts/sync-curriculum.ts --sql     # print idempotent upsert SQL (no DB needed)
 *   bun scripts/sync-curriculum.ts           # live upsert — only works if `learning` is exposed to the Data API (it is not by default)
 *
 * The content-as-code tree (content/curriculum) stays the source of truth;
 * curriculum_unit is a derived projection so SQL can roll up progress + time.
 * Upsert-only (never prunes) so removing a unit can't orphan logged work.
 */
import { flattenCurriculum, assertUniqueIds, assertPathCoverage, curriculumTotals } from '../lib/curriculum'

function sqlStr(v: string): string {
  return `'${v.replace(/'/g, "''")}'`
}
function sqlVal(v: string | number | boolean | null): string {
  if (v === null) return 'null'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return sqlStr(v)
}

export function buildUpsertSql(): string {
  const rows = flattenCurriculum()
  const values = rows
    .map(
      (r) =>
        `  (${sqlStr(r.unit_id)}, ${sqlVal(r.parent_id)}, ${sqlStr(r.level)}, ${sqlStr(r.domain_id)}, ` +
        `${sqlStr(r.competency_mode)}, ${sqlVal(r.kind)}, ${sqlStr(r.title)}, ${sqlVal(r.complexity)}, ` +
        `${sqlVal(r.is_capstone)}, ${r.sort_order})`,
    )
    .join(',\n')
  return `insert into learning.curriculum_unit
  (unit_id, parent_id, level, domain_id, competency_mode, kind, title, complexity, is_capstone, sort_order)
values
${values}
on conflict (unit_id) do update set
  parent_id = excluded.parent_id, level = excluded.level, domain_id = excluded.domain_id,
  competency_mode = excluded.competency_mode, kind = excluded.kind, title = excluded.title,
  complexity = excluded.complexity, is_capstone = excluded.is_capstone,
  sort_order = excluded.sort_order, synced_at = now();`
}

async function main() {
  assertUniqueIds()
  assertPathCoverage()
  const totals = curriculumTotals()
  if (process.argv.includes('--sql')) {
    console.log(buildUpsertSql())
    return
  }
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Live sync needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Use --sql to print SQL instead.')
    process.exit(1)
  }
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(url, key, { auth: { persistSession: false } })
  const rows = flattenCurriculum().map((r) => ({ ...r, synced_at: new Date().toISOString() }))
  const { error } = await sb.schema('learning').from('curriculum_unit').upsert(rows, { onConflict: 'unit_id' })
  if (error) {
    console.error('Sync failed:', error.message)
    // The learning schema is deliberately not exposed to the Data API (only `public` is), so the
    // live path fails with PGRST106. Generate SQL and run it in the Supabase SQL editor instead.
    if (error.code === 'PGRST106') console.error('Use: bun run sync:curriculum:sql, then paste the output into the SQL editor.')
    process.exit(1)
  }
  console.error(`Synced ${rows.length} units (${totals.areas} areas, ${totals.modules} modules, ${totals.subtasks} subtasks).`)
}

main()
