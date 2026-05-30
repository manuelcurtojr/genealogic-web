/**
 * /razas — directorio público de razas caninas.
 *
 * Fuente de datos: RPC `get_breeds_directory()` — devuelve TODAS las razas
 * con dog_count agregado en SQL.
 *
 * Diseño sobrio (header + tabs + grid), consistente con /perros y /kennels
 * (sin el hero cinematográfico anterior).
 */
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import BreedsDirectory, { type DirectoryBreed } from '@/components/breeds/breeds-directory'
import DirectoryTabs from '@/components/search/directory-tabs'

export const metadata: Metadata = {
  title: 'Directorio de razas caninas — Genealogic',
  description:
    'Catálogo completo de razas con sus estándares oficiales (FCI, RSCE, AKC, KC), colores admitidos y miles de ejemplares con genealogía verificable.',
  alternates: { canonical: 'https://genealogic.io/razas' },
  openGraph: {
    title: 'Razas caninas — Genealogic',
    description:
      'Estándares oficiales, colores admitidos y miles de ejemplares de cada raza, con genealogías verificables.',
    url: 'https://genealogic.io/razas',
    siteName: 'Genealogic',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Razas — Genealogic' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image'],
  },
}

export const revalidate = 3600 // 1h ISR

type RpcRow = {
  id: string
  name: string
  slug: string
  synonyms: string[] | null
  image_url: string | null
  fci_number: string | null
  origin: string | null
  dog_count: number
  has_genealogic_standard: boolean
  has_sources: boolean
  sample_thumbnail: string | null
}

export default async function BreedsIndexPage() {
  // admin client → bypass RLS + sin truncamiento de filas.
  const admin = createKennelAdminClient() as any

  const { data: rpcRows } = await admin.rpc('get_breeds_directory')
  const rows: RpcRow[] = rpcRows || []

  const list: DirectoryBreed[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    fci_number: r.fci_number,
    origin: r.origin,
    synonyms: r.synonyms || [],
    dog_count: Number(r.dog_count),
    has_genealogic_standard: r.has_genealogic_standard,
    has_sources: r.has_sources,
    image_url: r.image_url || r.sample_thumbnail,
  }))

  list.sort((a, b) => b.dog_count - a.dog_count || a.name.localeCompare(b.name, 'es'))

  const totalDogs = list.reduce((acc, b) => acc + b.dog_count, 0)
  const totalBreeds = list.length

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12 py-8 sm:py-10">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Directorio</p>
          <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
            Razas
          </h1>
          <p className="mt-2 text-[14px] text-body">
            {totalBreeds} razas con sus estándares oficiales y {totalDogs.toLocaleString('es-ES')} ejemplares registrados.
          </p>
        </div>

        <div className="mt-6"><DirectoryTabs active="breeds" /></div>

        <div className="mt-6 sm:mt-8">
          <BreedsDirectory breeds={list} />
        </div>
      </div>
    </div>
  )
}
