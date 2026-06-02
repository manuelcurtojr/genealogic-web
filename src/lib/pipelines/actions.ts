/**
 * Server actions del EMBUDO (funnel).
 *  - moveEntryToStage: mueve una ficha de paso (con clon en handoff, encuesta
 *    de motivo en pasos perdidos, y flag de celebración para pasos ganados).
 *  - markEntrySeen: marca una solicitud como vista (quita el distintivo "nueva").
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { legacyStatusForStage, milestoneColumnForStatus } from '@/lib/pipelines/queries'
import type { MoveResult } from '@/lib/pipelines/types'

/** Campos del lead que se copian al clonar a otro pipeline (handoff). */
const CLONE_FIELDS = [
  'applicant_name',
  'applicant_email',
  'applicant_phone',
  'applicant_message',
  'applicant_purpose',
  'applicant_country',
  'applicant_address',
  'applicant_postal_code',
  'applicant_city',
  'applicant_extra_data',
  'preference_sex',
  'litter_id',
  'dog_id',
  'puppy_dog_id',
  'client_user_id',
  'owner_id',
  'source',
] as const

export async function moveEntryToStage(
  entryId: string,
  targetStageId: string,
  opts?: { lossReason?: string; lossDetail?: string },
): Promise<MoveResult> {
  const t = getTranslator(await getLocale())
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: t('Sesión no válida') }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any

    // Cargar ficha + comprobar propiedad del kennel
    const { data: entry } = await admin
      .from('puppy_reservations')
      .select(`id, kennel_id, ${CLONE_FIELDS.join(', ')}, kennel:kennels(owner_id)`)
      .eq('id', entryId)
      .maybeSingle()
    if (!entry) return { ok: false, error: t('Reserva no encontrada') }
    if (entry.kennel?.owner_id !== user.id) return { ok: false, error: t('Sin permiso') }

    // Cargar paso destino
    const { data: stage } = await admin
      .from('pipeline_stages')
      .select('id, pipeline_id, name, type, celebrate, loss_reasons, handoff_stage_id, pipeline:pipelines(kennel_id, slug)')
      .eq('id', targetStageId)
      .maybeSingle()
    if (!stage) return { ok: false, error: t('Paso no encontrado') }
    if (stage.pipeline?.kennel_id !== entry.kennel_id) {
      return { ok: false, error: t('Sin permiso') }
    }

    const now = new Date().toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {
      stage_id: stage.id,
      pipeline_id: stage.pipeline_id,
      seen_by_breeder_at: now,
    }

    // Paso perdido → exige motivo si el paso tiene motivos configurados
    if (stage.type === 'lost') {
      const reasons: string[] = Array.isArray(stage.loss_reasons) ? stage.loss_reasons : []
      if (reasons.length > 0 && !opts?.lossReason) {
        return { ok: false, error: t('Indica el motivo'), needLossReason: true, reasons }
      }
      update.lost_reason = opts?.lossReason || null
      update.lost_reason_detail = opts?.lossDetail || null
      update.lost_at = now
    }

    // Espejo de status legacy (pipelines por defecto) + sello de hito
    const legacy = legacyStatusForStage(stage.pipeline?.slug ?? null, stage.name)
    if (legacy) {
      update.status = legacy
      const col = milestoneColumnForStatus(legacy)
      if (col) update[col] = now
    }

    const { error: upErr } = await admin.from('puppy_reservations').update(update).eq('id', entryId)
    if (upErr) return { ok: false, error: upErr.message }

    // Handoff: al entrar en un paso con handoff_stage_id, CLONAR a ese pipeline
    // (el original se queda congelado para no perder la estadística).
    let cloned = false
    if (stage.handoff_stage_id) {
      const { data: htarget } = await admin
        .from('pipeline_stages')
        .select('id, pipeline_id')
        .eq('id', stage.handoff_stage_id)
        .maybeSingle()
      if (htarget) {
        // Evitar doble clon si ya existe uno de este origen en ese pipeline
        const { data: existing } = await admin
          .from('puppy_reservations')
          .select('id')
          .eq('origin_entry_id', entryId)
          .eq('pipeline_id', htarget.pipeline_id)
          .maybeSingle()
        if (!existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clonePayload: Record<string, any> = {
            kennel_id: entry.kennel_id,
            status: 'deposit_paid', // espejo legacy: reserva en firme
            pipeline_id: htarget.pipeline_id,
            stage_id: htarget.id,
            origin_entry_id: entryId,
            seen_by_breeder_at: null, // aparece como "nueva" en Reservas
          }
          for (const f of CLONE_FIELDS) clonePayload[f] = entry[f] ?? null
          const { error: cErr } = await admin.from('puppy_reservations').insert(clonePayload)
          if (!cErr) cloned = true
        }
      }
    }

    revalidatePath('/embudo')
    revalidatePath('/reservas')
    return { ok: true, celebrate: !!stage.celebrate, cloned }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/** Guarda/edita la nota interna del criador sobre un lead. */
export async function setInternalNote(entryId: string, note: string): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: entry } = await admin
      .from('puppy_reservations')
      .select('id, kennel:kennels(owner_id)')
      .eq('id', entryId)
      .maybeSingle()
    if (!entry || entry.kennel?.owner_id !== user.id) return { ok: false }
    await admin
      .from('puppy_reservations')
      .update({ internal_note: note.trim() || null })
      .eq('id', entryId)
    revalidatePath('/embudo')
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

/** Elimina un lead/ficha (acción del criador desde su panel, p.ej. duplicados o spam). */
export async function deleteEntry(entryId: string): Promise<{ ok: boolean; error?: string }> {
  const t = getTranslator(await getLocale())
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: t('Sesión no válida') }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: entry } = await admin
      .from('puppy_reservations')
      .select('id, kennel:kennels(owner_id)')
      .eq('id', entryId)
      .maybeSingle()
    if (!entry || entry.kennel?.owner_id !== user.id) return { ok: false, error: t('Sin permiso') }
    const { error } = await admin.from('puppy_reservations').delete().eq('id', entryId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/embudo')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/** Marca una solicitud como vista por el criador (quita el distintivo "nueva"). */
export async function markEntrySeen(entryId: string): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: entry } = await admin
      .from('puppy_reservations')
      .select('id, seen_by_breeder_at, kennel:kennels(owner_id)')
      .eq('id', entryId)
      .maybeSingle()
    if (!entry || entry.kennel?.owner_id !== user.id) return { ok: false }
    if (entry.seen_by_breeder_at) return { ok: true }

    await admin
      .from('puppy_reservations')
      .update({ seen_by_breeder_at: new Date().toISOString() })
      .eq('id', entryId)
    revalidatePath('/embudo')
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
