'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { assertCockpit } from '@/lib/auth'
import { admin } from '@/lib/supabase/admin'

// Every action re-verifies auth FIRST (Server Actions are public POST endpoints;
// the /cockpit middleware only gates navigation). Same severity as the PII gate.

async function rpc(fn: string, args: Record<string, unknown>) {
  const { error } = await admin().rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
}

function refresh() {
  revalidatePath('/cockpit/university')
  revalidatePath('/university')
}

export async function startTimerAction(formData: FormData) {
  await assertCockpit()
  const unitId = String(formData.get('unitId') || '')
  if (!unitId) return
  await rpc('uni_start_timer', { p_unit_id: unitId, p_client_entry_id: randomUUID() })
  refresh()
}

export async function stopTimerAction(formData: FormData) {
  await assertCockpit()
  const note = (formData.get('note') as string)?.trim() || null
  await rpc('uni_stop_timer', { p_note: note })
  refresh()
}

export async function addManualTimeAction(formData: FormData) {
  await assertCockpit()
  const unitId = String(formData.get('unitId') || '')
  const minutes = Number.parseInt(String(formData.get('minutes') || ''), 10)
  const note = (formData.get('note') as string)?.trim() || null
  if (!unitId || !Number.isFinite(minutes) || minutes <= 0) return
  await rpc('uni_add_manual_time', {
    p_unit_id: unitId,
    p_minutes: minutes,
    p_started_at: new Date().toISOString(),
    p_note: note,
    p_client_entry_id: randomUUID(),
  })
  refresh()
}

export async function setStatusAction(formData: FormData) {
  await assertCockpit()
  const unitId = String(formData.get('unitId') || '')
  const status = String(formData.get('status') || '')
  const level = (formData.get('level') as string)?.trim() || null
  if (!unitId || !status) return
  await rpc('uni_set_status', { p_unit_id: unitId, p_status: status, p_competency_level: level })
  refresh()
}

export async function submitWorkAction(formData: FormData) {
  await assertCockpit()
  const unitId = String(formData.get('unitId') || '')
  const title = String(formData.get('title') || '').trim()
  if (!unitId || !title) return
  await rpc('uni_submit_work', {
    p_unit_id: unitId,
    p_kind: String(formData.get('kind') || 'exercise'),
    p_title: title,
    p_body_md: (formData.get('body') as string)?.trim() || null,
    p_artifact_url: (formData.get('artifactUrl') as string)?.trim() || null,
    p_is_public: formData.get('isPublic') === 'on',
    p_public_summary: (formData.get('summary') as string)?.trim() || null,
  })
  refresh()
}
