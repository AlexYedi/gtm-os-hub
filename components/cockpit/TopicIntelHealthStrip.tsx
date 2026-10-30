import type { CockpitHealthTripwire, HealthStatus } from '@/lib/sources/topic-intel-health'

/**
 * The "V1 assumptions" tripwire strip (YED-122) — cockpit-only render of
 * `topic_intelligence.topic_intelligence_health` on the MI graph. Server-fetched;
 * this component is presentational only.
 *
 * Status tones: trip → accent (coral), watch → pending (amber), ok → done (green),
 * no_data → ink-soft. A null/empty payload renders the honest-empty ⊘ instrumenting
 * state — never a fabricated number.
 */

const STATUS_TONE: Readonly<Record<HealthStatus, { color: string; label: string }>> = {
  trip: { color: 'var(--color-accent)', label: 'TRIP' },
  watch: { color: 'var(--color-pending)', label: 'WATCH' },
  ok: { color: 'var(--color-done)', label: 'OK' },
  no_data: { color: 'var(--color-ink-soft)', label: 'NO DATA' },
}

export function TopicIntelHealthStrip({ tripwires }: { tripwires: CockpitHealthTripwire[] | null }) {
  if (tripwires === null || tripwires.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-edge bg-paper p-4">
        <p className="font-mono text-xs text-ink-soft">
          ⊘ instrumenting — health strip wired; the MI-graph read path is not open yet (service
          key / view access pending). No numbers are shown until the real read succeeds.
        </p>
      </section>
    )
  }

  const tripped = tripwires.filter((t) => t.status === 'trip').length

  return (
    <section className="rounded-lg border border-edge bg-surface">
      <div className="flex items-baseline justify-between border-b border-edge px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            V1 assumptions — health
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
            one row per simplification · ok / watch / trip vs threshold
          </p>
        </div>
        <span
          className="font-mono text-[11px] tabular-nums"
          style={{ color: tripped > 0 ? 'var(--color-accent)' : 'var(--color-done)' }}
        >
          {tripped > 0 ? `${tripped} trip${tripped === 1 ? '' : 's'}` : 'all clear'}
        </span>
      </div>
      <ul className="divide-y divide-edge">
        {tripwires.map((t) => (
          <HealthRow key={t.tripwire} tripwire={t} />
        ))}
      </ul>
    </section>
  )
}

function HealthRow({ tripwire: t }: { tripwire: CockpitHealthTripwire }) {
  const tone = STATUS_TONE[t.status]
  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {t.tripwire}
          {t.decision ? <span className="ml-2 font-mono text-[11px] text-ink-soft">{t.decision}</span> : null}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{t.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {t.metric == null ? '—' : t.metric} <span className="text-ink-soft">/ thr {t.threshold}</span>
        </span>
        <span
          className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide"
          style={{ color: tone.color, borderColor: tone.color }}
        >
          {tone.label}
        </span>
      </div>
    </li>
  )
}
