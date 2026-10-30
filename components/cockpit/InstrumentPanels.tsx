import type { PublicEvalRunPanel } from '@/lib/sources/eval-runs'
import type { PublicFunnelStage } from '@/lib/sources/funnel'
import type { PublicSignalPrecision } from '@/lib/sources/signal-precision'
import type { PublicRunHealth, RunHealthStatus } from '@/lib/sources/run-health'
import { formatDate } from '@/lib/format'

/**
 * V2 instrument panels (G-02 / GTM-8) — cockpit-only, presentational.
 *
 * Server-fetched by app/cockpit/page.tsx; this component never touches a client. Each
 * panel's honest-empty state is `⊘ instrumenting — wired, awaiting first run` — the
 * sources' tables/views do not exist yet (G-02 forbids DDL), and an empty render is a
 * truthful state, never a fabricated number.
 */

const STATUS_TONE: Readonly<Record<RunHealthStatus, { color: string; label: string }>> = {
  ok: { color: 'var(--color-done)', label: 'OK' },
  running: { color: 'var(--color-progress)', label: 'RUNNING' },
  stale: { color: 'var(--color-pending)', label: 'STALE' },
  failing: { color: 'var(--color-accent)', label: 'FAILING' },
  unknown: { color: 'var(--color-ink-soft)', label: 'UNKNOWN' },
}

export function InstrumentingState({ note }: { note: string }) {
  return (
    <section className="rounded-lg border border-dashed border-edge bg-paper p-4">
      <p className="font-mono text-xs text-ink-soft">
        ⊘ instrumenting — wired, awaiting first run. {note}
      </p>
    </section>
  )
}

function PanelShell({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-edge bg-surface">
      <div className="border-b border-edge px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
        <p className="mt-0.5 font-mono text-[11px] text-ink-soft">{hint}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  )
}

/** Titled honest-empty: the panel is wired and its header stays visible while awaiting data. */
function EmptyPanel({ title, hint, note }: { title: string; hint: string; note: string }) {
  return (
    <PanelShell title={title} hint={hint}>
      <div className="rounded-md border border-dashed border-edge bg-paper p-3">
        <p className="font-mono text-xs text-ink-soft">
          ⊘ instrumenting — wired, awaiting first run. {note}
        </p>
      </div>
    </PanelShell>
  )
}

export function EvalRunPanel({ panel }: { panel: PublicEvalRunPanel }) {
  if (panel.totalRuns === 0 || panel.runs.length === 0) {
    return (
      <EmptyPanel
        title="Eval runs"
        hint="pass/fail over recent GTM skill evals"
        note="eval_runs lights up when the eval harness records its first run."
      />
    )
  }
  const pct = panel.passRate == null ? null : Math.round(panel.passRate * 100)
  return (
    <PanelShell
      title="Eval runs"
      hint="pass/fail over recent GTM skill evals"
    >
      <p className="font-mono text-xs tabular-nums text-ink-muted">
        {panel.passedRuns}/{panel.totalRuns} passed
        {pct != null ? <> · {pct}%</> : null}
        {panel.lastRunAt ? <> · last {formatDate(panel.lastRunAt)}</> : null}
      </p>
      <ul className="mt-3 space-y-1.5">
        {panel.runs.slice(0, 10).map((r, i) => (
          <li key={`${r.name}-${i}`} className="flex items-center gap-2 text-sm">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${r.passed ? 'bg-done' : 'bg-accent'}`}
              aria-hidden
            />
            <span className="min-w-0 truncate text-ink">{r.name}</span>
            <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-soft">
              {r.ranAt ? formatDate(r.ranAt) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </PanelShell>
  )
}

export function FunnelPanel({ stages }: { stages: PublicFunnelStage[] }) {
  if (stages.length === 0) {
    return (
      <EmptyPanel
        title="Funnel"
        hint="stage counts, pipeline-owned"
        note="the funnel view is created by a pipeline migration; this panel lights up then."
      />
    )
  }
  return (
    <PanelShell title="Funnel" hint="stage counts, pipeline-owned">
      <ul className="space-y-1.5">
        {stages.map((s, i) => (
          <li key={`${s.stage}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">{s.stage}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-ink-muted">
              {s.count == null ? '—' : s.count}
            </span>
          </li>
        ))}
      </ul>
    </PanelShell>
  )
}

export function SignalPrecisionPanel({ rows }: { rows: PublicSignalPrecision[] }) {
  if (rows.length === 0) {
    return (
      <EmptyPanel
        title="Signal precision"
        hint="detected vs true-positive vs a labelled sample"
        note="precision lands when a labelled sample scores the signal detectors."
      />
    )
  }
  return (
    <PanelShell title="Signal precision" hint="detected vs true-positive vs a labelled sample">
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={`${r.signal}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-ink">{r.signal}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-ink-muted">
              {r.precision == null ? '—' : `${Math.round(r.precision * 100)}%`}
              {r.detectedCount != null ? ` · ${r.detectedCount} detected` : ''}
            </span>
          </li>
        ))}
      </ul>
    </PanelShell>
  )
}

export function RunHealthPanel({ rows }: { rows: PublicRunHealth[] }) {
  if (rows.length === 0) {
    return (
      <InstrumentingState note="pipeline health lights up when the nightly runs report status." />
    )
  }
  return (
    <PanelShell title="Run health" hint="last run / last success per pipeline">
      <ul className="space-y-1.5">
        {rows.map((r, i) => {
          const tone = STATUS_TONE[r.status]
          return (
            <li key={`${r.pipeline}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink">{r.pipeline}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-ink-muted">
                {r.lastRunAt ? `run ${formatDate(r.lastRunAt)}` : '—'}
                {r.lastSuccessAt ? ` · ok ${formatDate(r.lastSuccessAt)}` : ''}
                {` · ${tone.label}`}
              </span>
            </li>
          )
        })}
      </ul>
    </PanelShell>
  )
}
