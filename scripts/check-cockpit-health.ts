/**
 * Dev check (not committed): run the real cockpit adapter against the live MI graph.
 * bun run scripts/check-cockpit-health.ts
 */
import { getCockpitTopicIntelHealth } from '../lib/sources/topic-intel-health'

const r = await getCockpitTopicIntelHealth()
if (r === null) {
  console.log('READ FAILED → cockpit renders ⊘ instrumenting (no read path / query error)')
  process.exit(0)
}
console.log(`OK — ${r.length} tripwire rows:`)
for (const t of r) {
  console.log(`  ${t.status.toUpperCase().padEnd(7)} ${t.tripwire} = ${t.metric} (thr ${t.threshold}) [${t.decision}]`)
}
