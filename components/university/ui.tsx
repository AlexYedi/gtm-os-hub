import type { AreaView } from '@/lib/university-view'

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-edge bg-surface p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-ink-soft">{sub}</p> : null}
    </div>
  )
}

export function ProgressMeter({ pct }: { pct: number }) {
  const color = pct >= 100 ? 'var(--color-done)' : pct > 0 ? 'var(--color-progress)' : 'var(--color-pending)'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper" aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
    </div>
  )
}

const TIER_LABEL: Record<AreaView['tier'], string> = { own: 'Own', do: 'Do', recognize: 'Recognize' }

export function TierBadge({ tier }: { tier: AreaView['tier'] }) {
  return (
    <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
      {TIER_LABEL[tier]}
    </span>
  )
}

export function AreaCard({ area }: { area: AreaView }) {
  return (
    <div className="rounded-lg border border-edge bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">{area.title}</h3>
        <TierBadge tier={area.tier} />
      </div>
      {area.summary ? (
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-muted">{area.summary}</p>
      ) : null}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-ink-soft">
          <span>{area.domainId.toUpperCase()}</span>
          <span>
            {area.done}/{area.total} · {area.pct}%
          </span>
        </div>
        <ProgressMeter pct={area.pct} />
      </div>
    </div>
  )
}
