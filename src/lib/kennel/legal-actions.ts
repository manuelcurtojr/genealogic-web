/**
 * Server actions para editar los documentos legales de las webs de criadero.
 *
 * Dos ámbitos:
 *  - GLOBAL (kennel_id NULL): plantillas por defecto que valen para todas las
 *    webs de criadero. Solo super-admin (requireAdmin).
 *  - OVERRIDE (kennel_id = X): versión propia de un criadero. Solo el owner de
 *    ese kennel (requireKennelOwner).
 *
 * Aunque la tabla tiene RLS que ya restringe esto, verificamos también aquí
 * (defensa en profundidad + mensajes de error claros + audit log de los
 * cambios globales, que son críticos).
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAdminAction } from '@/lib/admin/audit-log'
import type { LegalDocType } from '@/lib/kennel/legal'
import { LEGAL_TYPE_TO_SLUG } from '@/lib/kennel/legal'

const VALID_TYPES: LegalDocType[] = ['aviso_legal', 'privacidad', 'cookies', 'terminos']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('forbidden')
  return { supabase, user }
}

/** Edita una plantilla GLOBAL por defecto (super-admin). */
export async function adminUpsertGlobalLegalDoc(input: {
  docType: LegalDocType
  title: string
  bodyMd: string
}): Promise<{ ok: true }> {
  if (!VALID_TYPES.includes(input.docType)) throw new Error('tipo inválido')
  if (!input.title.trim() || !input.bodyMd.trim()) throw new Error('título y contenido obligatorios')
  const { supabase, user } = await requireAdmin()

  const { data: prev } = await supabase
    .from('kennel_legal_docs')
    .select('id')
    .is('kennel_id', null)
    .eq('doc_type', input.docType)
    .maybeSingle()

  if (prev?.id) {
    const { error } = await supabase
      .from('kennel_legal_docs')
      .update({
        title: input.title.trim(),
        body_md: input.bodyMd,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', prev.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('kennel_legal_docs')
      .insert({
        kennel_id: null,
        doc_type: input.docType,
        title: input.title.trim(),
        body_md: input.bodyMd,
        updated_by: user.id,
      })
    if (error) throw new Error(error.message)
  }

  void logAdminAction({
    adminId: user.id,
    action: 'settings_change',
    targetTable: 'kennel_legal_docs',
    targetId: `global:${input.docType}`,
    payload: { scope: 'global', doc_type: input.docType, title: input.title.trim() },
  })

  // Revalida la plantilla global en todas las webs de criadero que la usen.
  revalidatePath('/admin/legal')
  return { ok: true }
}

/** Edita / crea el OVERRIDE de un criadero (solo su owner). */
export async function upsertKennelLegalOverride(input: {
  kennelId: string
  docType: LegalDocType
  title: string
  bodyMd: string
}): Promise<{ ok: true }> {
  if (!VALID_TYPES.includes(input.docType)) throw new Error('tipo inválido')
  if (!input.title.trim() || !input.bodyMd.trim()) throw new Error('título y contenido obligatorios')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  // El kennel debe ser del usuario.
  const { data: kennel } = await supabase
    .from('kennels').select('id, slug').eq('id', input.kennelId).single()
  if (!kennel) throw new Error('kennel no encontrado')
  const { data: owned } = await supabase
    .from('kennels').select('id').eq('id', input.kennelId).eq('owner_id', user.id).maybeSingle()
  if (!owned) throw new Error('forbidden')

  const { data: prev } = await supabase
    .from('kennel_legal_docs')
    .select('id')
    .eq('kennel_id', input.kennelId)
    .eq('doc_type', input.docType)
    .maybeSingle()

  if (prev?.id) {
    const { error } = await supabase
      .from('kennel_legal_docs')
      .update({
        title: input.title.trim(),
        body_md: input.bodyMd,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', prev.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('kennel_legal_docs')
      .insert({
        kennel_id: input.kennelId,
        doc_type: input.docType,
        title: input.title.trim(),
        body_md: input.bodyMd,
        updated_by: user.id,
      })
    if (error) throw new Error(error.message)
  }

  if (kennel.slug) {
    revalidatePath(`/kennels/${kennel.slug}/legal/${LEGAL_TYPE_TO_SLUG[input.docType]}`)
  }
  return { ok: true }
}

/** Elimina el OVERRIDE de un criadero → vuelve a usar la plantilla global. */
export async function deleteKennelLegalOverride(input: {
  kennelId: string
  docType: LegalDocType
}): Promise<{ ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const { data: owned } = await supabase
    .from('kennels').select('id, slug').eq('id', input.kennelId).eq('owner_id', user.id).maybeSingle()
  if (!owned) throw new Error('forbidden')

  const { error } = await supabase
    .from('kennel_legal_docs')
    .delete()
    .eq('kennel_id', input.kennelId)
    .eq('doc_type', input.docType)
  if (error) throw new Error(error.message)

  if (owned.slug) {
    revalidatePath(`/kennels/${owned.slug}/legal/${LEGAL_TYPE_TO_SLUG[input.docType]}`)
  }
  return { ok: true }
}
