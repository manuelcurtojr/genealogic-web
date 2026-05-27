/**
 * Server actions para las plantillas de contrato del criador.
 *
 * Las plantillas viven en `contract_templates` (kennel_id, name, body_md,
 * is_default). El criador las gestiona desde /contratos y las reutiliza
 * al crear contratos por reserva.
 *
 * Gate: solo el owner del kennel puede CRUD sus plantillas. La RLS lo
 * fuerza a nivel de DB pero validamos también aquí para devolver errores
 * limpios al UI.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireOwnerOfKennel(kennelId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, owner_id')
    .eq('id', kennelId)
    .single()
  if (!kennel) throw new Error('kennel_not_found')
  if (kennel.owner_id !== user.id) throw new Error('forbidden')

  return { supabase, user, kennel }
}

export interface ContractTemplate {
  id: string
  kennel_id: string
  name: string
  body_md: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// ─── Listado ────────────────────────────────────────────────────────────────

export async function listContractTemplatesForUser(): Promise<ContractTemplate[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Resuelve el kennel del owner (1 user = 1 kennel)
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!kennel) return []

  const { data, error } = await supabase
    .from('contract_templates')
    .select('id, kennel_id, name, body_md, is_default, created_at, updated_at')
    .eq('kennel_id', kennel.id)
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as ContractTemplate[]
}

export async function getContractTemplate(id: string): Promise<ContractTemplate | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contract_templates')
    .select('id, kennel_id, name, body_md, is_default, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as ContractTemplate | null) || null
}

// ─── Mutaciones ─────────────────────────────────────────────────────────────

export async function createContractTemplate(input: {
  kennelId: string
  name: string
  bodyMd: string
  isDefault?: boolean
}): Promise<{ id: string }> {
  const { supabase, kennel } = await requireOwnerOfKennel(input.kennelId)
  const name = input.name.trim().slice(0, 120) || 'Sin nombre'
  const body = input.bodyMd.slice(0, 60000)

  // Si pide is_default, antes desmarcamos los otros del kennel (el índice
  // único parcial protege a nivel DB pero damos UX limpia desactivando).
  if (input.isDefault) {
    await supabase
      .from('contract_templates')
      .update({ is_default: false })
      .eq('kennel_id', kennel.id)
      .eq('is_default', true)
  }

  const { data, error } = await supabase
    .from('contract_templates')
    .insert({
      kennel_id: kennel.id,
      name,
      body_md: body,
      is_default: !!input.isDefault,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  revalidatePath('/contratos')
  return { id: data.id }
}

export async function updateContractTemplate(input: {
  id: string
  name?: string
  bodyMd?: string
}): Promise<{ ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')

  // RLS valida ownership en el UPDATE — para errores limpios en UI cargamos
  // primero y verificamos.
  const { data: tpl } = await supabase
    .from('contract_templates')
    .select('id, kennel_id')
    .eq('id', input.id)
    .single()
  if (!tpl) throw new Error('not_found')
  await requireOwnerOfKennel(tpl.kennel_id)

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof input.name === 'string') patch.name = input.name.trim().slice(0, 120) || 'Sin nombre'
  if (typeof input.bodyMd === 'string') patch.body_md = input.bodyMd.slice(0, 60000)

  const { error } = await supabase
    .from('contract_templates')
    .update(patch)
    .eq('id', input.id)
  if (error) throw new Error(error.message)

  revalidatePath('/contratos')
  revalidatePath(`/contratos/${input.id}`)
  return { ok: true }
}

export async function deleteContractTemplate(id: string): Promise<{ ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')

  const { data: tpl } = await supabase
    .from('contract_templates')
    .select('id, kennel_id')
    .eq('id', id)
    .single()
  if (!tpl) throw new Error('not_found')
  await requireOwnerOfKennel(tpl.kennel_id)

  const { error } = await supabase.from('contract_templates').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/contratos')
  return { ok: true }
}

export async function setDefaultContractTemplate(id: string): Promise<{ ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')

  const { data: tpl } = await supabase
    .from('contract_templates')
    .select('id, kennel_id')
    .eq('id', id)
    .single()
  if (!tpl) throw new Error('not_found')
  await requireOwnerOfKennel(tpl.kennel_id)

  // Desmarca todos los otros del kennel, marca este. Dos updates en serie —
  // si el segundo falla queda el kennel sin default (estado válido).
  await supabase
    .from('contract_templates')
    .update({ is_default: false })
    .eq('kennel_id', tpl.kennel_id)
    .eq('is_default', true)
  const { error } = await supabase
    .from('contract_templates')
    .update({ is_default: true })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/contratos')
  return { ok: true }
}

/** Guarda un texto editado en el editor de UNA reserva como plantilla
 *  reusable. Atajo para el botón "Guardar como plantilla" desde
 *  /reservas/[id]/contrato. */
export async function saveAsNewTemplateFromContract(input: {
  kennelId: string
  name: string
  bodyMd: string
}): Promise<{ id: string }> {
  return createContractTemplate({
    kennelId: input.kennelId,
    name: input.name,
    bodyMd: input.bodyMd,
    isDefault: false,
  })
}
