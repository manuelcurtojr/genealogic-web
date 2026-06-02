/**
 * Server actions de CONFIGURACIÓN del Embudo: CRUD de pipelines y pasos.
 * Invariante: cada pipeline debe tener >=1 paso 'normal', >=1 'won', >=1 'lost'
 * (garantiza estadística de conversión). Se valida aquí antes de cada cambio.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import type { StageType } from '@/lib/pipelines/types'

type Res = { ok: true } | { ok: false; error: string }

async function ctx() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: k } = await admin
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!k) return null
  return { admin, kennelId: k.id as string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ownsPipeline(admin: any, kennelId: string, pipelineId: string) {
  const { data } = await admin
    .from('pipelines')
    .select('id')
    .eq('id', pipelineId)
    .eq('kennel_id', kennelId)
    .maybeSingle()
  return !!data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadStage(admin: any, kennelId: string, stageId: string) {
  const { data } = await admin
    .from('pipeline_stages')
    .select('id, pipeline_id, type, position, pipeline:pipelines(kennel_id)')
    .eq('id', stageId)
    .maybeSingle()
  if (!data || data.pipeline?.kennel_id !== kennelId) return null
  return data as { id: string; pipeline_id: string; type: StageType; position: number }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function typeCounts(admin: any, pipelineId: string): Promise<Record<StageType, number>> {
  const { data } = await admin.from('pipeline_stages').select('type').eq('pipeline_id', pipelineId)
  const c: Record<StageType, number> = { normal: 0, won: 0, lost: 0 }
  for (const s of data || []) c[s.type as StageType]++
  return c
}

const INVARIANT = (t: (s: string) => string) =>
  t('Cada pipeline necesita al menos 1 paso normal, 1 ganado y 1 perdido.')

// ───────────────────────── pipelines ─────────────────────────
export async function createPipeline(name: string): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c) return { ok: false, error: t('Sin permiso') }
  const nm = (name || '').trim()
  if (!nm) return { ok: false, error: t('El nombre no puede estar vacío') }
  const { data: last } = await c.admin
    .from('pipelines')
    .select('position')
    .eq('kennel_id', c.kennelId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const pos = (last?.position ?? -1) + 1
  const { data: p, error } = await c.admin
    .from('pipelines')
    .insert({ kennel_id: c.kennelId, name: nm, position: pos, is_default: false })
    .select('id')
    .single()
  if (error || !p) return { ok: false, error: error?.message || 'error' }
  // sembrar el mínimo válido: 1 normal(entrada) + 1 ganado + 1 perdido
  await c.admin.from('pipeline_stages').insert([
    { pipeline_id: p.id, name: 'Nuevo', position: 0, type: 'normal', is_entry: true },
    { pipeline_id: p.id, name: 'Ganado', position: 1, type: 'won', celebrate: true },
    { pipeline_id: p.id, name: 'Perdido', position: 2, type: 'lost', loss_reasons: ['Otro'] },
  ])
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}

export async function renamePipeline(id: string, name: string): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c || !(await ownsPipeline(c.admin, c.kennelId, id))) return { ok: false, error: t('Sin permiso') }
  const nm = (name || '').trim()
  if (!nm) return { ok: false, error: t('El nombre no puede estar vacío') }
  await c.admin.from('pipelines').update({ name: nm }).eq('id', id)
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}

export async function deletePipeline(id: string): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c || !(await ownsPipeline(c.admin, c.kennelId, id))) return { ok: false, error: t('Sin permiso') }
  const { count: pcount } = await c.admin
    .from('pipelines')
    .select('id', { count: 'exact', head: true })
    .eq('kennel_id', c.kennelId)
  if ((pcount || 0) <= 1) return { ok: false, error: t('Debe quedar al menos un pipeline.') }
  const { count: ecount } = await c.admin
    .from('puppy_reservations')
    .select('id', { count: 'exact', head: true })
    .eq('pipeline_id', id)
  if ((ecount || 0) > 0) return { ok: false, error: t('No puedes borrar un pipeline con fichas dentro.') }
  await c.admin.from('pipelines').delete().eq('id', id)
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}

// ───────────────────────── stages ─────────────────────────
export async function createStage(pipelineId: string, name: string, type: StageType): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c || !(await ownsPipeline(c.admin, c.kennelId, pipelineId))) return { ok: false, error: t('Sin permiso') }
  const nm = (name || '').trim()
  if (!nm) return { ok: false, error: t('El nombre no puede estar vacío') }
  const { data: last } = await c.admin
    .from('pipeline_stages')
    .select('position')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const pos = (last?.position ?? -1) + 1
  await c.admin.from('pipeline_stages').insert({
    pipeline_id: pipelineId,
    name: nm,
    type,
    position: pos,
    celebrate: type === 'won',
    loss_reasons: type === 'lost' ? ['Otro'] : [],
  })
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}

export async function updateStage(
  id: string,
  patch: {
    name?: string
    type?: StageType
    loss_reasons?: string[]
    celebrate?: boolean
    handoff_stage_id?: string | null
  },
): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c) return { ok: false, error: t('Sin permiso') }
  const stage = await loadStage(c.admin, c.kennelId, id)
  if (!stage) return { ok: false, error: t('Sin permiso') }

  // cambiar el tipo no puede dejar el pipeline sin algún tipo
  if (patch.type && patch.type !== stage.type) {
    const counts = await typeCounts(c.admin, stage.pipeline_id)
    if (counts[stage.type] <= 1) return { ok: false, error: INVARIANT(t) }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upd: Record<string, any> = {}
  if (patch.name !== undefined) {
    const nm = patch.name.trim()
    if (!nm) return { ok: false, error: t('El nombre no puede estar vacío') }
    upd.name = nm
  }
  if (patch.type !== undefined) upd.type = patch.type
  if (patch.loss_reasons !== undefined) upd.loss_reasons = patch.loss_reasons
  if (patch.celebrate !== undefined) upd.celebrate = patch.celebrate
  if (patch.handoff_stage_id !== undefined) upd.handoff_stage_id = patch.handoff_stage_id
  if (Object.keys(upd).length === 0) return { ok: true }
  await c.admin.from('pipeline_stages').update(upd).eq('id', id)
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}

export async function deleteStage(id: string): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c) return { ok: false, error: t('Sin permiso') }
  const stage = await loadStage(c.admin, c.kennelId, id)
  if (!stage) return { ok: false, error: t('Sin permiso') }
  const counts = await typeCounts(c.admin, stage.pipeline_id)
  if (counts[stage.type] <= 1) return { ok: false, error: INVARIANT(t) }
  const { count } = await c.admin
    .from('puppy_reservations')
    .select('id', { count: 'exact', head: true })
    .eq('stage_id', id)
  if ((count || 0) > 0) return { ok: false, error: t('No puedes borrar un paso con fichas dentro.') }
  await c.admin.from('pipeline_stages').delete().eq('id', id)
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}

export async function reorderStage(id: string, dir: 'up' | 'down'): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c) return { ok: false, error: t('Sin permiso') }
  const stage = await loadStage(c.admin, c.kennelId, id)
  if (!stage) return { ok: false, error: t('Sin permiso') }
  const { data: stages } = await c.admin
    .from('pipeline_stages')
    .select('id, position')
    .eq('pipeline_id', stage.pipeline_id)
    .order('position', { ascending: true })
  const list = (stages || []) as { id: string; position: number }[]
  const idx = list.findIndex((s) => s.id === id)
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return { ok: true }
  const a = list[idx]
  const b = list[swapIdx]
  await c.admin.from('pipeline_stages').update({ position: b.position }).eq('id', a.id)
  await c.admin.from('pipeline_stages').update({ position: a.position }).eq('id', b.id)
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}

export async function setEntryStage(pipelineId: string, stageId: string): Promise<Res> {
  const t = getTranslator(await getLocale())
  const c = await ctx()
  if (!c || !(await ownsPipeline(c.admin, c.kennelId, pipelineId))) return { ok: false, error: t('Sin permiso') }
  await c.admin.from('pipeline_stages').update({ is_entry: false }).eq('pipeline_id', pipelineId)
  await c.admin.from('pipeline_stages').update({ is_entry: true }).eq('id', stageId)
  revalidatePath('/embudo/configuracion')
  revalidatePath('/embudo')
  return { ok: true }
}
