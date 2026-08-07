import type {
  PublicTopicIntersection,
  PublicTopicMovement,
  PublicTrendLabel,
} from '@/lib/sources/topic-intelligence'

// Presentational pieces for /signal. Pure server components — no client JS. Colors come from the
// Orchid data-role tokens: signal (magenta) = heat/momentum, bridge (teal) = connectors/people,
// newpair (amber) = a newly-formed pair. Bridge is a COUNT only; names never appear here.

export function SignalMetric({
  value,
  label,
  tone = 'ink',
}: {
  value: string
  label: string
  tone?: 'ink' | 'signal'
}) {
  return (
    <div className="bg-surface px-3 py-4 text-center">
      <div
        className={`font-mono text-2xl font-semibold tabular-nums leading-none ${
          tone === 'signal' ? 'text-signal' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </div>
    </div>
  )
}

/** One ranked intersection: magenta bar scaled by score, teal bridge-count pill, amber new marker. */
export function IntersectionRow({
  ix,
  maxScore,
}: {
  ix: PublicTopicIntersection
  maxScore: number
}) {
  const pct =
    ix.intersectionScore != null && maxScore > 0
      ? Math.max(6, Math.round((ix.intersectionScore / maxScore) * 100))
      : 0
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
      <div className="min-w-0 text-[0.95rem] text-ink">
        <span className="break-words">{ix.themeA}</span>
        <span className="px-1.5 font-mono text-xs text-ink-soft">×</span>
        <span className="break-words">{ix.themeB}</span>
        {ix.isNewPair ? (
          <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-newpair">
            ◆ new
          </span>
        ) : null}
      </div>
      <div className="shrink-0">
        {ix.bridgePersonCount != null ? (
          <span className="whitespace-nowrap rounded-full border border-bridge/50 px-2 py-0.5 font-mono text-[11px] text-bridge">
            {ix.bridgePersonCount} {ix.bridgePersonCount === 1 ? 'person bridges' : 'people bridge'}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink-soft">—</span>
        )}
      </div>
      <div className="col-span-2 h-2 overflow-hidden rounded-sm bg-cream">
        <div
          className="h-full rounded-sm bg-signal"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  )
}

// Trend label → semantic tint (encode state in colour + word, never colour alone).
const TREND_TONE: Record<PublicTrendLabel, string> = {
  rising: 'text-signal',
  emerging: 'text-newpair',
  new: 'text-newpair',
  falling: 'text-ink-muted',
  steady: 'text-ink-soft',
  dormant: 'text-ink-soft',
}

export function TrendChip({ label, lowConfidence }: { label: PublicTrendLabel; lowConfidence: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
      <span className={TREND_TONE[label]}>{label}</span>
      {lowConfidence ? (
        <span className="rounded-full border border-dashed border-ink-soft px-1.5 text-[9px] uppercase tracking-wider text-ink-soft">
          low-confidence
        </span>
      ) : null}
    </span>
  )
}

/** Tier 1 (top 10): full detail. */
export function MovementRowFull({ m }: { m: PublicTopicMovement }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-edge py-2.5 first:border-t-0">
      <span className="font-serif text-base text-ink">{m.theme}</span>
      <span className="flex flex-wrap items-baseline gap-x-3 font-mono text-xs text-ink-soft">
        <span className="tabular-nums text-ink-muted">{m.eventCount ?? '—'} events</span>
        <span className="tabular-nums">{m.distinctSpeakerCount ?? '—'} speakers</span>
        <TrendChip label={m.trendLabel} lowConfidence={m.isLowConfidence} />
      </span>
    </div>
  )
}

/** Tier 2 (next 10): reduced — theme, count, trend. */
export function MovementRowBrief({ m }: { m: PublicTopicMovement }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-edge py-1.5">
      <span className="font-serif text-sm text-ink-muted">{m.theme}</span>
      <span className="flex items-baseline gap-3 font-mono text-[11px] text-ink-soft">
        <span className="tabular-nums">{m.eventCount ?? '—'}</span>
        <TrendChip label={m.trendLabel} lowConfidence={m.isLowConfidence} />
      </span>
    </div>
  )
}
