/**
 * Contrato de una reserva — lado cliente.
 *
 * Estados:
 *  - No existe contrato o status='draft': "El criador aún no ha enviado el contrato"
 *  - 'sent' / 'signed_partial' sin firma del cliente: render + form de firma
 *  - 'signed_partial' (cliente ya firmó, criador no) o 'signed_full': render solo lectura
 *  - 'cancelled': aviso
 */
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getContractByReservation } from '@/lib/contracts/contracts'
import { renderContractMarkdown } from '@/lib/contracts/markdown'
import { getMyReservation } from '@/lib/owner/reservations'
import ClientSignForm from '@/components/contracts/client-sign-form'
import { CheckCircle2, Clock, FileText } from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contrato · Mi reserva · Genealogic' }

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

  // El cliente siempre puede ver/firmar el contrato de su reserva: el acceso
  // se restringe por propiedad de la reserva (getMyReservation), no por plan.
  const contract = await getContractByReservation(reservation.id)
  const visibleToClient = contract && contract.status !== 'draft' && contract.status !== 'cancelled'

  return (
    <div>
      <Link
        href={`/mis-reservas/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {t('Mi reserva')}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">{t('Contrato')}</h1>
      <p className="text-sm text-body mb-6">
        {t('Reserva con')} <strong>{reservation.kennel?.name}</strong>
      </p>

      {!visibleToClient ? (
        <WaitingForBreeder kennelName={reservation.kennel?.name} t={t} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <article
            className="contract-preview rounded-2xl border border-hairline bg-canvas p-8"
            dangerouslySetInnerHTML={{ __html: renderContractMarkdown(contract!.body_html) }}
          />
          <aside className="space-y-4">
            <StatusPanel contract={contract!} t={t} />
            {!contract!.signed_at_client && (
              <ClientSignForm
                reservationId={reservation.id}
                contractId={contract!.id}
              />
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

function WaitingForBreeder({ kennelName, t }: { kennelName?: string; t: (k: string) => string }) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatusPanel({ contract, t }: { contract: any; t: (k: string) => string }) {
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
  t: (k: string) => string
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
