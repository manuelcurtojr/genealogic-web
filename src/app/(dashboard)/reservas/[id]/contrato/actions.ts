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
  deleteContract,
} from '@/lib/contracts/contracts'
import { CONTRACT_TEMPLATES, type ContractKind } from '@/lib/contracts/templates'
import { generateContractBody, generateContractBodyFromValues, buildContractVars } from '@/lib/contracts/render'
import { validateContractBody } from '@/lib/contracts/required-tokens'
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
 * Asigna (o desasigna) un perro concreto a la reserva. Actualiza
 * puppy_reservations.dog_id; al regenerar el contrato, buildContractVars
 * leerá los datos del perro automáticamente (nombre, raza, color, microchip,
 * etc.) y los bloques condicionales del template los mostrarán.
 *
 * Pasa null como dogId para desasignar (volver al modo "preferencias
 * orientativas").
 */
export async function assignDogToReservationAction(
  reservationId: string,
  dogId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { reservation } = await assertBreeder(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any

    // Si dogId no es null, validar que el perro pertenezca al MISMO kennel
    // (defensa además de la RLS de dogs).
    if (dogId) {
      const { data: dog } = await admin
        .from('dogs')
        .select('id, kennel_id')
        .eq('id', dogId)
        .maybeSingle()
      const t = getTranslator(await getLocale())
      if (!dog) return { ok: false, error: t('Perro no encontrado') }
      if (dog.kennel_id !== reservation.kennel?.id) {
        return { ok: false, error: t('Ese perro no pertenece a este criadero') }
      }
    }

    const { error } = await admin
      .from('puppy_reservations')
      .update({ dog_id: dogId })
      .eq('id', reservationId)
    if (error) throw new Error(error.message)

    // Regenerar body_html del contrato draft (si lo hay) para que refleje
    // el cambio de perro inmediatamente, sin esperar a que el criador edite
    // algún campo en el form.
    const { data: drafts } = await admin
      .from('reservation_contracts')
      .select('id, kind, source_template_id, template_values')
      .eq('reservation_id', reservationId)
      .eq('status', 'draft')
    for (const draft of (drafts || []) as Array<{
      id: string; kind: ContractKind;
      source_template_id: string | null;
      template_values: Record<string, string> | null;
    }>) {
      // Skip si el draft está en modo manual (no tocamos su body)
      if (draft.template_values && (draft.template_values as Record<string, unknown>).__manual__) continue

      let userTemplateBody: string | null = null
      if (draft.source_template_id) {
        const { data: tpl } = await admin
          .from('contract_templates')
          .select('body_md')
          .eq('id', draft.source_template_id)
          .maybeSingle()
        userTemplateBody = tpl?.body_md ?? null
      }

      // Recargamos la reserva completa con joins para que buildContractVars
      // tenga los datos del nuevo perro asignado.
      const { data: fullRes } = await admin
        .from('puppy_reservations')
        .select(
          `*,
           kennel:kennels(id, name, city, country, owner_id, legal_name, legal_id, legal_address, legal_representative, legal_representative_id, sign_city, jurisdiction),
           puppy:dogs!puppy_dog_id(id, name, sex, microchip, registration, birth_date, breed:breeds(name), color:colors(name)),
           dog:dogs!dog_id(id, name, sex, microchip, registration, birth_date, breed:breeds(name), color:colors(name))`,
        )
        .eq('id', reservationId)
        .single()
      if (!fullRes) continue

      const values = (draft.template_values as Record<string, string>) || {}
      const newBody = generateContractBodyFromValues(
        fullRes,
        draft.kind,
        values,
        userTemplateBody,
      )
      await admin
        .from('reservation_contracts')
        .update({ body_html: newBody })
        .eq('id', draft.id)
    }

    revalidatePath(`/reservas/${reservationId}/contrato`)
    revalidatePath(`/reservas/${reservationId}`)
    revalidatePath(`/mis-reservas/${reservationId}`)
    return { ok: true }
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

    // ─── Validar bloques dinámicos requeridos ───
    // El modo avanzado markdown permite borrar cualquier cosa. Sin esta
    // validación el criador podría quitar {{clientName}} y firmar un
    // contrato sin identificar al cliente. Antes de guardar, comprobamos
    // que TODOS los tokens requeridos para el kind sigan presentes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: contract } = await admin
      .from('reservation_contracts')
      .select('kind')
      .eq('id', contractId)
      .maybeSingle()
    if (contract?.kind) {
      const { ok, missing } = validateContractBody(body, contract.kind as ContractKind)
      if (!ok) {
        const t = getTranslator(await getLocale())
        const list = missing.map((m) => `{{${m.token}}} (${m.label})`).join(', ')
        return {
          ok: false,
          error: `${t('Faltan bloques dinámicos obligatorios')}: ${list}. ${t('Restáuralos para poder guardar.')}`,
        }
      }
    }

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
      .select('kind, preview_token')
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
              previewToken: contract?.preview_token ?? null,
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

/**
 * Resetea un borrador de contrato:
 *  - Limpia template_values (vuelve a {}, perdiendo lo rellenado en el form)
 *  - Quita el flag __manual__ (si el criador estaba en modo avanzado)
 *  - Regenera body_html desde buildContractVars (valores iniciales derivados
 *    del lead + perro asignado + datos legales del criador)
 *
 * Útil cuando el criador la lió editando y quiere empezar limpio sin tener
 * que eliminar y recrear desde plantilla.
 *
 * Solo funciona en status='draft' — para sent/signed usa cancelContractAction.
 */
export async function resetDraftContractAction(
  reservationId: string,
  contractId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = getTranslator(await getLocale())
  try {
    const { reservation } = await assertBreeder(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any

    const { data: contract } = await admin
      .from('reservation_contracts')
      .select('id, kind, status, source_template_id, title')
      .eq('id', contractId)
      .maybeSingle()
    if (!contract) return { ok: false, error: t('Contrato no encontrado') }
    if (contract.status !== 'draft') {
      return { ok: false, error: t('Solo se puede resetear un borrador. Para contratos enviados usa "Volver a borrador".') }
    }

    // Cargar plantilla origen (si la hay) para regenerar body desde cero
    let userTemplateBody: string | null = null
    if (contract.source_template_id) {
      const { data: tpl } = await admin
        .from('contract_templates')
        .select('body_md')
        .eq('id', contract.source_template_id)
        .maybeSingle()
      userTemplateBody = tpl?.body_md ?? null
    }

    // Regenerar body con valores iniciales (sin overrides del criador)
    const newBody = generateContractBody(
      reservation,
      contract.kind as ContractKind,
      userTemplateBody,
    )

    const { error } = await admin
      .from('reservation_contracts')
      .update({
        template_values: {},
        body_html: newBody,
      })
      .eq('id', contractId)
    if (error) throw new Error(error.message)

    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/**
 * Elimina un borrador de contrato. La reserva vuelve al estado "sin
 * contrato" — el criador puede crear uno nuevo desde plantilla.
 *
 * Solo funciona en status='draft' para evitar borrar contratos firmados
 * por accidente (esos hay que cancelar primero con cancelContractAction).
 */
export async function deleteDraftContractAction(
  reservationId: string,
  contractId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = getTranslator(await getLocale())
  try {
    await assertBreeder(reservationId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data: contract } = await admin
      .from('reservation_contracts')
      .select('status')
      .eq('id', contractId)
      .maybeSingle()
    if (!contract) return { ok: false, error: t('Contrato no encontrado') }
    if (contract.status !== 'draft') {
      return {
        ok: false,
        error: t('Solo se puede eliminar un borrador. Para contratos enviados o firmados, primero cancélalos.'),
      }
    }

    await deleteContract(contractId)
    revalidatePath(`/reservas/${reservationId}/contrato`)
    revalidatePath(`/reservas/${reservationId}`)
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
