/**
 * Ruta de impresión de contrato (fuera del layout del dashboard, para imprimir
 * limpio). Accesible por AMBAS partes: el criador (kennel.owner_id) y el
 * cliente (reservation.client_user_id). Sirve para "Guardar como PDF".
 */
import { notFound, redirect } from 'next/navigation'
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { ContractPrintView } from '@/components/contracts/contract-print-view'
import { ContractPrintToolbar } from '@/components/contracts/contract-print-toolbar'

export const dynamic = 'force-dynamic'

export default async function ContractPrintPage({
  params,
}: {
  params: Promise<{ contractId: string }>
}) {
  const { contractId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=' + encodeURIComponent(`/contrato-print/${contractId}`))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: contract } = await admin
    .from('reservation_contracts')
    .select(
      `id, title, body_html, status, kind,
       signature_breeder_name, signed_at_breeder, signature_breeder_ip,
       signature_client_name, signed_at_client, signature_client_ip,
       reservation:puppy_reservations(applicant_name, client_user_id, kennel:kennels(owner_id, name))`,
    )
    .eq('id', contractId)
    .maybeSingle()
  if (!contract) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = contract.reservation
  const ownerId = res?.kennel?.owner_id
  const clientId = res?.client_user_id
  if (user.id !== ownerId && user.id !== clientId) notFound()

  const t = getTranslator(await getLocale())
  return (
    <main style={{ minHeight: '100vh', background: '#fff' }}>
      <ContractPrintToolbar saveLabel={t('Guardar como PDF')} />
      <ContractPrintView
        bodyMarkdown={contract.body_html || ''}
        status={contract.status}
        breeder={{
          name: contract.signature_breeder_name,
          date: contract.signed_at_breeder,
          ip: contract.signature_breeder_ip,
        }}
        client={{
          name: contract.signature_client_name,
          date: contract.signed_at_client,
          ip: contract.signature_client_ip,
        }}
      />
    </main>
  )
}
