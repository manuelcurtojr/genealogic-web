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
import { Dog, Trophy, Award, BookOpen } from 'lucide-react'
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
  const withGenealogicStandard = list.filter((b) => b.has_genealogic_standard).length
  const totalBreeds = list.length

  // Mosaico de imágenes para el fondo del hero — usamos los top 12 perros
  // con thumbnail real disponible. Si la raza tiene foto Wikipedia esa
  // funciona, si no usamos el sample_thumbnail.
  const heroImages = list
    .filter((b) => b.image_url)
    .slice(0, 12)
    .map((b) => b.image_url!)

  return (
    <div className="min-h-screen bg-canvas">
      {/* ═════ HERO CINEMATOGRÁFICO — estética home ═════ */}
      <section className="relative overflow-hidden border-b border-hairline">
        {/* Mosaico de fondo difuminado */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid h-full grid-cols-6 gap-px opacity-[0.08]">
            {heroImages.slice(0, 12).map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden">
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
          {/* Gradient blanco sobre el mosaico para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-b from-canvas via-canvas/85 to-canvas" />
        </div>

        {/* Contenido del hero */}
        <div className="relative mx-auto max-w-[1200px] px-6 pt-20 pb-16 lg:px-12 lg:pt-32 lg:pb-24">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted">
            Directorio · {totalBreeds} razas
          </p>

          <h1
            className="mt-4 max-w-[20ch] font-semibold text-ink"
            style={{
              fontFamily: 'var(--font-fraunces, serif)',
              fontSize: 'clamp(40px, 7vw, 84px)',
              lineHeight: 0.98,
              letterSpacing: '-0.04em',
            }}
          >
            Razas caninas con{' '}
            <em
              className="italic font-normal"
              style={{ color: 'var(--brand-primary, #D74709)' }}
            >
              genealogía
            </em>{' '}
            verificable.
          </h1>

          <p className="mt-6 max-w-[640px] text-[18px] leading-[1.55] text-body sm:text-[20px]">
            Catálogo de las {totalBreeds} razas registradas en Genealogic con
            sus estándares oficiales (FCI, RSCE, AKC, KC, ENCI…), colores
            admitidos y ejemplares con su árbol genealógico completo.
          </p>

          {/* ─── Counters editoriales ─── */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-10 max-w-[820px]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1 rounded-full bg-ink/5 p-2.5">
                <Dog className="h-5 w-5 text-ink" />
              </div>
              <div>
                <div
                  className="text-ink font-semibold"
                  style={{
                    fontFamily: 'var(--font-fraunces, serif)',
                    fontSize: 'clamp(28px, 3.2vw, 38px)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {totalDogs.toLocaleString('es-ES')}
                </div>
                <p className="mt-1 text-[13px] text-muted">perros registrados</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1 rounded-full bg-ink/5 p-2.5">
                <BookOpen className="h-5 w-5 text-ink" />
              </div>
              <div>
                <div
                  className="text-ink font-semibold"
                  style={{
                    fontFamily: 'var(--font-fraunces, serif)',
                    fontSize: 'clamp(28px, 3.2vw, 38px)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {withGenealogicStandard}
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  con estándar Genealogic
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1 rounded-full bg-ink/5 p-2.5">
                <Award className="h-5 w-5 text-ink" />
              </div>
              <div>
                <div
                  className="text-ink font-semibold"
                  style={{
                    fontFamily: 'var(--font-fraunces, serif)',
                    fontSize: 'clamp(28px, 3.2vw, 38px)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {totalBreeds}
                </div>
                <p className="mt-1 text-[13px] text-muted">razas en catálogo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════ DIRECTORIO ═════ */}
      <section>
        <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-12 lg:py-16">
          <BreedsDirectory breeds={list} />
        </div>
      </section>
    </div>
  )
}
