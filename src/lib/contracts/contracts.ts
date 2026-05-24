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
}

export async function deleteContract(contractId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  await admin.from('reservation_contracts').delete().eq('id', contractId)
}
