import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isCockpitAuthed } from '@/lib/auth'
import { getCockpitBoard, type CockpitIssue } from '@/lib/sources/cockpit-linear'
import { formatDate } from '@/lib/format'

// Private, uncached (mirrors app/cockpit/university). Never cached, never public.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cockpit — Roadmap' }

const PRIORITY_LABEL: Record<number, string> = {
  0: 'No priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

export default async function Cockpit() {
  // Self-guard: the middleware presence-check is UX, not the boundary. The page re-verifies.
  if (!(await isCockpitAuthed())) redirect('/cockpit/login')

  const board = await getCockpitBoard()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">Cockpit · private</p>
        <h1 className="mt-2 text-3xl font-bold">Roadmap</h1>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Full-fidelity operating view — titles, priorities, blockers. Auth-gated; never egressed.
          The public map shows counts only.
        </p>
        <nav className="mt-3 flex gap-3 font-mono text-xs text-ink-soft">
          <Link href="/cockpit/university" className="hover:text-ink">
            → GTM University
          </Link>
          <Link href="/system" className="hover:text-ink">
            → public system map
          </Link>
        </nav>
      </header>

      {board === null ? (
        <div className="rounded-lg border border-pending bg-paper p-4 text-sm">
          <p className="font-semibold text-ink">One step to go live</p>
          <p className="mt-1 text-ink-muted">
            Add <code className="font-mono text-xs">LINEAR_API_KEY</code> (Linear → Settings → API →
            Personal API key) and optionally{' '}
            <code className="font-mono text-xs">LINEAR_COCKPIT_TEAM_KEY</code> to{' '}
            <code className="font-mono text-xs">.env.local</code>, then restart. This board reads your
            operating team; the public map reads a separate safe board.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Column title="Next" hint="triage · backlog · todo" issues={board.next} tone="pending" />
          <Column title="In progress" hint="started" issues={board.inProgress} tone="progress" />
          <Column title="Blockers" hint="blocked by another issue" issues={board.blockers} tone="accent" />
        </div>
      )}
    </main>
  )
}

const TONE_VAR: Record<string, string> = {
  pending: 'var(--color-pending)',
  progress: 'var(--color-progress)',
  accent: 'var(--color-accent)',
}

function Column({
  title,
  hint,
  issues,
  tone,
}: {
  title: string
  hint: string
  issues: CockpitIssue[]
  tone: 'pending' | 'progress' | 'accent'
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between border-b border-edge pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h2>
        <span className="font-mono text-xs tabular-nums text-ink-soft">{issues.length}</span>
      </div>
      <p className="mb-3 font-mono text-[11px] text-ink-soft">{hint}</p>
      {issues.length === 0 ? (
        <p className="font-mono text-[11px] text-ink-soft">— none —</p>
      ) : (
        <ul className="space-y-2">
          {issues.map((it) => (
            <IssueCard key={it.identifier} issue={it} tone={tone} />
          ))}
        </ul>
      )}
    </section>
  )
}

function IssueCard({ issue, tone }: { issue: CockpitIssue; tone: 'pending' | 'progress' | 'accent' }) {
  return (
    <li className="rounded-lg border border-edge bg-surface p-3">
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ background: TONE_VAR[tone] }}
          aria-hidden
        />
        <div className="min-w-0">
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-medium leading-snug text-ink hover:text-accent-dark"
          >
            {issue.title}
          </a>
          <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
            {issue.identifier} · {issue.state} · {PRIORITY_LABEL[issue.priority]} ·{' '}
            {formatDate(issue.updatedAt)}
            {issue.isBlocked ? ' · ⛔ blocked' : ''}
          </p>
        </div>
      </div>
    </li>
  )
}
