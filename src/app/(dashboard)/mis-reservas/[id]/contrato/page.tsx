/**
 * Contratos de una reserva — lado cliente.
 *
 * Una reserva puede tener DOS contratos: reserva ('reservation') y
 * compraventa/entrega ('delivery'). Mostramos los que el criador ya ha
 * enviado/firmado (status != 'draft' && != 'cancelled'), cada uno con su
 * preview + estado de firmas + form de firma.
 *
 * Antes de firmar, si a la reserva le faltan los datos del cliente
 * (DNI/domicilio) — necesarios para que el contrato salga completo — se muestra
 * el paso "Tus datos". Al guardarlos, el contrato se regenera y aparece el
 * form de firma.
 *
 * Estados por contrato:
 *  - 'sent' / 'signed_partial' sin firma del cliente: preview + (datos →) firma
 *  - 'signed_partial' (cliente ya firmó) o 'signed_full': preview solo lectura
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getContractsByReservation,
  type ReservationContract,
} from '@/lib/contracts/contracts'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { getMyReservation } from '@/lib/owner/reservations'
import ClientSignForm from '@/components/contracts/client-sign-form'
import ClientDetailsForm from '@/components/contracts/client-details-form'
import { CheckCircle2, Clock, FileText, PackageCheck, ScrollText } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contrato · Mi reserva · Genealogic' }

type T = (k: string) => string

// Datos del cliente ya guardados en la reserva (para prefill + saber si
// hace falta el paso "Tus datos").
type ApplicantDetails = {
  applicant_id_doc_number: string | null
  applicant_address: string | null
  applicant_postal_code: string | null
  applicant_city: string | null
}

export default async function MyReservationContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = getTranslator(await getLocale())
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const reservation = await getMyReservation(user.id, id)
  if (!reservation) notFound()

  // El cliente siempre puede ver/firmar los contratos de su reserva: el acceso
  // se restringe por propiedad de la reserva (getMyReservation), no por plan.
  const all = await getContractsByReservation(reservation.id)
  const contracts = all.filter((c) => c.status !== 'draft' && c.status !== 'cancelled')

  // Datos personales ya guardados (para prefill del paso "Tus datos").
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: details } = await admin
    .from('puppy_reservations')
    .select('applicant_id_doc_number, applicant_address, applicant_postal_code, applicant_city')
    .eq('id', reservation.id)
    .eq('client_user_id', user.id)
    .maybeSingle()
  const applicant: ApplicantDetails = details ?? {
    applicant_id_doc_number: null,
    applicant_address: null,
    applicant_postal_code: null,
    applicant_city: null,
  }
  const needsDetails = !applicant.applicant_id_doc_number || !applicant.applicant_address

  return (
    <div>
      <Link
        href={`/mis-reservas/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {t('Mi reserva')}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">
        {contracts.length > 1 ? t('Contratos') : t('Contrato')}
      </h1>
      <p className="text-sm text-body mb-6">
        {t('Reserva con')} <strong>{reservation.kennel?.name}</strong>
      </p>

      {contracts.length === 0 ? (
        <WaitingForBreeder kennelName={reservation.kennel?.name} t={t} />
      ) : (
        <div className="space-y-10">
          {contracts.map((contract) => (
            <ContractBlock
              key={contract.id}
              reservationId={reservation.id}
              contract={contract}
              applicant={applicant}
              needsDetails={needsDetails}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function contractTitle(kind: ReservationContract['kind'], t: T): string {
  return kind === 'delivery'
    ? t('Contrato de compraventa y entrega')
    : t('Contrato de reserva')
}

function ContractBlock({
  reservationId,
  contract,
  applicant,
  needsDetails,
  t,
}: {
  reservationId: string
  contract: ReservationContract
  applicant: ApplicantDetails
  needsDetails: boolean
  t: T
}) {
  const Icon = contract.kind === 'delivery' ? PackageCheck : ScrollText
  // Solo pedimos "Tus datos" si falta firma del cliente y faltan los datos.
  const showDetailsStep = !contract.signed_at_client && needsDetails

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-ink" />
        <h2 className="text-lg font-bold text-ink">{contractTitle(contract.kind, t)}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 sm:gap-6">
        <article
          className="contract-preview min-w-0 overflow-x-hidden break-words rounded-2xl border border-hairline bg-canvas p-5 sm:p-8"
          dangerouslySetInnerHTML={{ __html: renderContractMarkdown(contract.body_html) }}
        />
        <aside className="space-y-4">
          <StatusPanel contract={contract} t={t} />
          {!contract.signed_at_client && (
            showDetailsStep ? (
              <ClientDetailsForm
                reservationId={reservationId}
                contractId={contract.id}
                initialIdDoc={applicant.applicant_id_doc_number ?? ''}
                initialAddress={applicant.applicant_address ?? ''}
                initialPostalCode={applicant.applicant_postal_code ?? ''}
                initialCity={applicant.applicant_city ?? ''}
              />
            ) : (
              <ClientSignForm
                reservationId={reservationId}
                contractId={contract.id}
              />
            )
          )}
        </aside>
      </div>
    </section>
  )
}

function WaitingForBreeder({ kennelName, t }: { kennelName?: string; t: T }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-10 text-center">
      <FileText className="mx-auto mb-3 h-10 w-10 text-muted" />
      <p className="text-base font-semibold text-ink">{t('El contrato aún no está disponible')}</p>
      <p className="mt-2 text-sm text-muted max-w-md mx-auto">
        {kennelName ? <><strong>{kennelName}</strong> {t('está preparando el contrato. Te avisaremos cuando esté listo para revisar y firmar.')}</> : t('El criador está preparando el contrato. Te avisaremos cuando esté listo para revisar y firmar.')}
      </p>
    </div>
  )
}

function StatusPanel({ contract, t }: { contract: ReservationContract; t: T }) {
  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  return (
    <section className="rounded-2xl border border-hairline bg-canvas p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">{t('Estado')}</h3>
      <div className="space-y-3 text-sm">
        <Row
          label={t('Criador')}
          done={!!contract.signed_at_breeder}
          name={contract.signature_breeder_name}
          date={fmt(contract.signed_at_breeder)}
          t={t}
        />
        <Row
          label={t('Cliente (tú)')}
          done={!!contract.signed_at_client}
          name={contract.signature_client_name}
          date={fmt(contract.signed_at_client)}
          t={t}
        />
      </div>
      {contract.status === 'signed_full' && (
        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
          ✓ {t('Contrato firmado por ambas partes')}
        </div>
      )}
      <a
        href={`/contrato-print/${contract.id}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-canvas px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
      >
        <FileText className="h-3.5 w-3.5" />
        {t('Imprimir / Guardar PDF')}
      </a>
    </section>
  )
}

function Row({
  label,
  done,
  name,
  date,
  t,
}: {
  label: string
  done: boolean
  name: string | null
  date: string
  t: T
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
        {done ? (
          <>
            <p className="font-semibold text-ink truncate">{name || t('Firmado')}</p>
            <p className="text-[11px] text-muted">{date}</p>
          </>
        ) : (
          <p className="text-xs text-muted inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('Pendiente')}
          </p>
        )}
      </div>
      {done && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
    </div>
  )
}
