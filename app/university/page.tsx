import Link from 'next/link'
import { getPublicUniversity } from '@/lib/sources/learning'
import { curriculum } from '@/lib/curriculum'
import { toProgressMap, computeInsights, areaViews, stageViews, submissionsByUnit } from '@/lib/university-view'
import { findSubtask } from '@/lib/curriculum'
import { StatCard, AreaCard, ProgressMeter } from '@/components/university/ui'

// ISR — matches the GitHub adapter's posture; render never blocks on the spine.
export const revalidate = 900

export const metadata = {
  title: 'GTM University — learning, instrumented in public',
  description: 'A self-instrumented full-stack GTM learning path. The curriculum, the work, and the progress — measured, not guessed.',
}

export default async function UniversityPage() {
  const { progress, submissions } = await getPublicUniversity()
  const pm = toProgressMap(progress)
  const insights = computeInsights(pm, submissions.length)
  const areas = areaViews(pm)
  const stages = stageViews(pm)
  const subsByUnit = submissionsByUnit(submissions)

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-20">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">GTM University · in public</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">The path, instrumented</h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-muted">
          A full-stack GTM-engineering curriculum I&rsquo;m working in the open — nine domains, sequenced into one path from
          engineering fundamentals to agents that run revenue motions end to end. Rather than guess a timeline, I <em>measure</em> the work: every
          exercise, project, and capstone is logged, and the remaining effort is forecast from real velocity.
          The data foundation discipline, applied to my own learning.
        </p>
        <nav className="mt-6 flex gap-1 rounded-lg border border-edge bg-paper p-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink">
            The Work, Live
          </Link>
          <span className="rounded-md bg-surface px-3 py-1.5 font-medium text-ink shadow-sm">GTM University</span>
        </nav>
      </header>

      {/* Insight metrics (completion only — pace is tracked privately in the cockpit) */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Progress</h2>
          <span className="font-mono text-xs text-ink-soft">source: supabase · learning schema</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Overall" value={`${insights.pctProgress}%`} sub={`${insights.subtasksComplete}/${insights.subtasksTotal} items`} />
          <StatCard label="Modules" value={`${insights.modulesComplete}/${insights.modulesTotal}`} sub={`${insights.modulesRemaining} to go`} />
          <StatCard label="Exercises" value={`${insights.exercisesComplete}/${insights.exercisesTotal}`} sub={`${insights.exercisesTotal - insights.exercisesComplete} to go`} />
          <StatCard label="Capstones" value={`${insights.capstonesComplete}/${insights.capstonesTotal}`} sub="one per area" />
          <StatCard label="Shared work" value={`${insights.publicSubmissions}`} sub="public artifacts" />
        </div>
        <p className="mt-3 font-mono text-[11px] text-ink-soft">
          ⊘ time-on-task &amp; the velocity forecast are instrumented and tracked privately — calibrating until
          enough sessions are logged.
        </p>
      </section>

      {/* The path — one sequence across the nine areas */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">The path</h2>
          <span className="font-mono text-xs text-ink-soft">{stages.length} stages · sequenced across areas</span>
        </div>
        <ol className="space-y-3">
          {stages.map((s, i) => (
            <li key={s.id} className="rounded-lg border border-edge bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold leading-snug">
                  <span className="mr-2 font-mono text-xs text-ink-soft">{s.continuous ? '∞' : String(i).padStart(2, '0')}</span>
                  {s.title}
                </h3>
                <span className="shrink-0 font-mono text-[11px] text-ink-soft">
                  {s.done}/{s.total}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.goal}</p>
              <p className="mt-2 font-mono text-[11px] text-ink-soft">exit → {s.exit}</p>
              <div className="mt-3">
                <ProgressMeter pct={s.pct} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* The nine areas */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold">Areas of expertise</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {areas.map((a) => (
            <AreaCard key={a.id} area={a} />
          ))}
        </div>
      </section>

      {/* Shared work */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Shared work</h2>
        {submissions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-edge bg-paper p-5 font-mono text-sm text-ink-soft">
            ⊘ instrumenting — awaiting the first public artifact.
          </p>
        ) : (
          <ul className="space-y-3">
            {submissions.map((s, i) => {
              const ref = findSubtask(s.unitId)
              return (
                <li key={`${s.unitId}-${i}`} className="rounded-lg border border-edge bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-base font-semibold leading-snug">{s.title}</h3>
                    <span className="shrink-0 font-mono text-[11px] text-ink-soft">{s.submittedOn}</span>
                  </div>
                  {ref ? (
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                      {ref.area.domainId.toUpperCase()} · {s.kind}
                    </p>
                  ) : null}
                  {s.summary ? <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.summary}</p> : null}
                  {s.artifactUrl ? (
                    <a
                      href={s.artifactUrl}
                      className="mt-2 inline-block font-mono text-xs text-accent hover:text-accent-dark"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      view artifact →
                    </a>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <footer className="mt-16 border-t border-edge pt-6 font-mono text-xs text-ink-soft">
        Curriculum is content-as-code · progress + submissions read from Supabase via PII-safe views · pace stays private.
      </footer>
    </main>
  )
}
