import { curriculum as defaultCurriculum } from './curriculum'
import type { Curriculum } from '../content/curriculum/types'
import type { PublicProgress, PublicSubmission } from './sources/learning'

export interface UnitProgress {
  total: number
  done: number
  pct: number
}
export type ProgressMap = Record<string, UnitProgress>

export function toProgressMap(rows: PublicProgress[]): ProgressMap {
  const m: ProgressMap = {}
  for (const r of rows) m[r.unitId] = { total: r.subtasksTotal, done: r.subtasksDone, pct: r.pctDone }
  return m
}

/** Public-safe completion metrics (NO time/pace — that stays in the cockpit). */
export interface Insights {
  areasTotal: number
  modulesTotal: number
  modulesComplete: number
  modulesRemaining: number
  subtasksTotal: number
  subtasksComplete: number
  subtasksRemaining: number
  exercisesTotal: number
  exercisesComplete: number
  capstonesTotal: number
  capstonesComplete: number
  pctProgress: number
  publicSubmissions: number
}

function isDone(pm: ProgressMap, id: string): boolean {
  const p = pm[id]
  return !!p && p.total > 0 && p.done >= p.total
}

export function computeInsights(
  pm: ProgressMap,
  publicSubmissions: number,
  c: Curriculum = defaultCurriculum,
): Insights {
  const modules = c.areas.flatMap((a) => a.sections.flatMap((s) => s.modules))
  const subtasks = modules.flatMap((m) => m.subtasks)

  const modulesComplete = modules.filter((m) => isDone(pm, m.id)).length
  const subtasksComplete = subtasks.filter((st) => isDone(pm, st.id)).length
  const exercises = subtasks.filter((st) => st.kind === 'exercise')
  const capstones = subtasks.filter((st) => st.kind === 'capstone')

  return {
    areasTotal: c.areas.length,
    modulesTotal: modules.length,
    modulesComplete,
    modulesRemaining: modules.length - modulesComplete,
    subtasksTotal: subtasks.length,
    subtasksComplete,
    subtasksRemaining: subtasks.length - subtasksComplete,
    exercisesTotal: exercises.length,
    exercisesComplete: exercises.filter((st) => isDone(pm, st.id)).length,
    capstonesTotal: capstones.length,
    capstonesComplete: capstones.filter((st) => isDone(pm, st.id)).length,
    pctProgress: subtasks.length ? Math.round((100 * subtasksComplete) / subtasks.length) : 0,
    publicSubmissions,
  }
}

export interface AreaView {
  id: string
  domainId: string
  title: string
  tier: 'own' | 'do' | 'recognize'
  pct: number
  done: number
  total: number
  summary?: string
}

/** Per-area roll-up for the area cards. */
export function areaViews(pm: ProgressMap, c: Curriculum = defaultCurriculum): AreaView[] {
  return c.areas.map((a) => {
    const p = pm[a.id] ?? { total: 0, done: 0, pct: 0 }
    return {
      id: a.id,
      domainId: a.domainId,
      title: a.title,
      tier: a.tier,
      pct: p.pct,
      done: p.done,
      total: p.total,
      summary: a.summary,
    }
  })
}

export function submissionsByUnit(subs: PublicSubmission[]): Record<string, PublicSubmission[]> {
  const m: Record<string, PublicSubmission[]> = {}
  for (const s of subs) (m[s.unitId] ??= []).push(s)
  return m
}

export interface StageView {
  id: string
  title: string
  goal: string
  exit: string
  continuous: boolean
  done: number
  total: number
  pct: number
}

/** Per-stage roll-up for the path (completion only — no pace). */
export function stageViews(pm: ProgressMap, c: Curriculum = defaultCurriculum): StageView[] {
  return c.path.map((s) => {
    const total = s.subtaskIds.length
    const done = s.subtaskIds.filter((id) => isDone(pm, id)).length
    return {
      id: s.id,
      title: s.title,
      goal: s.goal,
      exit: s.exit,
      continuous: !!s.continuous,
      done,
      total,
      pct: total ? Math.round((100 * done) / total) : 0,
    }
  })
}
