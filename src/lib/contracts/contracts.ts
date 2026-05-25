/**
 * Helpers server-only para `reservation_contracts`.
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'

export type ContractStatus = 'draft' | 'sent' | 'signed_partial' | 'signed_full' | 'cancelled'

export type ReservationContract = {
  id: string
  reservation_id: string
  kennel_id: string
  title: string
  body_html: string
  body_json: unknown | null
  status: ContractStatus
  sent_at: string | null
  signed_at_breeder: string | null
  signature_breeder_name: string | null
  signature_breeder_ip: string | null
  signed_at_client: string | null
  signature_client_name: string | null
  signature_client_ip: string | null
  pdf_url: string | null
  pdf_generated_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/** Devuelve el contrato 1:1 de la reserva, o null. */
export const getContractByReservation = cache(
  async (reservationId: string): Promise<ReservationContract | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createKennelAdminClient() as any
    const { data } = await admin
      .from('reservation_contracts')
      .select('*')
      .eq('reservation_id', reservationId)
      .maybeSingle()
    return (data as ReservationContract | null) ?? null
  },
)

export async function createContract(args: {
  reservationId: string
  kennelId: string
  createdBy: string
  title?: string
  bodyMarkdown?: string
}): Promise<ReservationContract> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data, error } = await admin
    .from('reservation_contracts')
    .insert({
      reservation_id: args.reservationId,
      kennel_id: args.kennelId,
      created_by: args.createdBy,
      title: args.title || 'Contrato de compraventa',
      body_html: args.bodyMarkdown || '',
      status: 'draft',
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as ReservationContract
}

export async function updateContractBody(args: {
  contractId: string
  bodyMarkdown: string
  title?: string
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const patch: Record<string, unknown> = { body_html: args.bodyMarkdown }
  if (args.title) patch.title = args.title
  const { error } = await admin
    .from('reservation_contracts')
    .update(patch)
    .eq('id', args.contractId)
  if (error) throw new Error(error.message)
}

export async function setContractStatus(
  contractId: string,
  status: ContractStatus,
  extra: Partial<ReservationContract> = {},
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { error } = await admin
    .from('reservation_contracts')
    .update({ status, ...extra })
    .eq('id', contractId)
  if (error) throw new Error(error.message)

  // ─── Email a ambas partes cuando se completa la firma (best-effort) ───
  if (status === 'signed_full') {
    ;(async () => {
      try {
        const { sendTransactionalEmail } = await import('@/lib/email/send')
        const { data: contract } = await admin
          .from('reservation_contracts')
          .select(`
            id, pdf_url, reservation_id,
            signature_breeder_name, signature_client_name,
            reservation:puppy_reservations(
              applicant_name, applicant_email, client_user_id,
              kennel:kennels(id, name, owner_id)
            )
          `)
          .eq('id', contractId)
          .single()
        if (!contract) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = contract.reservation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kennel: any = res?.kennel
        if (!kennel?.owner_id) return

        // 1) Email al CRIADOR
        const { data: breederProfile } = await admin
          .from('profiles')
          .select('display_name, email')
          .eq('id', kennel.owner_id)
          .maybeSingle()
        if (breederProfile?.email) {
          await sendTransactionalEmail(
            breederProfile.email,
            {
              template: 'contract_signed',
              props: {
                recipientName: breederProfile.display_name || null,
                recipientRole: 'breeder',
                otherPartyName: res?.applicant_name || contract.signature_client_name || 'El cliente',
                kennelName: kennel.name,
                reservationId: contract.reservation_id,
                contractPdfUrl: contract.pdf_url || null,
              },
            },
            {
              userId: kennel.owner_id,
              dedupeKey: `contract_signed:breeder:${contract.id}`,
            },
          )
        }

        // 2) Email al CLIENTE
        if (res?.applicant_email) {
          await sendTransactionalEmail(
            res.applicant_email,
            {
              template: 'contract_signed',
              props: {
                recipientName: res.applicant_name || null,
                recipientRole: 'client',
                otherPartyName: breederProfile?.display_name || kennel.name,
                kennelName: kennel.name,
                reservationId: contract.reservation_id,
                contractPdfUrl: contract.pdf_url || null,
              },
            },
            {
              userId: res.client_user_id || undefined,
              dedupeKey: `contract_signed:client:${contract.id}`,
            },
          )
        }
      } catch (err) {
        console.error('[email] contract_signed failed', err)
      }
    })()
  }
}

export async function deleteContract(contractId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  await admin.from('reservation_contracts').delete().eq('id', contractId)
}
