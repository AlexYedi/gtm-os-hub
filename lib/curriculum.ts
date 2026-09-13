import { curriculum } from '../content/curriculum'
import type { Area, Curriculum, Module, PathStage, Resource, Section, Subtask } from '../content/curriculum/types'

/** Flat DB-shaped row (mirrors learning.curriculum_unit columns). */
export interface FlatUnit {
  unit_id: string
  parent_id: string | null
  level: 'area' | 'section' | 'module' | 'subtask'
  domain_id: string
  competency_mode: 'leveled' | 'binary'
  kind: 'exercise' | 'project' | 'capstone' | null
  title: string
  complexity: number | null
  is_capstone: boolean
  sort_order: number
}

/** Flatten the content-as-code tree into rows for learning.curriculum_unit. */
export function flattenCurriculum(c: Curriculum = curriculum): FlatUnit[] {
  const rows: FlatUnit[] = []
  c.areas.forEach((area, ai) => {
    rows.push({
      unit_id: area.id, parent_id: null, level: 'area', domain_id: area.domainId,
      competency_mode: area.competencyMode, kind: null, title: area.title,
      complexity: null, is_capstone: false, sort_order: ai,
    })
    area.sections.forEach((section, si) => {
      rows.push({
        unit_id: section.id, parent_id: area.id, level: 'section', domain_id: area.domainId,
        competency_mode: area.competencyMode, kind: null, title: section.title,
        complexity: null, is_capstone: false, sort_order: si,
      })
      section.modules.forEach((mod, mi) => {
        rows.push({
          unit_id: mod.id, parent_id: section.id, level: 'module', domain_id: area.domainId,
          competency_mode: area.competencyMode, kind: null, title: mod.title,
          complexity: null, is_capstone: false, sort_order: mi,
        })
        mod.subtasks.forEach((st, sti) => {
          rows.push({
            unit_id: st.id, parent_id: mod.id, level: 'subtask', domain_id: area.domainId,
            competency_mode: area.competencyMode, kind: st.kind, title: st.title,
            complexity: st.complexity, is_capstone: !!st.isCapstone, sort_order: sti,
          })
        })
      })
    })
  })
  return rows
}

/** Throw if any unit id is duplicated — ids are the cross-table key; collisions corrupt data. */
export function assertUniqueIds(c: Curriculum = curriculum): void {
  const seen = new Set<string>()
  for (const row of flattenCurriculum(c)) {
    if (seen.has(row.unit_id)) throw new Error(`Duplicate curriculum unit_id: ${row.unit_id}`)
    seen.add(row.unit_id)
  }
}

// ── Rendering lookups ────────────────────────────────────────────────────

export interface SubtaskRef { subtask: Subtask; module: Module; section: Section; area: Area }

export function allSubtasks(c: Curriculum = curriculum): SubtaskRef[] {
  const out: SubtaskRef[] = []
  for (const area of c.areas)
    for (const section of area.sections)
      for (const module of section.modules)
        for (const subtask of module.subtasks)
          out.push({ subtask, module, section, area })
  return out
}

export function findArea(id: string, c: Curriculum = curriculum): Area | undefined {
  return c.areas.find((a) => a.id === id)
}

export function findSubtask(id: string, c: Curriculum = curriculum): SubtaskRef | undefined {
  return allSubtasks(c).find((r) => r.subtask.id === id)
}

/** Counts used by the insights dashboard. */
export function curriculumTotals(c: Curriculum = curriculum) {
  const subtasks = allSubtasks(c)
  const modules = c.areas.flatMap((a) => a.sections.flatMap((s) => s.modules))
  return {
    areas: c.areas.length,
    modules: modules.length,
    subtasks: subtasks.length,
    exercises: subtasks.filter((r) => r.subtask.kind === 'exercise').length,
    projects: subtasks.filter((r) => r.subtask.kind === 'project').length,
    capstones: subtasks.filter((r) => r.subtask.kind === 'capstone').length,
    totalComplexity: subtasks.reduce((n, r) => n + (r.subtask.complexity || 0), 0),
  }
}

export { curriculum }

// ── The path ─────────────────────────────────────────────────────────────

export interface StageRef { stage: PathStage; subtasks: SubtaskRef[] }

/** The path with each stage's subtask ids resolved. Throws on an unknown id. */
export function pathStages(c: Curriculum = curriculum): StageRef[] {
  const byId = new Map(allSubtasks(c).map((r) => [r.subtask.id, r]))
  return c.path.map((stage) => ({
    stage,
    subtasks: stage.subtaskIds.map((id) => {
      const ref = byId.get(id)
      if (!ref) throw new Error(`Path stage ${stage.id} references unknown subtask: ${id}`)
      return ref
    }),
  }))
}

/** Throw unless stage ids are unique and every subtask sits in exactly one stage. */
export function assertPathCoverage(c: Curriculum = curriculum): void {
  const stageIds = new Set<string>()
  const placed = new Map<string, string>()
  for (const stage of c.path) {
    if (stageIds.has(stage.id)) throw new Error(`Duplicate path stage id: ${stage.id}`)
    stageIds.add(stage.id)
    for (const id of stage.subtaskIds) {
      const prior = placed.get(id)
      if (prior) throw new Error(`Subtask ${id} is in two path stages: ${prior} and ${stage.id}`)
      placed.set(id, stage.id)
    }
  }
  const missing = allSubtasks(c).map((r) => r.subtask.id).filter((id) => !placed.has(id))
  if (missing.length) throw new Error(`Subtasks missing from the path: ${missing.join(', ')}`)
  pathStages(c)
}

/** Distinct resources across the modules a stage touches, in path order. */
export function stageResources(ref: StageRef): Resource[] {
  const seen = new Set<string>()
  const out: Resource[] = []
  for (const { module } of ref.subtasks)
    for (const r of module.resources ?? [])
      if (!seen.has(r.url)) {
        seen.add(r.url)
        out.push(r)
      }
  return out
}
