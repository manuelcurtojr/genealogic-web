/**
 * /razas — directorio público de razas caninas.
 *
 * Fuente de datos: RPC `get_breeds_directory()` — devuelve TODAS las razas
 * con dog_count agregado en SQL (no truncado a 1000 como hacía el patrón
 * anterior con PostgREST + .in() + .limit(1_000_000)).
 *
 * El hero está alineado con la estética del home: tipografía editorial
 * (Fraunces para el título), counters en vivo, hero cinematográfico con
 * mosaico de imágenes de razas de fondo.
 */
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import BreedsDirectory, { type DirectoryBreed } from '@/components/breeds/breeds-directory'
import { Dog, Award } from 'lucide-react'
import Image from 'next/image'

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
  // admin client → bypass RLS + sin truncamiento de filas (necesario para
  // contar 250k+ perros agregados).
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
    // Si la raza tiene foto Wikipedia, esa va primero. Si no, fallback al
    // thumbnail de algún perro registrado de esa raza.
    image_url: r.image_url || r.sample_thumbnail,
  }))

  // El RPC ya devuelve ordenado por dog_count desc, pero re-sort por si
  // acaso (no cuesta nada — son ~250 elementos en memoria).
  list.sort((a, b) => b.dog_count - a.dog_count || a.name.localeCompare(b.name, 'es'))

  const totalDogs = list.reduce((acc, b) => acc + b.dog_count, 0)
  const totalBreeds = list.length

  // Mosaico de fondo del hero — top razas con foto.
  const heroImages = list
    .filter((b) => b.image_url)
    .slice(0, 12)
    .map((b) => b.image_url!)

  return (
    <div className="min-h-screen bg-canvas">
      {/* ═════ HERO — estilo home (Cal.com inspired), responsive ═════ */}
      <section className="relative overflow-hidden border-b border-hairline">
        {/* Mosaico de fondo: 3 cols en móvil, 6 en sm+ — evita celdas chuchurridas */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="grid h-full grid-cols-3 gap-px opacity-[0.07] sm:grid-cols-4 md:grid-cols-6 sm:opacity-[0.08]">
            {heroImages.slice(0, 12).map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 200px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-canvas via-canvas/85 to-canvas" />
        </div>

        {/* Contenido — padding fluido: px-4 móvil, px-6 sm, px-12 lg */}
        <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12 py-12 sm:py-20 lg:py-24">
          {/* Badge superior */}
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-hairline bg-canvas/80 backdrop-blur-md px-3 py-1.5 text-[10.5px] sm:text-[11.5px] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-ink shadow-sm">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FE6620] animate-pulse flex-shrink-0" />
            <span className="line-clamp-1">Directorio · {totalBreeds} razas</span>
          </div>

          {/* H1 — break-words evita overflow en móvil con palabras largas */}
          <h1
            className="mt-5 sm:mt-7 max-w-[20ch] font-semibold text-ink break-words"
            style={{
              fontSize: 'clamp(28px, 6.5vw, 64px)',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
            }}
          >
            Razas caninas con su{' '}
            <span style={{ color: '#FE6620' }} className="font-medium">
              genealogía verificable.
            </span>
          </h1>

          <p
            className="mt-4 sm:mt-7 max-w-[640px] text-body"
            style={{ fontSize: 'clamp(14px, 1.6vw, 19px)', lineHeight: 1.55 }}
          >
            Las {totalBreeds} razas registradas en Genealogic con sus estándares
            oficiales (FCI, RSCE, AKC, KC, ENCI…), colores admitidos y
            ejemplares con su árbol genealógico completo.
          </p>

          {/* Stats — grid 1col móvil / inline-flex sm+. Full width en móvil. */}
          <div className="mt-6 sm:mt-10 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-canvas/80 backdrop-blur-md px-4 py-3 shadow-sm sm:px-5 sm:py-3.5">
              <div className="flex-shrink-0 rounded-full bg-ink/5 p-2">
                <Dog className="h-4 w-4 text-ink" />
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span
                  className="font-bold text-ink tabular-nums"
                  style={{ fontSize: 'clamp(18px, 3vw, 26px)' }}
                >
                  {totalDogs.toLocaleString('es-ES')}
                </span>
                <span className="text-[12px] sm:text-[13px] text-muted truncate">
                  perros registrados
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-canvas/80 backdrop-blur-md px-4 py-3 shadow-sm sm:px-5 sm:py-3.5">
              <div className="flex-shrink-0 rounded-full bg-ink/5 p-2">
                <Award className="h-4 w-4 text-ink" />
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span
                  className="font-bold text-ink tabular-nums"
                  style={{ fontSize: 'clamp(18px, 3vw, 26px)' }}
                >
                  {totalBreeds}
                </span>
                <span className="text-[12px] sm:text-[13px] text-muted truncate">
                  razas en el catálogo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ DIRECTORIO — padding consistente con el hero ═════ */}
      <section>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16">
          <BreedsDirectory breeds={list} />
        </div>
      </section>
    </div>
  )
}
