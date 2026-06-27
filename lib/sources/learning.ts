import { assertPublicSafe, scrub } from '../public-safety'
import { publicClient } from '../supabase/public'

/**
 * PUBLIC learning shapes. Note what is ABSENT (cf. PublicCommit in github.ts):
 * no submission body_md, no time-entry timestamps, no notes, no emails, no
 * forecast/pace. The TYPE is the primary PII control — pace lives only in the
 * internal learning.* views read by the service-role cockpit, never here.
 */
export interface PublicProgress {
  unitId: string
  level: string
  subtasksTotal: number
  subtasksDone: number
  pctDone: number
}

export interface PublicSubmission {
  unitId: string
  kind: string
  title: string
  summary: string | null // public_summary only — never body_md
  artifactUrl: string | null
  submittedOn: string
}

export interface PublicUniversity {
  progress: PublicProgress[]
  submissions: PublicSubmission[]
}

// Raw row shapes from the v_public_* views (PII-free by construction).
interface ProgressRow {
  unit_id: string
  level: string
  subtasks_total: number | null
  subtasks_done: number | null
  pct_done: number | null
}
interface SubmissionRow {
  unit_id: string
  kind: string
  title: string | null
  public_summary: string | null
  artifact_url: string | null
  submitted_on: string
}

export function mapProgress(r: ProgressRow): PublicProgress {
  return {
    unitId: r.unit_id,
    level: r.level,
    subtasksTotal: r.subtasks_total ?? 0,
    subtasksDone: r.subtasks_done ?? 0,
    pctDone: r.pct_done ?? 0,
  }
}

export function mapSubmission(r: SubmissionRow): PublicSubmission {
  // body_md is deliberately not read. Free text is scrubbed as belt-and-suspenders.
  return {
    unitId: r.unit_id,
    kind: r.kind,
    title: scrub(r.title ?? ''),
    summary: r.public_summary ? scrub(r.public_summary) : null,
    artifactUrl: r.artifact_url ?? null,
    submittedOn: r.submitted_on,
  }
}

const FIXTURE: PublicUniversity = { progress: [], submissions: [] }

/**
 * Fetch the PUBLIC university payload (progress + gated submissions only).
 * Without Supabase env (local/no-network) returns an empty fixture so the page
 * always renders. Every return path passes through assertPublicSafe — the egress gate.
 */
export async function getPublicUniversity(): Promise<PublicUniversity> {
  const sb = publicClient()
  if (!sb) {
    assertPublicSafe(FIXTURE, 'university fixture')
    return FIXTURE
  }

  const [progressRes, subsRes] = await Promise.all([
    sb.from('v_public_progress').select('unit_id, level, subtasks_total, subtasks_done, pct_done'),
    sb
      .from('v_public_submissions')
      .select('unit_id, kind, title, public_summary, artifact_url, submitted_on'),
  ])

  const out: PublicUniversity = {
    progress: ((progressRes.data as ProgressRow[] | null) ?? []).map(mapProgress),
    submissions: ((subsRes.data as SubmissionRow[] | null) ?? []).map(mapSubmission),
  }

  assertPublicSafe(out, 'university public payload') // egress NET — throws on any PII hit
  return out
}
