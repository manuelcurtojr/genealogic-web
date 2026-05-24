/**
 * Panel del Propietario: lista de "Mis perros".
 *
 * Perros transferidos al cliente desde reservas marcadas como entregadas.
 * Multi-criador: si el cliente tiene perros de Irema Y otro criadero, se
 * muestran todos juntos con badge del kennel origen.
 *
 * Fase B — solo lectura. Acciones futuras (subir foto del perro, añadir
 * vacuna, marcar microchip) llegarán en Fase C+.
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMyDogs, calcAge } from '@/lib/owner/dogs'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mis perros · Genealogic' }

export default async function MisPerrosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dogs = await getMyDogs(user.id)

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Panel del propietario
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">Mis perros</h1>
      <p className="mt-2 text-body max-w-2xl">
        Los perros que has recibido oficialmente de los criadores. Su pedigree,
        papeles y datos están aquí siempre.
      </p>

      <div className="mt-8">
        {dogs.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dogs.map((d) => (
              <DogCard key={d.id} dog={d} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-12 text-center">
      <p className="text-base font-semibold text-ink">Aún no tienes perros recibidos</p>
      <p className="mt-2 text-sm text-muted max-w-md mx-auto">
        Cuando un criador marque tu reserva como entregada, el perro aparecerá
        aquí automáticamente con todos sus datos y pedigree.
      </p>
      <Link
        href="/mis-reservas"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
      >
        Ver mis reservas →
      </Link>
    </div>
  )
}

import type { MyDog } from '@/lib/owner/dogs'

function DogCard({ dog }: { dog: MyDog }) {
  const kennel = dog.delivered_from_reservation?.kennel
  return (
    <li>
      <Link
        href={`/mis-perros/${dog.id}`}
        className="block rounded-2xl border border-hairline bg-canvas overflow-hidden hover:border-ink/30 hover:shadow-sm transition-all"
      >
        <div className="aspect-square bg-surface-card overflow-hidden">
          {dog.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dog.thumbnail_url}
              alt={dog.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-muted">
              {dog.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-base font-bold text-ink truncate tracking-tight">{dog.name}</p>
          <p className="text-xs text-muted mt-1 uppercase tracking-wider">
            {dog.sex === 'male' ? '♂ Macho' : dog.sex === 'female' ? '♀ Hembra' : '—'}
            {dog.breed?.name ? ` · ${dog.breed.name}` : ''}
            {dog.color?.name ? ` · ${dog.color.name}` : ''}
          </p>
          {dog.birth_date && (
            <p className="text-[11px] text-muted mt-1">{calcAge(dog.birth_date)}</p>
          )}
          {kennel && (
            <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-2">
              {kennel.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={kennel.logo_url}
                  alt={kennel.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-card flex items-center justify-center text-[8px] font-bold text-ink">
                  {kennel.name[0]?.toUpperCase()}
                </div>
              )}
              <p className="text-[11px] text-muted truncate">de {kennel.name}</p>
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}
