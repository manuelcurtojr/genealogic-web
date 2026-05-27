/**
 * /razas/[slug] — ficha pública de una raza.
 *
 * Secciones:
 *  - Hero: nombre, origen, FCI nº, descripción
 *  - Estándares oficiales (FCI, RSCE, AKC, KC, etc.) con enlaces verificados
 *  - Colores admitidos según estándar
 *  - Catálogo de ejemplares (primeros 24, link a "ver más")
 *  - Top kennels especializados
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { DogImage } from '@/components/ui/dog-image'
import type { Metadata } from 'next'

export const revalidate = 3600

type Standard = {
  entity: string
  country: string
  url: string
  standard_number?: string | null
  language?: string | null
  official?: boolean
  notes?: string | null
  date_valid?: string | null
  year?: number | null
}

type StandardData = {
  fci_number?: string | null
  fci_group?: string | null
  origin?: string | null
  standards?: Standard[]
}

async function getBreed(slug: string) {
  const supabase = await createClient()
  const { data: breed } = await supabase
    .from('breeds')
    .select('id, name, slug, description, synonyms, standard_data')
    .eq('slug', slug)
    .maybeSingle()
  return breed
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const breed = await getBreed(slug)
  if (!breed) return { title: 'Raza no encontrada — Genealogic' }
  const desc = breed.description
    ? breed.description.slice(0, 200) + (breed.description.length > 200 ? '…' : '')
    : `Estándares oficiales, colores admitidos y ejemplares de la raza ${breed.name} en Genealogic.`
  return {
    title: `${breed.name} — Estándar, características y ejemplares · Genealogic`,
    description: desc,
    alternates: { canonical: `https://genealogic.io/razas/${slug}` },
    openGraph: {
      title: `${breed.name} — Genealogic`,
      description: desc,
      url: `https://genealogic.io/razas/${slug}`,
      siteName: 'Genealogic',
      type: 'article',
    },
  }
}

export default async function BreedPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const breed = await getBreed(slug)
  if (!breed) notFound()

  const supabase = await createClient()
  const std: StandardData = breed.standard_data || {}

  const [{ data: colorsLink }, { data: sampleDogs }, dogCountResult] = await Promise.all([
    supabase
      .from('breed_colors')
      .select('color:colors(id, name)')
      .eq('breed_id', breed.id),
    supabase
      .from('dogs')
      .select('id, slug, name, sex, thumbnail_url, birth_date')
      .eq('breed_id', breed.id)
      .eq('is_public', true)
      .not('thumbnail_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(24),
    supabase
      .from('dogs')
      .select('id', { count: 'exact', head: true })
      .eq('breed_id', breed.id),
  ])

  const colors = (colorsLink as any[] || [])
    .map((c) => c.color)
    .filter(Boolean)
    .sort((a: any, b: any) => a.name.localeCompare(b.name, 'es'))
  const totalDogs = dogCountResult.count || 0
  const synonyms = (breed.synonyms as string[] | null) || []

  return (
    <div className="min-h-screen bg-canvas">
      {/* Breadcrumb */}
      <nav className="border-b border-hairline">
        <div className="mx-auto max-w-[1100px] px-6 py-3 lg:px-12">
          <ol className="flex items-center gap-2 text-[12.5px] text-muted">
            <li>
              <Link href="/razas" className="hover:text-ink">
                Razas
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-ink">{breed.name}</li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1100px] px-6 pt-12 pb-10 lg:px-12 lg:pt-20 lg:pb-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">Raza canina</p>
          <h1
            className="mt-3 font-semibold text-ink"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
          >
            {breed.name}
          </h1>

          {/* Metadata pills */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            {std.origin && (
              <span>
                Origen: <strong className="font-semibold text-ink">{std.origin}</strong>
              </span>
            )}
            {std.fci_number && (
              <>
                <span aria-hidden>·</span>
                <span>
                  FCI nº <strong className="font-semibold text-ink">{std.fci_number}</strong>
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>
              <strong className="font-semibold text-ink">{totalDogs.toLocaleString('es-ES')}</strong>{' '}
              ejemplares en Genealogic
            </span>
          </div>

          {std.fci_group && (
            <p className="mt-4 text-[13.5px] text-muted">{std.fci_group}</p>
          )}

          {synonyms.length > 0 && (
            <p className="mt-3 text-[13px] text-muted">
              También conocida como: <span className="text-body">{synonyms.join(' · ')}</span>
            </p>
          )}

          {breed.description && (
            <p className="mt-7 max-w-[680px] text-[17px] leading-[1.6] text-body">
              {breed.description}
            </p>
          )}
        </div>
      </section>

      {/* Standards */}
      {std.standards && std.standards.length > 0 && (
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-12 lg:py-16">
            <h2
              className="font-semibold text-ink"
              style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.15, letterSpacing: '-0.025em' }}
            >
              Estándares oficiales
            </h2>
            <p className="mt-3 max-w-[560px] text-[14.5px] text-muted">
              Documentos oficiales de las entidades cinológicas que reconocen y regulan la raza.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {std.standards.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-[10px] border border-hairline p-4 transition-colors hover:bg-surface-soft"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink text-[15px]">{s.entity}</p>
                      {s.official && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-medium text-emerald-700">
                          Oficial
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {s.country}
                      {s.standard_number && ` · Estándar nº ${s.standard_number}`}
                      {s.language && ` · ${s.language.toUpperCase()}`}
                      {s.date_valid && ` · vigente desde ${s.date_valid}`}
                    </p>
                    {s.notes && (
                      <p className="mt-1.5 text-[12px] leading-[1.5] text-muted/80">{s.notes}</p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted transition-colors group-hover:text-ink" />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <section className="border-b border-hairline">
          <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-12 lg:py-16">
            <h2
              className="font-semibold text-ink"
              style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.15, letterSpacing: '-0.025em' }}
            >
              Colores admitidos
            </h2>
            <p className="mt-3 max-w-[560px] text-[14.5px] text-muted">
              Capas y patrones de pelaje contemplados en el estándar oficial de la raza.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {colors.map((c: any) => (
                <li
                  key={c.id}
                  className="rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[13px] text-ink"
                >
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Ejemplares destacados */}
      {sampleDogs && sampleDogs.length > 0 && (
        <section>
          <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-12 lg:py-16">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <h2
                  className="font-semibold text-ink"
                  style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.15, letterSpacing: '-0.025em' }}
                >
                  Ejemplares registrados
                </h2>
                <p className="mt-2 text-[14.5px] text-muted">
                  Algunos perros de la raza con su pedigree completo en Genealogic.
                </p>
              </div>
              {totalDogs > sampleDogs.length && (
                <Link
                  href={`/dogs?breed=${breed.id}`}
                  className="text-[13.5px] font-medium text-ink underline underline-offset-4 hover:no-underline"
                >
                  Ver los {totalDogs.toLocaleString('es-ES')} →
                </Link>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sampleDogs.map((d) => {
                const sexColor =
                  d.sex === 'male' ? BRAND.male : d.sex === 'female' ? BRAND.female : '#888'
                return (
                  <Link
                    key={d.id}
                    href={`/dogs/${d.slug || d.id}`}
                    className="group block overflow-hidden rounded-[10px] border border-hairline bg-canvas transition-colors hover:bg-surface-soft"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-card">
                      <DogImage
                        src={d.thumbnail_url}
                        alt={d.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        width={0}
                        height={0}
                        className="absolute inset-0 h-full w-full"
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: sexColor }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[13.5px] font-medium text-ink">{d.name}</p>
                      {d.birth_date && (
                        <p className="mt-0.5 text-[11.5px] text-muted">
                          {new Date(d.birth_date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
