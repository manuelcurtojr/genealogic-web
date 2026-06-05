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
  /** Para qué tipo de contrato es la default de este kennel: null si no es
   *  default de ninguno, 'reservation' o 'delivery' si lo es. Permite una
   *  default por kind (en lugar de una global). */
  default_for_kind: 'reservation' | 'delivery' | null
  created_at: string
  updated_at: string
}

// ─── Listado ────────────────────────────────────────────────────────────────

/**
 * Normaliza una fila cruda de contract_templates a `ContractTemplate`.
 *
 * Resiliente al rollout de la migración 20260720: si `default_for_kind`
 * todavía no existe en BBDD (la migración no se ha aplicado), derivamos
 * el valor desde `is_default` legacy → asumimos kind='reservation' por
 * consistencia con el backfill de la migración. Así la página de
 * /contratos funciona en producción ANTES de aplicar la migración.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTemplate(row: any): ContractTemplate {
  const defaultForKind =
    row.default_for_kind !== undefined
      ? (row.default_for_kind as 'reservation' | 'delivery' | null)
      : (row.is_default ? ('reservation' as const) : null)
  return {
    id: row.id,
    kennel_id: row.kennel_id,
    name: row.name,
    body_md: row.body_md,
    is_default: !!row.is_default,
    default_for_kind: defaultForKind,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

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

  // SELECT *: tolerante a columnas que pueden no existir todavía (migración
  // 20260720 añade default_for_kind). normalizeTemplate hace fallback.
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('kennel_id', kennel.id)
    .order('is_default', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(normalizeTemplate)
}

export async function getContractTemplate(id: string): Promise<ContractTemplate | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return normalizeTemplate(data)
}

// ─── Mutaciones ─────────────────────────────────────────────────────────────

export async function createContractTemplate(input: {
  kennelId: string
  name: string
  bodyMd: string
  /** @deprecated Usa `defaultForKind` en su lugar. Si true se interpreta como
   *  defaultForKind='reservation' (compat con callers viejos). */
  isDefault?: boolean
  /** Marca esta plantilla como default para el kind dado.
   *  Si null/undefined → no es default de nada. */
  defaultForKind?: 'reservation' | 'delivery' | null
}): Promise<{ id: string }> {
  const { supabase, kennel } = await requireOwnerOfKennel(input.kennelId)
  const name = input.name.trim().slice(0, 120) || 'Sin nombre'
  const body = input.bodyMd.slice(0, 60000)

  // Resolver el kind default: si vino defaultForKind explícito lo usamos,
  // si no usamos isDefault (legacy → asume 'reservation').
  const kind: 'reservation' | 'delivery' | null =
    input.defaultForKind !== undefined
      ? input.defaultForKind
      : (input.isDefault ? 'reservation' : null)

  if (kind) {
    // Desmarcar la default actual de ese kind para evitar colisión con el
    // índice único parcial. Si la columna no existe (migración no aplicada),
    // ignoramos silenciosamente — el INSERT de abajo también se hará en
    // modo legacy.
    const { error: unsetErr } = await supabase
      .from('contract_templates')
      .update({ default_for_kind: null, is_default: false })
      .eq('kennel_id', kennel.id)
      .eq('default_for_kind', kind)
    if (unsetErr && !/default_for_kind/i.test(unsetErr.message)) {
      throw new Error(unsetErr.message)
    }
  }

  // Intentamos INSERT con default_for_kind; si la columna no existe,
  // reintentamos sin ella (modo legacy). Sale más limpio que comprobar el
  // schema por adelantado.
  let inserted = await supabase
    .from('contract_templates')
    .insert({
      kennel_id: kennel.id,
      name,
      body_md: body,
      is_default: kind !== null,
      default_for_kind: kind,
    })
    .select('id')
    .single()
  if (inserted.error && /default_for_kind/i.test(inserted.error.message)) {
    inserted = await supabase
      .from('contract_templates')
      .insert({
        kennel_id: kennel.id,
        name,
        body_md: body,
        is_default: kind !== null,
      })
      .select('id')
      .single()
  }
  const { data, error } = inserted
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

/**
 * Marca una plantilla como default PARA UN KIND concreto.
 *
 * Reglas:
 *  - Solo puede haber 1 default por (kennel_id, kind) — el índice único
 *    parcial creado en 20260720_contracts_redesign.sql lo asegura a nivel
 *    BBDD. Antes de asignar, desmarcamos la default actual de ese kind.
 *  - `is_default` (boolean global, legacy) se mantiene sincronizada para
 *    compat — true si la plantilla es default de cualquier kind, false si
 *    no. Se eliminará en migración futura.
 *
 * Si `kind` es null → desmarca la default (la plantilla deja de ser default
 * para cualquier kind).
 */
export async function setDefaultContractTemplate(
  id: string,
  kind: 'reservation' | 'delivery' | null,
): Promise<{ ok: true }> {
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

  if (kind) {
    // Desmarca la default actual de ese kind (si la hay) para evitar
    // colisión con el índice único parcial.
    const { error: unsetErr } = await supabase
      .from('contract_templates')
      .update({ default_for_kind: null, is_default: false })
      .eq('kennel_id', tpl.kennel_id)
      .eq('default_for_kind', kind)
    if (unsetErr && /default_for_kind/i.test(unsetErr.message)) {
      // Columna no existe → migración 20260720 no aplicada todavía. Caemos
      // a comportamiento legacy: solo un is_default global por kennel.
      return await setDefaultLegacy(supabase, tpl.kennel_id, id, kind !== null)
    }
    if (unsetErr) throw new Error(unsetErr.message)
  }

  const { error } = await supabase
    .from('contract_templates')
    .update({ default_for_kind: kind, is_default: kind !== null })
    .eq('id', id)
  if (error && /default_for_kind/i.test(error.message)) {
    return await setDefaultLegacy(supabase, tpl.kennel_id, id, kind !== null)
  }
  if (error) throw new Error(error.message)

  revalidatePath('/contratos')
  return { ok: true }
}

/**
 * Fallback al esquema legacy (sin default_for_kind): toggle del boolean
 * is_default global, máximo una default por kennel.
 */
async function setDefaultLegacy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  kennelId: string,
  templateId: string,
  makeDefault: boolean,
): Promise<{ ok: true }> {
  if (makeDefault) {
    await supabase
      .from('contract_templates')
      .update({ is_default: false })
      .eq('kennel_id', kennelId)
      .eq('is_default', true)
  }
  const { error } = await supabase
    .from('contract_templates')
    .update({ is_default: makeDefault })
    .eq('id', templateId)
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
