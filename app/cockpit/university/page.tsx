import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isCockpitAuthed } from '@/lib/auth'
import { getCockpitState, hasServiceKey } from '@/lib/sources/cockpit'
import { findSubtask, pathStages, stageResources } from '@/lib/curriculum'
import type { Subtask } from '@/content/curriculum/types'
import {
  startTimerAction,
  stopTimerAction,
  addManualTimeAction,
  setStatusAction,
  submitWorkAction,
} from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cockpit — GTM University' }

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
}

export default async function CockpitUniversity({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  if (!(await isCockpitAuthed())) redirect('/cockpit/login')

  const noKey = !hasServiceKey()
  const state = await getCockpitState()

  const timeFor = (id: string) => state?.time_by_unit?.[id] ?? 0
  const statusFor = (id: string) => state?.status_by_unit?.[id]?.status ?? 'not_started'

  // Working set = the requested stage, else the first unfinished (non-continuous) stage on the path.
  const { stage: stageParam } = await searchParams
  const stages = pathStages()
  const activeStage =
    stages.find((s) => s.stage.id === stageParam) ??
    stages.find((s) => !s.stage.continuous && s.subtasks.some((r) => statusFor(r.subtask.id) !== 'done')) ??
    stages[stages.length - 1]
  const sliceSubtasks: Subtask[] = activeStage.subtasks.map((r) => r.subtask)
  const resources = stageResources(activeStage)
  const running = state?.running ?? null
  const runningRef = running ? findSubtask(running.unit_id) : null
  const fc = state?.forecast ?? null

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Cockpit · private</p>
        <h1 className="mt-2 text-3xl font-bold">GTM University</h1>
        <nav className="mt-3 flex gap-3 font-mono text-xs text-ink-soft">
          <Link href="/university" className="hover:text-ink">→ public view</Link>
        </nav>
      </header>

      {noKey ? (
        <div className="mb-8 rounded-lg border border-pending bg-paper p-4 text-sm">
          <p className="font-semibold text-ink">One step to go live</p>
          <p className="mt-1 text-ink-muted">
            Add <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> (Supabase → GTM_OS_HUB →
            Settings → API → service_role) and a <code className="font-mono text-xs">COCKPIT_PASSWORD</code> to{' '}
            <code className="font-mono text-xs">.env.local</code>, then restart. The timer + submissions write
            through this key.
          </p>
        </div>
      ) : null}

      {/* Pace (cockpit-only) */}
      <section className="mb-8 rounded-lg border border-edge bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Pace</h2>
        {fc && fc.confidence_state !== 'cold_start' ? (
          <div className="mt-3 grid grid-cols-3 gap-4">
            <Stat label="Logged" value={`${fc.logged_hours ?? 0}h`} />
            <Stat label="Est. remaining" value={fc.est_remaining_hours != null ? `${fc.est_remaining_hours}h` : '—'} />
            <Stat label="Est. total" value={fc.est_total_hours != null ? `${fc.est_total_hours}h` : '—'} />
          </div>
        ) : (
          <p className="mt-2 font-mono text-xs text-ink-soft">
            ⊘ forecast calibrating — switches on after ~4 completed sub-tasks
            {fc?.logged_hours ? ` · ${fc.logged_hours}h logged so far` : ''}.
          </p>
        )}
      </section>

      {/* Running timer */}
      {running ? (
        <section className="mb-8 rounded-lg border border-progress bg-paper p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">Timer running</p>
              <p className="mt-0.5 text-sm font-medium">{runningRef?.subtask.title ?? running.unit_id}</p>
              <p className="font-mono text-[11px] text-ink-soft">since {new Date(running.started_at).toLocaleString()}</p>
            </div>
            <form action={stopTimerAction}>
              <button className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-cream hover:bg-accent-dark">
                Stop
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {/* Active path stage */}
      <section className="mb-8">
        <nav className="mb-4 flex flex-wrap gap-1 font-mono text-[11px]">
          {stages.map((s, i) => (
            <Link
              key={s.stage.id}
              href={`/cockpit/university?stage=${s.stage.id}`}
              title={s.stage.title}
              className={`rounded-md border px-2 py-1 ${s.stage.id === activeStage.stage.id ? 'border-accent text-ink' : 'border-edge text-ink-soft hover:text-ink'}`}
            >
              {s.stage.continuous ? '∞' : i}
            </Link>
          ))}
        </nav>
        <h2 className="mb-1 text-lg font-semibold">{activeStage.stage.title}</h2>
        <p className="text-sm text-ink-muted">{activeStage.stage.goal}</p>
        <p className="mt-1 text-xs text-ink-soft">Why here: {activeStage.stage.why}</p>
        <p className="mb-4 mt-1 font-mono text-[11px] text-ink-soft">exit → {activeStage.stage.exit}</p>
        <ul className="space-y-2">
          {sliceSubtasks.map((st) => {
            const status = statusFor(st.id)
            const hrs = timeFor(st.id)
            const isRunning = running?.unit_id === st.id
            return (
              <li key={st.id} className="rounded-lg border border-edge bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{st.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
                      {st.kind} · complexity {st.complexity} · {STATUS_LABEL[status]} · {hrs}h logged
                      {st.ref ? ` · ${st.ref}` : ''}
                    </p>
                  </div>
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background:
                        status === 'done'
                          ? 'var(--color-done)'
                          : status === 'in_progress'
                            ? 'var(--color-progress)'
                            : 'var(--color-pending)',
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!isRunning ? (
                    <FormButton action={startTimerAction} unitId={st.id} label="▶ Start" />
                  ) : (
                    <span className="font-mono text-[11px] text-progress">● running</span>
                  )}
                  <form action={addManualTimeAction} className="flex items-center gap-1">
                    <input type="hidden" name="unitId" value={st.id} />
                    <input
                      type="number"
                      name="minutes"
                      min={1}
                      placeholder="min"
                      className="w-16 rounded-md border border-edge bg-paper px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                    <button className="rounded-md border border-edge px-2 py-1 text-xs hover:border-accent">+ log</button>
                  </form>
                  {status !== 'done' ? (
                    <FormButton action={setStatusAction} unitId={st.id} extra={{ status: 'done' }} label="✓ Mark done" />
                  ) : (
                    <FormButton action={setStatusAction} unitId={st.id} extra={{ status: 'in_progress' }} label="↺ Reopen" />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {resources.length ? (
          <div className="mt-4 rounded-lg border border-edge bg-paper p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">Resources for this stage</p>
            <ul className="mt-2 space-y-1 text-sm">
              {resources.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-dark">
                    {r.title}
                  </a>
                  <span className="ml-2 font-mono text-[10px] uppercase text-ink-soft">{r.kind}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Submit work */}
      <section className="rounded-lg border border-edge bg-surface p-5">
        <h2 className="text-lg font-semibold">Submit work</h2>
        <form action={submitWorkAction} className="mt-3 space-y-3">
          <select name="unitId" className="w-full rounded-md border border-edge bg-paper px-3 py-2 text-sm" required>
            <option value="">Select a sub-task…</option>
            {sliceSubtasks.map((st) => (
              <option key={st.id} value={st.id}>
                {st.title}
              </option>
            ))}
          </select>
          <input type="hidden" name="kind" value="project" />
          <input name="title" placeholder="Title" required className="w-full rounded-md border border-edge bg-paper px-3 py-2 text-sm" />
          <input name="artifactUrl" placeholder="Artifact URL (GitHub / Notion / Loom)" className="w-full rounded-md border border-edge bg-paper px-3 py-2 text-sm" />
          <textarea name="body" placeholder="Private notes (never shown publicly)" rows={2} className="w-full rounded-md border border-edge bg-paper px-3 py-2 text-sm" />
          <textarea name="summary" placeholder="Public summary (PII-safe — shown on the public page if 'public' is checked)" rows={2} className="w-full rounded-md border border-edge bg-paper px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="isPublic" /> Make this submission public
          </label>
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-cream hover:bg-accent-dark">Submit</button>
        </form>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 text-xl font-semibold">{value}</p>
    </div>
  )
}

function FormButton({
  action,
  unitId,
  label,
  extra,
}: {
  action: (formData: FormData) => void
  unitId: string
  label: string
  extra?: Record<string, string>
}) {
  return (
    <form action={action}>
      <input type="hidden" name="unitId" value={unitId} />
      {extra
        ? Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      <button className="rounded-md border border-edge px-2.5 py-1 text-xs hover:border-accent">{label}</button>
    </form>
  )
}
