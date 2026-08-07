/**
 * Dev check: run the real /signal adapter (getPublicTopicIntelligence) against whatever
 * MI_SUPABASE_* points at (twin in dev). Proves the read path end-to-end without a browser.
 *   bun run scripts/check-signal.ts
 */
import { getPublicTopicIntelligence } from '../lib/sources/topic-intelligence'

const r = await getPublicTopicIntelligence()
console.log('asOfDate           :', r.asOfDate)
console.log('movement themes    :', r.movement.length)
for (const m of r.movement.slice(0, 5))
  console.log(`  • ${m.theme} — events=${m.eventCount} speakers=${m.distinctSpeakerCount} trend=${m.trendLabel} lowConf=${m.isLowConfidence}`)
console.log('intersections      :', r.intersections.length)
for (const i of r.intersections.slice(0, 3))
  console.log(`  • ${i.themeA} × ${i.themeB} — score=${i.intersectionScore} coEvents=${i.cooccurrenceEventCount} bridges=${i.bridgePersonCount}`)
