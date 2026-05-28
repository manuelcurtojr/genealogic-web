/**
 * /razas — directorio público de razas caninas.
 *
 * Server fetcha lista completa (un par de cientos de razas) + dog counts y
 * la pasa al client component BreedsDirectory para búsqueda/filtros en
 * memoria. ISR 1h para no martillar la BBDD.
 */
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import BreedsDirectory, { type DirectoryBreed } from '@/components/breeds/breeds-directory'

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
  synonyms: string[] | null
  image_url: string | null
  standard_data: { fci_number?: string | null; origin?: string | null; standards?: any[] } | null
  genealogic_standard: { sections?: any[] } | null
}

export default async function BreedsIndexPage() {
  const supabase = await createClient()

  // Get all breeds with slug
  const { data: breeds } = await supabase
    .from('breeds')
    .select('id, name, slug, synonyms, image_url, standard_data, genealogic_standard')
    .not('slug', 'is', null)
    .order('name')

  // Dog counts per breed (single round-trip)
  const ids = (breeds || []).map((b) => b.id)
  const countByBreed = new Map<string, number>()
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

  const list: DirectoryBreed[] = ((breeds as BreedRow[]) || []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug!,
    fci_number: b.standard_data?.fci_number || null,
    origin: b.standard_data?.origin || null,
    synonyms: b.synonyms || [],
    dog_count: countByBreed.get(b.id) || 0,
    has_genealogic_standard: !!(b.genealogic_standard?.sections && b.genealogic_standard.sections.length > 0),
    has_sources: !!(b.standard_data?.standards && b.standard_data.standards.length > 0),
    image_url: b.image_url,
  }))

  const totalDogs = list.reduce((acc, b) => acc + b.dog_count, 0)
  const withGenealogicStandard = list.filter((b) => b.has_genealogic_standard).length

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1100px] px-6 pt-12 pb-10 lg:px-12 lg:pt-20 lg:pb-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Directorio</p>
          <h1
            className="mt-3 max-w-[24ch] font-semibold text-ink"
            style={{ fontSize: 'clamp(32px, 5.5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
          >
            Razas caninas con estándares oficiales y genealogías verificables.
          </h1>
          <p className="mt-5 max-w-[640px] text-[16px] leading-[1.6] text-body sm:text-[18px]">
            Catálogo de {list.length.toLocaleString('es-ES')} razas registradas en Genealogic, con
            sus estándares oficiales (FCI, RSCE, AKC, KC, ENCI…), colores admitidos y miles de
            ejemplares con su genealogía completa.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            <span>
              <strong className="font-semibold text-ink">{totalDogs.toLocaleString('es-ES')}</strong>{' '}
              perros registrados
            </span>
            <span aria-hidden>·</span>
            <span>
              <strong className="font-semibold text-ink">{withGenealogicStandard}</strong> con
              estándar Genealogic completo
            </span>
          </div>
        </div>
      </section>

      {/* Directorio (client component con búsqueda y filtros) */}
      <section>
        <div className="mx-auto max-w-[1100px] px-6 py-10 lg:px-12 lg:py-14">
          <BreedsDirectory breeds={list} />
        </div>
      </section>
    </div>
  )
}
