import { curriculum } from '../content/curriculum'
import type { Area, Curriculum, Module, Section, Subtask } from '../content/curriculum/types'

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
