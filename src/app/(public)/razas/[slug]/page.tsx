/**
 * /razas/[slug] — ficha pública de una raza con estándar Genealogic.
 *
 * Layout 2 columnas tipo /legal:
 *   sidebar (12 secciones del estándar) + contenido scrollable con anchors.
 *
 * Fuente de datos: campos breeds.{description, synonyms, standard_data,
 * genealogic_standard, club_differences} + breed_colors + ejemplares.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ExternalLink, AlertCircle } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { DogImage } from '@/components/ui/dog-image'
import BreedStandardSidebar from '@/components/breeds/breed-standard-sidebar'
import RecordView from '@/components/track/record-view'
import { BREED_SECTIONS } from '@/components/breeds/sections'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
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
}

type StandardData = {
  fci_number?: string | null
  fci_group?: string | null
  origin?: string | null
  standards?: Standard[]
}

type GenealogicStandard = {
  sections?: { key: string; title: string; content: string }[]
}

type ClubDifferences = {
  differences?: { topic: string; items: { entity: string; position: string }[] }[]
}

async function getBreed(slug: string) {
  const supabase = await createClient()
  const { data: breed } = await supabase
    .from('breeds')
    .select('id, name, slug, description, synonyms, standard_data, genealogic_standard, club_differences, image_url, image_attribution')
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
  // Filtramos descriptions de importación legacy ("Imported from dogsfiles.com…")
  // que no aportan nada en SEO.
  const isLegacyDesc =
    breed.description && /^Imported from /i.test(breed.description.trim())
  const cleanDesc = !isLegacyDesc && breed.description ? breed.description : null
  const desc = cleanDesc
    ? cleanDesc.slice(0, 200) + (cleanDesc.length > 200 ? '…' : '')
    : `Estándar oficial, características y ejemplares de la raza ${breed.name}. Origen, temperamento, apariencia y diferencias entre clubes.`
  const url = `https://www.genealogic.io/razas/${slug}`

  // ─── OG image ───────────────────────────────────────────────────────────
  // Igual que en /dogs/[id]: usamos Supabase Image Transformations para
  // forzar 1200x630 + cache CDN largo, lo que hace que WhatsApp/Facebook
  // muestren bien el preview al compartir el enlace.
  // Las 243 imágenes de razas ya están en Supabase Storage (no externas).
  // Fallback si la raza no tiene foto: opengraph-image global brandeado.
  const FALLBACK_OG = 'https://www.genealogic.io/opengraph-image'
  let ogImageUrl = FALLBACK_OG
  let ogIsTransformed = false
  if (breed.image_url) {
    if (breed.image_url.includes('/storage/v1/object/public/')) {
      ogImageUrl =
        breed.image_url.replace(
          '/storage/v1/object/public/',
          '/storage/v1/render/image/public/',
        ) + '?width=1200&height=630&resize=cover&quality=82'
      ogIsTransformed = true
    } else {
      ogImageUrl = breed.image_url
    }
  }

  return {
    title: `${breed.name} — Estándar oficial y características · Genealogic`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${breed.name} — Genealogic`,
      description: desc,
      url,
      siteName: 'Genealogic',
      type: 'article',
      locale: 'es_ES',
      images: ogIsTransformed
        ? [
            {
              url: ogImageUrl,
              secureUrl: ogImageUrl,
              width: 1200,
              height: 630,
              alt: breed.name,
              type: 'image/jpeg',
            },
          ]
        : [{ url: ogImageUrl, alt: breed.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${breed.name} — Genealogic`,
      description: desc,
      images: [ogImageUrl],
    },
  }
}

// Parsea **bold** inline en una sola línea. Reutilizable en cualquier <p>.
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={j} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={j}>{part}</span>
  })
}

// Renderiza el contenido de una sección. Soporta **bold** y newlines.
function renderContent(text: string) {
  // Split por dobles saltos en párrafos
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  return paragraphs.map((p, i) => (
    <p key={i} className="text-[14.5px] leading-[1.75] text-body">
      {renderInline(p)}
    </p>
  ))
}

export default async function BreedPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const t = getTranslator(await getLocale())
  const { slug } = await params
  const breed = await getBreed(slug)
  if (!breed) notFound()

  const supabase = await createClient()
  const std: StandardData = breed.standard_data || {}
  const gStandard: GenealogicStandard = breed.genealogic_standard || {}
  const diffs: ClubDifferences = breed.club_differences || {}

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
      .is('deceased_at', null)  // ocultar perros fallecidos del directorio
      // Prioridad: perros con foto primero (thumbnail_url NOT NULL),
      // luego los sin foto. Dentro de cada grupo, los más recientes arriba.
      // En PostgREST: order desc + nullsFirst:false → NOT NULL > NULL.
      .order('thumbnail_url', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(12),
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

  // Lookup sections by key for ordered render
  const sectionsByKey = new Map((gStandard.sections || []).map((s) => [s.key, s]))

  const hasStandard = (gStandard.sections || []).length > 0

  // JSON-LD Schema.org — Article + Thing/breed + Breadcrumb
  const pageUrl = `https://www.genealogic.io/razas/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        url: pageUrl,
        headline: `${breed.name} — Estándar Genealogic`,
        description: breed.description || `Estándar canónico de la raza ${breed.name}.`,
        image: breed.image_url || undefined,
        inLanguage: 'es',
        isPartOf: { '@id': 'https://www.genealogic.io/#website' },
        about: { '@id': `${pageUrl}#breed` },
      },
      {
        '@type': 'Thing',
        '@id': `${pageUrl}#breed`,
        name: breed.name,
        alternateName: synonyms.length ? synonyms : undefined,
        url: pageUrl,
        image: breed.image_url || undefined,
        description: breed.description || undefined,
        additionalType: 'https://schema.org/AnimalBreed',
        ...(std.fci_number && {
          identifier: { '@type': 'PropertyValue', propertyID: 'FCI', value: std.fci_number },
        }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Razas', item: 'https://www.genealogic.io/razas' },
          { '@type': 'ListItem', position: 2, name: breed.name, item: pageUrl },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-canvas">
      <RecordView type="breed" itemRef={breed.slug} name={breed.name} image={breed.image_url} subtitle={totalDogs > 0 ? `${totalDogs.toLocaleString('es-ES')} perros` : null} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="border-b border-hairline">
        <div className="mx-auto max-w-[1200px] px-4 py-3 sm:px-6">
          <ol className="flex items-center gap-2 text-[12.5px] text-muted">
            <li>
              <Link href="/razas" className="hover:text-ink">
                {t('Razas')}
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-ink">{breed.name}</li>
          </ol>
        </div>
      </nav>

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <header>
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">{t('Raza canina')}</p>
          <h1
            className="mt-3 font-semibold text-ink"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.035em' }}
          >
            {breed.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            {std.origin && (
              <span>{t('Origen:')} <strong className="font-semibold text-ink">{std.origin}</strong></span>
            )}
            {std.fci_number && (
              <>
                <span aria-hidden>·</span>
                <span>{t('FCI nº')} <strong className="font-semibold text-ink">{std.fci_number}</strong></span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>
              <strong className="font-semibold text-ink">{totalDogs.toLocaleString('es-ES')}</strong>{' '}
              {t('ejemplares en Genealogic')}
            </span>
          </div>
          {synonyms.length > 0 && (
            <p className="mt-3 text-[13px] text-muted">
              {t('También:')} <span className="text-body">{synonyms.join(' · ')}</span>
            </p>
          )}
          {breed.description && (
            <p className="mt-7 max-w-[680px] text-[17px] leading-[1.6] text-body">
              {breed.description}
            </p>
          )}
        </header>

        {/* Si no hay estándar Genealogic todavía, mostrar formato simple antiguo */}
        {!hasStandard && (
          <section className="mt-12 rounded-2xl border border-hairline bg-surface-soft/40 p-8 text-center">
            <p className="text-[14.5px] text-muted">
              {t('El estándar canónico de Genealogic para esta raza está en preparación.')}
            </p>
            {std.standards && std.standards.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 text-left">
                {std.standards.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-canvas p-3 hover:bg-surface-soft">
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">{s.entity}</p>
                      <p className="text-[12px] text-muted">{s.country}{s.standard_number && ` · nº ${s.standard_number}`}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted" />
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Layout 2 columnas con sidebar */}
        {hasStandard && (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] lg:gap-10">
            {/* Sidebar */}
            <aside className="lg:py-2">
              <BreedStandardSidebar
                breedName={breed.name}
                origin={std.origin}
                fciNumber={std.fci_number}
              />
            </aside>

            {/* Contenido del estándar */}
            <article className="min-w-0">
              <div className="rounded-2xl border border-hairline bg-canvas px-6 py-8 sm:px-10 sm:py-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {/* Secciones 1-12 (estándar Genealogic) */}
                {BREED_SECTIONS.slice(0, 12).map((meta) => {
                  const sec = sectionsByKey.get(meta.id)
                  if (!sec) return null
                  return (
                    <section key={meta.id} id={meta.id} className="scroll-mt-20 mb-10 last:mb-0">
                      <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink pb-2 border-b border-hairline-soft">
                        {sec.title}
                      </h2>
                      <div className="mt-4 space-y-3">{renderContent(sec.content)}</div>
                    </section>
                  )
                })}

                {/* Colores admitidos (entre Manto y Faltas si quieres, lo dejamos al final del bloque) */}
                {colors.length > 0 && (
                  <section className="mb-10">
                    <h3 className="text-[15px] font-semibold text-ink mb-3">{t('Colores en Genealogic')}</h3>
                    <ul className="flex flex-wrap gap-2">
                      {colors.map((c: any) => (
                        <li key={c.id} className="rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[13px] text-ink">
                          {c.name}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Disclaimer + reinterpretación */}
                <section id="reinterpretacion" className="scroll-mt-20 mb-10">
                  <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink pb-2 border-b border-hairline-soft">
                    {t('Sobre este estándar')}
                  </h2>
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex gap-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-700 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[13.5px] leading-[1.7] text-amber-900">
                        {t('Este estándar es una')} <strong>{t('reinterpretación de Genealogic')}</strong> {t('de las fuentes oficiales (FCI, RSCE, AKC, KC, ENCI…) reorganizada en una estructura común a todas las razas para facilitar la comparación entre criadores y propietarios.')} <strong>{t('No sustituye al estándar oficial')}</strong>.
                      </p>
                      <p className="mt-2 text-[13px] leading-[1.7] text-amber-900">
                        {t('Para uso oficial — jueces, expositores, criadores que registran cachorros — consulta siempre los documentos originales de cada entidad que enlazamos debajo.')}
                      </p>
                    </div>
                  </div>

                  {/* Fuentes oficiales */}
                  {std.standards && std.standards.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-[14px] font-semibold text-ink mb-3">{t('Fuentes oficiales consultadas')}</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {std.standards.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start justify-between gap-3 rounded-lg border border-hairline p-3 transition-colors hover:bg-surface-soft"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-ink text-[13.5px]">{s.entity}</p>
                                {s.official && (
                                  <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[9.5px] font-medium text-emerald-700">
                                    {t('Oficial')}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11.5px] text-muted">
                                {s.country}
                                {s.standard_number && ` · nº ${s.standard_number}`}
                                {s.language && ` · ${s.language.toUpperCase()}`}
                              </p>
                              {s.notes && (
                                <p className="mt-1 text-[11px] leading-[1.5] text-muted/80">{s.notes}</p>
                              )}
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted transition-colors group-hover:text-ink" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Diferencias entre clubes */}
                {diffs.differences && diffs.differences.length > 0 && (
                  <section id="diferencias-clubes" className="scroll-mt-20">
                    <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink pb-2 border-b border-hairline-soft">
                      {t('Diferencias entre clubes')}
                    </h2>
                    <p className="mt-4 max-w-[600px] text-[14px] leading-[1.7] text-body">
                      {t('Distintas entidades cinológicas mantienen criterios ligeramente diferentes sobre la misma raza. Estas son las divergencias principales.')}
                    </p>

                    <div className="mt-6 space-y-6">
                      {diffs.differences.map((d, i) => (
                        <div key={i} className="rounded-xl border border-hairline overflow-hidden">
                          <div className="bg-surface-soft/60 px-4 py-2.5 border-b border-hairline">
                            <p className="text-[13px] font-semibold text-ink">{d.topic}</p>
                          </div>
                          <ul className="divide-y divide-hairline-soft">
                            {d.items.map((it, j) => (
                              <li key={j} className="px-4 py-3 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
                                <p className="text-[12.5px] font-semibold text-ink">{it.entity}</p>
                                <p className="text-[13px] leading-[1.65] text-body">{renderInline(it.position)}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </article>
          </div>
        )}

        {/* Ejemplares destacados — debajo de todo, ancho completo */}
        {sampleDogs && sampleDogs.length > 0 && (
          <section className="mt-16 pt-12 border-t border-hairline">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <h2
                  className="font-semibold text-ink"
                  style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', lineHeight: 1.15, letterSpacing: '-0.025em' }}
                >
                  {t('Ejemplares en Genealogic')}
                </h2>
                <p className="mt-2 text-[14px] text-muted">
                  {t('Algunos perros de la raza con su genealogía registrada.')}
                </p>
              </div>
              {totalDogs > sampleDogs.length && (
                <Link
                  href={`/dogs?breed=${breed.id}`}
                  className="text-[13.5px] font-medium text-ink underline underline-offset-4 hover:no-underline"
                >
                  {t('Ver los')} {totalDogs.toLocaleString('es-ES')} →
                </Link>
              )}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
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
                      <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                      {d.birth_date && (
                        <p className="mt-0.5 text-[11px] text-muted">
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
          </section>
        )}
      </main>
    </div>
  )
}
