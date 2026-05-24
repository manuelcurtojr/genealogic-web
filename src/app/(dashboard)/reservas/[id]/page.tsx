/**
 * Detalle de una reserva — vista del criador.
 *
 * Hub central que enlaza:
 *  - Datos de la reserva + cliente
 *  - Mensajería bidireccional (Fase C.3)
 *  - Contrato (Fase C.4 — link a /reservas/[id]/contrato)
 *  - Pagos (Fase C.5 — link a /reservas/[id]/pagos)
 *  - Papeles del cachorro asignado (link a /dogs/[dog_id]/papeles)
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { listReservationMessages, markThreadRead } from '@/lib/reservations/messages'
import ReservationThread from '@/components/reservations/reservation-thread'
import { sendBreederMessageAction } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reserva · Genealogic' }

export default async function BreederReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: reservation } = await admin
    .from('puppy_reservations')
    .select(
      `*, kennel:kennels(id, name, slug, owner_id), dog:dogs!dog_id(id, slug, name, thumbnail_url)`,
    )
    .eq('id', id)
    .maybeSingle()
  if (!reservation) notFound()
  if (reservation.kennel?.owner_id !== user.id) redirect('/reservas')

  const messages = await listReservationMessages(reservation.id)
  markThreadRead(reservation.id, 'breeder').catch(() => {})

  const hasClientAccount = !!reservation.client_user_id

  return (
    <div>
      <Link
        href="/reservas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← Solicitudes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {reservation.applicant_name || 'Sin nombre'}
          </h1>
          <p className="mt-1 text-sm text-body">
            {reservation.applicant_email}
            {reservation.applicant_phone && ` · ${reservation.applicant_phone}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-surface-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-body">
            {reservation.status}
          </span>
          {hasClientAccount ? (
            <span className="text-[11px] text-emerald-700 font-semibold">
              ✓ Cuenta vinculada
            </span>
          ) : (
            <span className="text-[11px] text-muted">Sin cuenta · solo email</span>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Columna principal: mensajería */}
        <div>
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-base font-bold text-ink">Mensajes</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                {messages.length} {messages.length === 1 ? 'mensaje' : 'mensajes'}
              </span>
            </div>
            {hasClientAccount ? (
              <ReservationThread
                messages={messages}
                currentRole="breeder"
                reservationId={reservation.id}
                onSendAction={sendBreederMessageAction}
                otherSideName={reservation.applicant_name || 'el cliente'}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-6 text-center text-sm text-muted">
                <p className="text-ink font-semibold mb-1">Cliente sin cuenta</p>
                <p>
                  Cuando el cliente cree cuenta en Genealogic con el email{' '}
                  <strong>{reservation.applicant_email}</strong>, podrás chatear
                  con él aquí. Mientras tanto, usa email/WhatsApp.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: links rápidos */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
              Cachorro
            </h3>
            {reservation.dog ? (
              <div>
                <div className="flex items-center gap-3">
                  {reservation.dog.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reservation.dog.thumbnail_url}
                      alt={reservation.dog.name}
                      className="w-12 h-12 rounded-lg object-cover border border-hairline"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-card flex items-center justify-center text-sm font-bold text-ink">
                      {reservation.dog.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">
                      {reservation.dog.name}
                    </p>
                    <Link
                      href={`/dogs/${reservation.dog.slug || reservation.dog.id}`}
                      target="_blank"
                      className="text-[11px] text-muted hover:text-ink"
                    >
                      Ver ficha →
                    </Link>
                  </div>
                </div>
                <Link
                  href={`/dogs/${reservation.dog.id}/papeles`}
                  className="mt-3 inline-flex items-center gap-1 w-full justify-center rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
                >
                  Gestionar papeles →
                </Link>
              </div>
            ) : (
              <p className="text-xs text-muted">No hay cachorro asignado a esta reserva.</p>
            )}
          </section>

          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
              Contrato
            </h3>
            <p className="text-xs text-muted mb-3">
              Crea, edita y envía el contrato al cliente.
            </p>
            <Link
              href={`/reservas/${reservation.id}/contrato`}
              className="inline-flex items-center gap-1 w-full justify-center rounded-lg bg-ink text-on-primary px-3 py-2 text-xs font-semibold hover:opacity-90"
            >
              Abrir contrato →
            </Link>
          </section>

          <section className="rounded-2xl border border-hairline bg-canvas p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
              Pagos
            </h3>
            <p className="text-xs text-muted mb-3">
              Crear cobros (Stripe Connect o manual) y marcar pagos recibidos.
            </p>
            <Link
              href={`/reservas/${reservation.id}/pagos`}
              className="inline-flex items-center gap-1 w-full justify-center rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
            >
              Ver pagos →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
