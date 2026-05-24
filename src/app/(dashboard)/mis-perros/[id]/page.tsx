/**
 * Panel del Propietario: ficha de un perro propio (recibido del criador).
 *
 * Fase B — lectura. Muestra todos los datos disponibles + link al perfil
 * público (genealogía completa, pedigree, etc.) y a la reserva origen.
 */
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getMyDog, calcAge } from '@/lib/owner/dogs'
import { formatDate } from '@/lib/owner/reservations'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi perro · Genealogic' }

export default async function MyDogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dog = await getMyDog(user.id, id)
  if (!dog) notFound()

  const kennel = dog.delivered_from_reservation?.kennel
  const reservation = dog.delivered_from_reservation

  return (
    <div>
      <Link
        href="/mis-perros"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← Mis perros
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Foto */}
        <div className="rounded-2xl bg-surface-card border border-hairline aspect-square overflow-hidden">
          {dog.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dog.thumbnail_url} alt={dog.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-muted">
              {dog.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Datos */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-ink">{dog.name}</h1>
          <p className="mt-2 text-sm text-body uppercase tracking-wider">
            {dog.sex === 'male' ? '♂ Macho' : dog.sex === 'female' ? '♀ Hembra' : '—'}
            {dog.breed?.name ? ` · ${dog.breed.name}` : ''}
            {dog.color?.name ? ` · ${dog.color.name}` : ''}
          </p>

          <Link
            href={`/dogs/${dog.slug || dog.id}`}
            target="_blank"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
          >
            Ver pedigree público →
          </Link>

          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-5">
            {dog.birth_date && (
              <Field label="Nacimiento">
                {formatDate(dog.birth_date)}
                <span className="block text-[11px] text-muted">{calcAge(dog.birth_date)}</span>
              </Field>
            )}
            {dog.registration && <Field label="LOE / Registro">{dog.registration}</Field>}
            {dog.microchip && <Field label="Microchip" mono>{dog.microchip}</Field>}
            {dog.weight != null && <Field label="Peso">{dog.weight} kg</Field>}
            {dog.height != null && <Field label="Alzada">{dog.height} cm</Field>}
          </dl>
        </div>
      </div>

      {/* Origen */}
      {kennel && (
        <section className="mt-10 rounded-2xl border border-hairline bg-canvas p-5">
          <h2 className="text-base font-bold text-ink mb-4">Procedencia</h2>
          <div className="flex items-center gap-4">
            {kennel.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={kennel.logo_url}
                alt={kennel.name}
                className="w-14 h-14 rounded-full object-cover border border-hairline"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center text-lg font-bold text-ink">
                {kennel.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Criador
              </p>
              <Link
                href={`/kennels/${kennel.slug}`}
                target="_blank"
                className="text-lg font-bold text-ink hover:text-brand"
              >
                {kennel.name}
              </Link>
              {reservation?.delivered_at && (
                <p className="text-xs text-muted mt-1">
                  Entregado el {formatDate(reservation.delivered_at)}
                </p>
              )}
            </div>
            <div className="ml-auto flex flex-col sm:flex-row gap-2">
              <Link
                href={`/kennels/${kennel.slug}`}
                target="_blank"
                className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink whitespace-nowrap"
              >
                Ver criador →
              </Link>
              {reservation && (
                <Link
                  href={`/mis-reservas/${reservation.id}`}
                  className="rounded-lg bg-ink text-on-primary px-4 py-2 text-xs font-semibold hover:opacity-90 whitespace-nowrap"
                >
                  Ver reserva origen →
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Papeles (placeholder Fase C) */}
      <section className="mt-6 rounded-2xl border border-hairline bg-canvas p-5">
        <h2 className="text-base font-bold text-ink mb-2">Papeles</h2>
        <p className="text-sm text-muted">
          Contrato, cartilla sanitaria, cartilla de vacunas y otros documentos
          aparecerán aquí en la próxima actualización. Mientras, contacta al
          criador para los originales.
        </p>
      </section>
    </div>
  )
}

function Field({
  label, children, mono,
}: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-1 text-sm text-ink font-medium ${mono ? 'font-mono text-xs' : ''}`}>
        {children}
      </dd>
    </div>
  )
}
