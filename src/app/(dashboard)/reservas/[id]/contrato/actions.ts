/**
 * Server actions del criador para los contratos de una reserva (reserva + entrega).
 *  - createOrInitContract(kind): crea el contrato de ese tipo desde plantilla base
 *  - createFromUserTemplate(kind): crea desde plantilla propia del criador
 *  - saveContractDraft / sendContract / signContractAsBreeder / cancelContract
 * Al enviar (sent) se manda email al cliente para registrarse/entrar y firmar.
 */
'use server'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  createContract,
  updateContractBody,
  setContractStatus,
  getContractByReservation,
} from '@/lib/contracts/contracts'
import { CONTRACT_TEMPLATES, type ContractKind } from '@/lib/contracts/templates'
import { generateContractBody, generateContractBodyFromValues, buildContractVars } from '@/lib/contracts/render'
import { getContractTemplate } from '@/lib/contracts/templates-actions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

async function getClientIp(): Promise<string | null> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertBreeder(reservationId: string): Promise<{ userId: string; reservation: any }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select(
      `*,
       kennel:kennels(id, name, city, country, owner_id, legal_name, legal_id, legal_address, legal_representative, legal_representative_id, sign_city, jurisdiction),
       puppy:dogs!puppy_dog_id(id, name, sex, microchip, registration, birth_date, breed:breeds(name), color:colors(name)),
       dog:dogs!dog_id(id, name, sex, microchip, registration, birth_date, breed:breeds(name), color:colors(name))`,
    )
    .eq('id', reservationId)
    .maybeSingle()
  if (!reservation) throw new Error('reservation_not_found')
  if (reservation.kennel?.owner_id !== user.id) throw new Error('forbidden')
  return { userId: user.id, reservation }
}

