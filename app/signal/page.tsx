import Link from 'next/link'
import { getPublicTopicIntelligence, type PublicTopicIntelligence } from '@/lib/sources/topic-intelligence'
import {
  SignalMetric,
  IntersectionRow,
  MovementRowFull,
  MovementRowBrief,
} from '@/components/signal/ui'

// Public + cacheable — route segment owns the ISR window (matches /system, /university).
export const revalidate = 900

export const metadata = {
  title: 'Signal — reading the room at scale',
  description:
    'Topic intelligence over the signal pipeline: which themes intersect, and how many people bridge them. Counts only, PII-safe by construction.',
}

const EMPTY: PublicTopicIntelligence = { intersections: [], movement: [], asOfDate: null }

export default async function SignalPage() {
  let data = EMPTY
  let degraded = false
  try {
    data = await getPublicTopicIntelligence()
  } catch {
    degraded = true
  }

  const { intersections, movement, asOfDate } = data
  const hasData = intersections.length > 0 || movement.length > 0

  const newPairs = intersections.filter((i) => i.isNewPair).length
  const maxScore = intersections.reduce((mx, i) => Math.max(mx, i.intersectionScore ?? 0), 0)
  const topIntersections = intersections.slice(0, 12)

  // Progressive disclosure: full detail for the top 10, brief for the next 10, names for the rest.
  const tierFull = movement.slice(0, 10)
  const tierBrief = movement.slice(10, 20)
  const tierNames = movement.slice(20)

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          Signal pipeline · in public
        </p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Reading the room, at scale</h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-muted">
          Topic intelligence over the signal pipeline: which themes are being discussed, which ones{' '}
          <em>intersect</em>, and how many people bridge them. Counts only — no names, ever. The
          bridge view that knows <em>who</em> stays private by construction.
        </p>
        <nav className="mt-6 flex flex-wrap gap-1 rounded-lg border border-edge bg-paper p-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink">
            The Work, Live
          </Link>
          <Link href="/system" className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink">
            Living System Map
          </Link>
          <span className="rounded-md bg-surface px-3 py-1.5 font-medium text-ink shadow-sm">Signal</span>
          <Link href="/university" className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink">
            GTM University
          </Link>
        </nav>
      </header>

      {degraded ? (
        <p className="mb-4 rounded-md border border-pending bg-paper px-3 py-2 font-mono text-xs text-ink-muted">
          ⊘ signal assembly degraded — showing what is available.
        </p>
      ) : null}

      {!hasData ? (
        // Honest-empty: the spine's signal_read schema isn't reachable yet (exposed-schemas toggle +
        // env pending). No fabricated numbers — the surface is wired and waiting.
        <section className="rounded-lg border border-dashed border-edge bg-paper p-6">
          <p className="font-mono text-sm text-ink-soft">
            ⊘ instrumenting — wired, awaiting first run. The topic-intelligence views are computed and
            verified upstream; this surface lights up when the read path is opened.
          </p>
        </section>
      ) : (
        <>
          {/* Metric strip */}
          <div className="mb-10 grid grid-cols-2 overflow-hidden rounded-lg border border-edge sm:grid-cols-4 [&>*]:border-edge [&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-t-0 [&>*:nth-child(2n)]:border-l sm:[&>*:not(:first-child)]:border-l">
            <SignalMetric value={movement.length ? String(movement.length) : '—'} label="themes" />
            <SignalMetric
              value={intersections.length ? String(intersections.length) : '—'}
              label="intersections"
            />
            <SignalMetric value={String(newPairs)} label="new pairs" tone="signal" />
            <SignalMetric value="◔ armed" label="trend" />
          </div>

          {/* Intersections — the rich signal today */}
          {topIntersections.length > 0 ? (
            <section className="mb-12">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Where themes intersect</h2>
                <span className="font-mono text-xs text-ink-soft">ranked by co-occurrence</span>
              </div>
              <div className="flex flex-col gap-4 rounded-lg border border-edge bg-surface p-5">
                {topIntersections.map((ix, i) => (
                  <IntersectionRow key={`${ix.themeA}-${ix.themeB}-${i}`} ix={ix} maxScore={maxScore} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Movement — tiered progressive disclosure across all themes */}
          {movement.length > 0 ? (
            <section className="mb-8">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">Theme movement</h2>
                <span className="font-mono text-xs text-ink-soft">
                  {movement.length} themes · all-time
                </span>
              </div>
              <p className="mb-4 max-w-prose font-mono text-[11px] leading-relaxed text-ink-soft">
                ⊘ trend is <span className="text-pending">armed — not yet moving</span>: the weekly /
                monthly windows are near-empty until the corpus advances, so today&rsquo;s signal is the
                all-time volume and the intersections above. Low-confidence themes are marked, not hidden.
              </p>

              <div className="rounded-lg border border-edge bg-surface p-5">
                {tierFull.length > 0 ? (
                  <div>
                    {tierFull.map((m, i) => (
                      <MovementRowFull key={`${m.theme}-${i}`} m={m} />
                    ))}
                  </div>
                ) : null}

                {tierBrief.length > 0 ? (
                  <div className="mt-5 border-t border-edge pt-4">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      next {tierBrief.length}
                    </p>
                    {tierBrief.map((m, i) => (
                      <MovementRowBrief key={`${m.theme}-${i}`} m={m} />
                    ))}
                  </div>
                ) : null}

                {tierNames.length > 0 ? (
                  <div className="mt-5 border-t border-edge pt-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      also tracked · {tierNames.length}
                    </p>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                      {tierNames.map((m, i) => (
                        <li
                          key={`${m.theme}-${i}`}
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-soft"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              m.isLowConfidence ? 'bg-ink-soft/50' : 'bg-bridge'
                            }`}
                            aria-hidden
                          />
                          {m.theme}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      )}

      <footer className="mt-16 border-t border-edge pt-6 font-mono text-xs text-ink-soft">
        Source: signal-pipeline spine · <span className="text-ink-muted">signal_read</span> anon views
        (counts only) · every payload ends with assertPublicSafe.
        {asOfDate ? <> · as of {asOfDate}</> : null}
      </footer>
    </main>
  )
}
