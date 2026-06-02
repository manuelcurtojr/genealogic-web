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
import { generateContractBody } from '@/lib/contracts/render'
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
