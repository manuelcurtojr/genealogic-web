/**
 * /razas — directorio público de razas caninas.
 *
 * Lista todas las razas con conteo de perros y badge si tienen estándar
 * documentado. Diseño tipo blog index: hero + grid con cards minimal.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Directorio de razas caninas — Genealogic',
  description:
    'Catálogo completo de razas con sus estándares oficiales (FCI, RSCE, AKC, KC), colores admitidos y catálogo de ejemplares registrados en Genealogic.',
  alternates: { canonical: 'https://genealogic.io/razas' },
  openGraph: {
    title: 'Razas caninas — Genealogic',
    description:
      'Estándares oficiales, colores admitidos y miles de ejemplares de cada raza, con genealogías verificables.',
    url: 'https://genealogic.io/razas',
    siteName: 'Genealogic',
    type: 'website',
  },
}

export const revalidate = 3600 // 1h ISR

type BreedRow = {
  id: string
  name: string
  slug: string | null
  description: string | null
  standard_data: { fci_number?: string | null; origin?: string | null; standards?: any[] } | null
}

export default async function BreedsIndexPage() {
  const supabase = await createClient()

  // Get all breeds with slug + dog count
  const { data: breeds } = await supabase
    .from('breeds')
    .select('id, name, slug, description, standard_data')
    .not('slug', 'is', null)
    .order('name')

  // Count dogs per breed (single round-trip)
  const ids = (breeds || []).map((b) => b.id)
  let countByBreed = new Map<string, number>()
  if (ids.length) {
    const { data: counts } = await supabase
      .from('dogs')
      .select('breed_id')
      .in('breed_id', ids)
      .limit(1_000_000)
    for (const row of (counts as any[]) || []) {
      countByBreed.set(row.breed_id, (countByBreed.get(row.breed_id) || 0) + 1)
    }
  }

  const list = ((breeds as BreedRow[]) || []).map((b) => ({
    ...b,
    dog_count: countByBreed.get(b.id) || 0,
    has_standards: !!(b.standard_data?.standards && b.standard_data.standards.length > 0),
  }))
  const withDogs = list.filter((b) => b.dog_count > 0)
  const totalDogs = withDogs.reduce((acc, b) => acc + b.dog_count, 0)
  const withStandards = withDogs.filter((b) => b.has_standards).length

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1100px] px-6 pt-16 pb-12 lg:px-12 lg:pt-24 lg:pb-16">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Directorio</p>
          <h1
            className="mt-3 max-w-[24ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
          >
            Razas caninas con estándares oficiales y genealogías verificables.
          </h1>
          <p className="mt-6 max-w-[640px] text-[18px] leading-[1.6] text-body">
            Catálogo de {withDogs.length.toLocaleString('es-ES')} razas registradas en Genealogic, con
            sus estándares oficiales (FCI, RSCE, AKC, KC, ENCI…), colores admitidos y miles de
            ejemplares con su pedigree completo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-[13px] text-muted">
            <span>
              <strong className="font-semibold text-ink">{totalDogs.toLocaleString('es-ES')}</strong>{' '}
              perros registrados
            </span>
            <span aria-hidden>·</span>
            <span>
              <strong className="font-semibold text-ink">{withStandards}</strong> razas con estándares
              documentados
            </span>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section>
        <div className="mx-auto max-w-[1100px] px-6 py-14 lg:px-12 lg:py-20">
          {withDogs.length === 0 ? (
            <p className="text-body">No hay razas disponibles.</p>
          ) : (
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {withDogs.map((b) => (
                <Link
                  key={b.id}
                  href={`/razas/${b.slug}`}
                  className="group block rounded-[12px] border border-hairline p-5 transition-colors hover:bg-surface-soft"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h2
                      className="font-semibold text-ink transition-colors group-hover:text-ink/80"
                      style={{ fontSize: '20px', lineHeight: 1.2, letterSpacing: '-0.015em' }}
                    >
                      {b.name}
                    </h2>
                    {b.has_standards && (
                      <span
                        className="flex-shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[10.5px] font-medium text-ink"
                        title="Tiene estándares oficiales documentados"
                      >
                        Estándar
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                    {b.standard_data?.fci_number && (
                      <span>
                        FCI nº <strong className="font-semibold text-body">{b.standard_data.fci_number}</strong>
                      </span>
                    )}
                    {b.standard_data?.fci_number && b.standard_data?.origin && (
                      <span aria-hidden>·</span>
                    )}
                    {b.standard_data?.origin && <span>{b.standard_data.origin}</span>}
                  </div>
                  <p className="mt-4 text-[13px] text-muted">
                    <strong className="font-semibold text-ink">{b.dog_count.toLocaleString('es-ES')}</strong>{' '}
                    ejemplares registrados
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
