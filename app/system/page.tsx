import Link from 'next/link'
import { getSystemStatus, type StatusMap } from '@/lib/sources/system-status'
import { NODES } from '@/content/system-map'
import { SystemMap } from '@/components/system/SystemMap'

// Public + cacheable (NOT force-dynamic). Route segment owns the ISR window.
export const revalidate = 900
export const metadata = {
  title: 'Living System Map — Alex Yedi',
  description: 'The projection layer, live: what is wired, what is instrumenting, what is planned.',
}

// Degraded fallback: if assembly/gate throws, every node renders instrumenting rather than
// 500-ing the flagship public page. One leaking or throwing source must not take the map down.
function degradedStatus(): StatusMap {
  const m: StatusMap = {}
  for (const n of NODES) m[n.id] = { status: 'instrumenting', metric: null }
  return m
}

export default async function SystemPage() {
  let nodes = NODES
  let status: StatusMap
  let degraded = false
  try {
    const s = await getSystemStatus()
    nodes = s.nodes
    status = s.status
  } catch {
    status = degradedStatus()
    degraded = true
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          GTM Engineering · in public
        </p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Living System Map</h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-muted">
          The projection layer, live. Every node answers the same three questions: is it up, what
          is its latest measure, when last seen. Honest by construction — nothing shows a number it
          has not measured.
        </p>
      </header>

      {/* Tier toggle — reciprocal of the homepage nav. */}
      <nav className="mb-8 flex gap-1 rounded-lg border border-edge bg-paper p-1 text-sm">
        <Link href="/" className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink">
          The Work, Live
        </Link>
        <span className="rounded-md bg-surface px-3 py-1.5 font-medium text-ink shadow-sm">
          Living System Map
        </span>
        <Link href="/signal" className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink">
          Signal
        </Link>
        <Link href="/university" className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink">
          GTM University
        </Link>
      </nav>

      {/* Legend — status is dot + word, never color alone. */}
      <ul className="mb-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-ink-soft">
        <Legend color="var(--color-done)" word="live" hint="wired · returning data" />
        <Legend color="var(--color-pending)" word="instrumenting" hint="wired · awaiting first run" />
        <Legend color="var(--color-ink-soft)" word="planned" hint="not yet wired" />
      </ul>

      {degraded ? (
        <p className="mb-4 rounded-md border border-pending bg-paper px-3 py-2 font-mono text-xs text-ink-muted">
          ⊘ status assembly degraded — showing topology only.
        </p>
      ) : null}

      <SystemMap nodes={nodes} status={status} />

      <footer className="mt-16 border-t border-edge pt-6 font-mono text-xs text-ink-soft">
        Projection layer over Linear · GitHub · Notion · Supabase. Every public payload ends with
        assertPublicSafe.
      </footer>
    </main>
  )
}

function Legend({ color, word, hint }: { color: string; word: string; hint: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
      <span className="text-ink">{word}</span>
      <span>· {hint}</span>
    </li>
  )
}
