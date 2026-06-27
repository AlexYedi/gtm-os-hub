// GTM University — curriculum content model (content-as-code; source of truth).
// `scripts/sync-curriculum.ts` flattens this tree into learning.curriculum_unit.
// IMPORTANT: `id` values are STABLE slugs — they are the cross-table key in Supabase.
// Never rename an id once work has been logged against it (rename orphans data).

export type UnitLevel = 'area' | 'section' | 'module' | 'subtask'
export type CompetencyMode = 'leveled' | 'binary'
export type SubtaskKind = 'exercise' | 'project' | 'capstone'
export type Tier = 'own' | 'do' | 'recognize'
export type RubricLevelName = 'novice' | 'practitioner' | 'expert'

export interface RubricLevel {
  level: RubricLevelName
  /** "What good looks like" at this level. */
  descriptor: string
}

export interface Subtask {
  id: string
  title: string
  kind: SubtaskKind
  /** 1..5 — the forecasting input (effort/difficulty estimate). */
  complexity: number
  isCapstone?: boolean
  /** What to produce. */
  prompt?: string
  /** Present on leveled (Own) areas; omitted on binary (Do/Recognize) areas. */
  rubric?: RubricLevel[]
  /** Optional external anchor (e.g. a Linear issue) shown in the cockpit. */
  ref?: string
}

export interface Module {
  id: string
  title: string
  summary?: string
  /** Markdown lesson content. */
  body?: string
  subtasks: Subtask[]
}

export interface Section {
  id: string
  title: string
  summary?: string
  modules: Module[]
}

export interface Area {
  id: string
  /** 'd1'..'d9' */
  domainId: string
  title: string
  tier: Tier
  competencyMode: CompetencyMode
  summary?: string
  sections: Section[]
}

export interface Curriculum {
  areas: Area[]
}
