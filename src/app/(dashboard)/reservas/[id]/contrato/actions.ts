/**
 * Server actions del criador para el contrato de una reserva.
 *  - createOrInitContract: si no existe, lo crea con plantilla pre-popular
 *  - saveContractDraft: guarda cambios en draft
 *  - sendContract: marca como 'sent' → visible al cliente
 *  - signContractAsBreeder: criador firma (debe estar en sent o signed_partial)
 *  - cancelContract: vuelve a draft y reset firmas
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
import {
  CONTRACT_TEMPLATES,
  type ContractTemplateId,
  type ContractTemplateVars,
} from '@/lib/contracts/templates'
import { getContractTemplate } from '@/lib/contracts/templates-actions'

async function getClientIp(): Promise<string | null> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertBreeder(reservationId: string): Promise<{ userId: string; reservation: any }> {
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
      `*, kennel:kennels(id, name, city, country, owner_id),
       dog:dogs!dog_id(id, name, slug, microchip, registration, birth_date, breed:breeds(name))`,
    )
    .eq('id', reservationId)
    .maybeSingle()
  if (!reservation) throw new Error('reservation_not_found')
  if (reservation.kennel?.owner_id !== user.id) throw new Error('forbidden')
  return { userId: user.id, reservation }
}

function buildVars(reservation: Record<string, unknown>): ContractTemplateVars {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = reservation as any
  const fmtPrice = (cents: number | null | undefined, currency = 'EUR') =>
    cents != null ? `${(cents / 100).toFixed(2)} ${currency}` : ''
  return {
    kennelName: r.kennel?.name || '',
    kennelAddress: [r.kennel?.city, r.kennel?.country].filter(Boolean).join(', ') || undefined,
    clientName: r.applicant_name || '',
    clientEmail: r.applicant_email || '',
    clientId: r.applicant_id_doc_number || undefined,
    clientAddress: [r.applicant_address, r.applicant_postal_code, r.applicant_city]
      .filter(Boolean)
      .join(', ') || undefined,
    dogName: r.dog?.name,
    breed: r.dog?.breed?.name,
    birthDate: r.dog?.birth_date
      ? new Date(r.dog.birth_date).toLocaleDateString('es-ES')
      : undefined,
    microchip: r.dog?.microchip,
    registration: r.dog?.registration,
    totalPrice: fmtPrice(r.total_price_cents, r.currency || 'EUR') || undefined,
    depositAmount: fmtPrice(r.deposit_amount_cents, r.currency || 'EUR') || undefined,
    todayDate: new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }
}

export async function createOrInitContractAction(
  reservationId: string,
  templateId: ContractTemplateId,
): Promise<{ ok: true; contractId: string } | { ok: false; error: string }> {
  try {
    const { userId, reservation } = await assertBreeder(reservationId)
    const existing = await getContractByReservation(reservationId)
    if (existing) return { ok: true, contractId: existing.id }

    const tpl = CONTRACT_TEMPLATES.find((t) => t.id === templateId) ?? CONTRACT_TEMPLATES[0]
    const body = tpl.body(buildVars(reservation))
    const created = await createContract({
      reservationId,
      kennelId: reservation.kennel.id,
      createdBy: userId,
      title: tpl.label,
      bodyMarkdown: body,
    })
    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true, contractId: created.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

/** Sustituye `{{var}}` en el body de la plantilla con los valores de la
 *  reserva. Si la variable no existe o es vacía, queda en blanco (sin
 *  romper el layout). Sintaxis simple — sin condicionales ni lógica. */
function interpolateUserTemplate(body: string, vars: Record<string, string | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const v = vars[key]
    return v == null ? '' : String(v)
  })
}

/** Crea el contrato de una reserva a partir de una plantilla del propio
 *  criador (contract_templates) en lugar de los templates hardcoded.
 *  Se llama desde el dropdown "Empezar desde plantilla" en
 *  /reservas/[id]/contrato cuando aún no existe el contrato. */
export async function createFromUserTemplateAction(
  reservationId: string,
  userTemplateId: string,
): Promise<{ ok: true; contractId: string } | { ok: false; error: string }> {
  try {
    const { userId, reservation } = await assertBreeder(reservationId)
    const existing = await getContractByReservation(reservationId)
    if (existing) return { ok: true, contractId: existing.id }

    const tpl = await getContractTemplate(userTemplateId)
    if (!tpl) return { ok: false, error: 'Plantilla no encontrada' }
    if (tpl.kennel_id !== reservation.kennel.id) {
      return { ok: false, error: 'Plantilla no pertenece a este criadero' }
    }

    const vars = buildVars(reservation) as unknown as Record<string, string | undefined>
    const body = interpolateUserTemplate(tpl.body_md, vars)
    const created = await createContract({
      reservationId,
      kennelId: reservation.kennel.id,
      createdBy: userId,
      title: tpl.name,
      bodyMarkdown: body,
    })
    revalidatePath(`/reservas/${reservationId}/contrato`)
    return { ok: true, contractId: created.id }
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

export async function sendContractAction(
  reservationId: string,
  contractId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertBreeder(reservationId)
    await setContractStatus(contractId, 'sent', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sent_at: new Date().toISOString() as any,
    })
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
    const name = signatureName.trim()
    if (!name) return { ok: false, error: 'Escribe tu nombre completo para firmar' }
    const ip = await getClientIp()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    await assertBreeder(reservationId)
    const { data: row } = await admin
      .from('reservation_contracts')
      .select('signed_at_client, status')
      .eq('id', contractId)
      .maybeSingle()
    if (!row) return { ok: false, error: 'Contrato no encontrado' }
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