export async function createOrInitContractAction(
  reservationId: string,
  kind: ContractKind,
): Promise<{ ok: true; contractId: string } | { ok: false; error: string }> {
  try {
    const { userId, reservation } = await assertBreeder(reservationId)
    const existing = await getContractByReservation(reservationId, kind)
    if (existing) return { ok: true, contractId: existing.id }

    const tpl = CONTRACT_TEMPLATES.find((ct) => ct.kind === kind) ?? CONTRACT_TEMPLATES[0]
    const created = await createContract({
      reservationId,
      kennelId: reservation.kennel.id,
      createdBy: userId,
      kind,
      sourceTemplateId: null,
      title: tpl.label,
      bodyMarkdown: generateContractBody(reservation, kind),
    })

    // Inicializa template_values = {} para que la UI sepa que es un contrato
    // "nuevo flow" (fill-form) y no uno legacy (markdown). Contratos pre-
    // refactor tienen template_values=NULL y se mantienen en el editor
    // markdown clásico hasta que el criador los recree.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    await admin
      .from('reservation_contracts')
      .update({ template_values: {} })
      .eq('id', created.id)

    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true, contractId: created.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function createFromUserTemplateAction(
  reservationId: string,
  userTemplateId: string,
  kind: ContractKind,
): Promise<{ ok: true; contractId: string } | { ok: false; error: string }> {
  try {
    const { userId, reservation } = await assertBreeder(reservationId)
    const existing = await getContractByReservation(reservationId, kind)
    if (existing) return { ok: true, contractId: existing.id }

    const tpl = await getContractTemplate(userTemplateId)
    const t = getTranslator(await getLocale())
    if (!tpl) return { ok: false, error: t('Plantilla no encontrada') }
    if (tpl.kennel_id !== reservation.kennel.id) {
      return { ok: false, error: t('Plantilla no pertenece a este criadero') }
    }
    const created = await createContract({
      reservationId,
      kennelId: reservation.kennel.id,
      createdBy: userId,
      kind,
      sourceTemplateId: tpl.id,
      title: tpl.name,
      bodyMarkdown: generateContractBody(reservation, kind, tpl.body_md),
    })
    // Inicializa template_values = {} (mismo motivo que en createOrInit).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    await admin
      .from('reservation_contracts')
      .update({ template_values: {} })
      .eq('id', created.id)

    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true, contractId: created.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/**
 * Marca un contrato como "modo avanzado" (markdown editor). A partir de
 * aquí el fill-form queda bloqueado y se muestra el editor markdown
 * clásico para ajustes puntuales. Para volver al fill-form hay que
 * "cancelar contrato" (vuelve a draft limpio).
 */
export async function setAdvancedModeAction(
  reservationId: string,
  contractId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertBreeder(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: existing, error: readErr } = await admin
      .from('reservation_contracts')
      .select('template_values')
      .eq('id', contractId)
      .maybeSingle()
    // Si la columna no existe (migración no aplicada), no hay forma de
    // persistir el flag — devolvemos error claro para que la UI avise.
    if (readErr && /template_values/i.test(readErr.message)) {
      return {
        ok: false,
        error: 'El modo avanzado requiere aplicar la migración de BBDD pendiente. Consulta con soporte.',
      }
    }
    const current = (existing?.template_values as Record<string, unknown> | null) || {}
    const next = { ...current, __manual__: true }
    const { error } = await admin
      .from('reservation_contracts')
      .update({ template_values: next })
      .eq('id', contractId)
    if (error) throw new Error(error.message)
    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function saveContractDraftAction(
  reservationId: string,
  contractId: string,
  body: string,
  title?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertBreeder(reservationId)
    await updateContractBody({ contractId, bodyMarkdown: body, title })
    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/**
 * Guarda los valores del FILL-FORM y regenera el body_html en consecuencia.
 *
 * Es la nueva alternativa al `saveContractDraftAction`: en lugar de guardar
 * markdown editado a mano, guardamos token→valor y dejamos que el server
 * reinterpole. Esto permite que la próxima vez que el criador abra el
 * contrato, vea el FORMULARIO relleno (en `template_values`) en lugar de
 * solo el texto resuelto.
 *
 * Si el contrato fue creado desde plantilla custom, usa esa plantilla.
 * Si no (sourceTemplateId=null), usa la plantilla base hardcoded del kind.
 *
 * No bloquea el envío: incluso si faltan campos required, se guarda como
 * borrador. La validación de required se hace al "Enviar al cliente".
 */
export async function saveContractValuesAction(
  reservationId: string,
  contractId: string,
  values: Record<string, string | null>,
): Promise<{ ok: true; bodyHtml: string } | { ok: false; error: string }> {
  try {
    const { reservation } = await assertBreeder(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any

    // Cargar el contrato para saber su kind + qué plantilla usa
    const { data: contract } = await admin
      .from('reservation_contracts')
      .select('id, kind, source_template_id, status')
      .eq('id', contractId)
      .maybeSingle()
    if (!contract) {
      const t = getTranslator(await getLocale())
      return { ok: false, error: t('Contrato no encontrado') }
    }
    if (contract.status !== 'draft') {
      const t = getTranslator(await getLocale())
      return { ok: false, error: t('Solo se pueden editar los borradores') }
    }

    // Plantilla custom (si la hay)
    let userTemplateBody: string | null = null
    if (contract.source_template_id) {
      const { data: tpl } = await admin
        .from('contract_templates')
        .select('body_md')
        .eq('id', contract.source_template_id)
        .maybeSingle()
      userTemplateBody = tpl?.body_md ?? null
    }

    // Regenerar el body_html desde plantilla + buildContractVars + values
    const bodyHtml = generateContractBodyFromValues(
      reservation,
      contract.kind as ContractKind,
      values,
      userTemplateBody,
    )

    // Persistir AMBOS: template_values (fuente de verdad para el form) y
    // body_html (representación renderizada, lo que se enseña/firma).
    //
    // Resiliente: si la columna template_values aún no existe en BBDD
    // (migración 20260720 no aplicada), reintentamos solo con body_html.
    // El criador puede usar el fill-form, pero los valores no se persisten
    // hasta que aplique la migración — al reabrir el contrato verá el form
    // reinicializado desde buildContractVars(reservation).
    let { error } = await admin
      .from('reservation_contracts')
      .update({ template_values: values, body_html: bodyHtml })
      .eq('id', contractId)
    if (error && /template_values/i.test(error.message)) {
      const retry = await admin
        .from('reservation_contracts')
        .update({ body_html: bodyHtml })
        .eq('id', contractId)
      error = retry.error
    }
    if (error) throw new Error(error.message)

    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true, bodyHtml }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/**
 * Devuelve las variables iniciales del formulario para un contrato draft
 * recién creado. Combina `template_values` guardados (si los hay) con los
 * datos extraídos de la reserva/puppy/kennel. Los guardados ganan.
 *
 * Usado por la page server-side al renderizar el FillForm — así el form
 * se monta ya con los datos correctos sin un round-trip extra.
 */
export async function getInitialFormValues(
  reservationId: string,
  contractId: string,
): Promise<Record<string, string>> {
  const { reservation } = await assertBreeder(reservationId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: contract } = await admin
    .from('reservation_contracts')
    .select('kind, template_values')
    .eq('id', contractId)
    .maybeSingle()
  if (!contract) return {}

  const baseVars = buildContractVars(reservation, contract.kind as ContractKind)
  const merged: Record<string, string> = {}
  for (const [k, v] of Object.entries(baseVars)) {
    if (v != null && String(v).trim() !== '') merged[k] = String(v)
  }
  const saved = (contract.template_values as Record<string, string> | null) || {}
  for (const [k, v] of Object.entries(saved)) {
    if (v != null && String(v).trim() !== '') merged[k] = String(v)
  }
  return merged
}

export async function sendContractAction(
  reservationId: string,
  contractId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { reservation } = await assertBreeder(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: contract } = await admin
      .from('reservation_contracts')
      .select('kind')
      .eq('id', contractId)
      .maybeSingle()
    await setContractStatus(contractId, 'sent', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sent_at: new Date().toISOString() as any,
    })

    // Email al cliente: regístrate/entra para ver y firmar el contrato.
    if (reservation.applicant_email) {
      try {
        const { sendTransactionalEmail } = await import('@/lib/email/send')
        await sendTransactionalEmail(
          reservation.applicant_email,
          {
            template: 'contract_sent',
            props: {
              clientName: reservation.applicant_name || null,
              kennelName: reservation.kennel?.name || '',
              contractKind: (contract?.kind === 'delivery' ? 'delivery' : 'reservation') as
                | 'reservation'
                | 'delivery',
              reservationId,
              hasAccount: !!reservation.client_user_id,
            },
          },
          { userId: reservation.client_user_id || undefined },
        )
      } catch (err) {
        console.error('[email] contract_sent failed', err)
      }
    }

    revalidatePath(`/reservas/${reservationId}/contrato`)
    revalidatePath(`/mis-reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function signContractAsBreederAction(
  reservationId: string,
  contractId: string,
  signatureName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const t = getTranslator(await getLocale())
    const name = signatureName.trim()
    if (!name) return { ok: false, error: t('Escribe tu nombre completo para firmar') }
    const ip = await getClientIp()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    await assertBreeder(reservationId)
    const { data: row } = await admin
      .from('reservation_contracts')
      .select('signed_at_client, status')
      .eq('id', contractId)
      .maybeSingle()
    if (!row) return { ok: false, error: t('Contrato no encontrado') }
    const nextStatus = row.signed_at_client ? 'signed_full' : 'signed_partial'
    await setContractStatus(contractId, nextStatus, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signed_at_breeder: new Date().toISOString() as any,
      signature_breeder_name: name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signature_breeder_ip: (ip || null) as any,
    })
    revalidatePath(`/reservas/${reservationId}/contrato`)
    revalidatePath(`/mis-reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function cancelContractAction(
  reservationId: string,
  contractId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertBreeder(reservationId)
    await setContractStatus(contractId, 'draft', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sent_at: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signed_at_breeder: null as any,
      signature_breeder_name: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signature_breeder_ip: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signed_at_client: null as any,
      signature_client_name: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signature_client_ip: null as any,
    })
    revalidatePath(`/reservas/${reservationId}/contrato`)
    revalidatePath(`/mis-reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}
