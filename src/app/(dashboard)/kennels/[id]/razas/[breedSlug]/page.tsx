/**
 * /kennels/[slug]/razas/[breedSlug] — ficha promocional de la raza
 * brandeada con el contexto del kennel.
 *
 * Distinta de /razas/[slug] (público, técnico, FCI). Aquí el contenido
 * es marketing — virtudes, temperamento, vida diaria, consideraciones
 * y CTA hacia los perros de esa raza del kennel.
 *
 * Reglas de acceso:
 *  · Kennel debe ser Pro (o enterprise). Si no → 404.
 *  · El breed debe ser uno de los reproductores del kennel. Si no → 404.
 *  · La raza debe tener promotional_content rellenado. Si no → 404.
 *
 * UX:
 *  · Hero FULL-BLEED con foto. Prioriza foto de un perro del propio
 *    criadero (más auténtico). Si no tiene, cae a la foto genérica de
 *    la raza.
 *  · Círculos de los colores de la raza (los que tengan hex_code).
 *  · Bloques de texto centrados en max-w-3xl para legibilidad.
 *  · CTA final al catálogo de perros del kennel.
 */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan } from '@/lib/kennel/pro-web'
import {
  isReproductiveBreedOfKennel,
  pickKennelHeroPhotoForBreed,
} from '@/lib/kennel/breeds'

export const dynamic = 'force-dynamic'
export const revalidate = 600

type Promo = {
  tagline?: string
  intro?: string
  virtues?: { title: string; body: string }[]
  temperament?: string
  ideal_for?: string
  daily_life?: string
  considerations?: string
  closing?: string
}

type BreedColor = {
  id: string
  name: string
  hex_code: string | null
}

async function loadData(kennelId: string, breedSlug: string) {
  const supabase = await createClient()
  const field = isUUID(kennelId) ? 'id' : 'slug'

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, name, owner_id')
    .eq(field, kennelId)
    .maybeSingle()
  if (!kennel) return null

  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', kennel.owner_id)
      .maybeSingle()
    ownerPlan = prof?.plan || null
  }
  if (!isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })) return null

  const isReproductive = await isReproductiveBreedOfKennel(kennel.id, breedSlug)
  if (!isReproductive) return null

  const { data: breed } = await supabase
    .from('breeds')
    .select('id, slug, name, image_url, promotional_content, standard_data')
    .eq('slug', breedSlug)
    .maybeSingle()
  if (!breed || !breed.promotional_content) return null

  // Foto del kennel (perro propio) o fallback a la genérica de la raza
  const kennelPhoto = await pickKennelHeroPhotoForBreed(kennel.id, breed.id)
  const heroUrl = kennelPhoto?.url || breed.image_url

  // Colores de la raza (solo los que tienen hex para poder dibujar el círculo)
  const { data: colorRows } = await supabase
    .from('breed_colors')
    .select('color:colors(id, name, hex_code)')
    .eq('breed_id', breed.id)
  const colors: BreedColor[] = ((colorRows || []) as Array<{ color: BreedColor | BreedColor[] | null }>)
    .map((r) => (Array.isArray(r.color) ? r.color[0] : r.color))
    .filter((c): c is BreedColor => !!c && !!c.hex_code)

  return { kennel, breed, heroUrl, heroFromKennel: !!kennelPhoto, kennelPhoto, colors }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; breedSlug: string }> },
): Promise<Metadata> {
  const { id, breedSlug } = await params
  const data = await loadData(id, breedSlug)
  if (!data) return { title: 'No encontrado' }
  const { kennel, breed, heroUrl } = data
  const promo = breed.promotional_content as Promo
  return {
    title: `${breed.name} · ${kennel.name}`,
    description: promo.tagline || `${breed.name} en ${kennel.name}.`,
    alternates: {
      canonical: `https://genealogic.io/kennels/${kennel.slug}/razas/${breed.slug}`,
    },
    openGraph: {
      title: `${breed.name} · ${kennel.name}`,
      description: promo.tagline || undefined,
      images: heroUrl ? [{ url: heroUrl }] : undefined,
      type: 'article',
      locale: 'es_ES',
    },
  }
}

export default async function KennelBreedPromoPage(
  { params }: { params: Promise<{ id: string; breedSlug: string }> },
) {
  const { id, breedSlug } = await params
  const data = await loadData(id, breedSlug)
  if (!data) notFound()
  const { kennel, breed, heroUrl, heroFromKennel, kennelPhoto, colors } = data
  const promo = breed.promotional_content as Promo

  return (
    <>
      {/* ═══ HERO FULL-BLEED ═══ */}
      <section
        className="relative overflow-hidden bg-[#0a0a0a]"
        style={{
          marginLeft: 'calc(50% - 50vw)',
          marginRight: 'calc(50% - 50vw)',
          width: '100vw',
          maxWidth: '100vw',
        }}
      >
        {heroUrl && (
          <div className="absolute inset-0">
            <Image
              src={heroUrl}
              alt={heroFromKennel && kennelPhoto ? kennelPhoto.dogName : breed.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/15" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 min-h-[58vh] sm:min-h-[68vh] flex flex-col justify-end pt-28 pb-12 lg:pb-20">
          <Link
            href={`/kennels/${kennel.slug || kennel.id}/razas`}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium uppercase tracking-[0.18em] text-white/80 hover:text-white mb-6 w-fit"
          >
            <span aria-hidden>←</span> {kennel.name}
          </Link>
          <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.22em] text-white/85 mb-4 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-white/70" />
            La raza que criamos
          </p>
          <h1
            className="font-bold text-white tracking-[-0.035em] leading-[0.95] drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)] max-w-4xl"
            style={{ fontSize: 'clamp(40px, 7vw, 80px)' }}
          >
            {breed.name}
          </h1>
          {promo.tagline && (
            <p className="mt-6 max-w-2xl text-[17px] sm:text-[20px] leading-[1.5] text-white/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
              {promo.tagline}
            </p>
          )}
          {heroFromKennel && kennelPhoto && (
            <p className="mt-6 text-[11px] sm:text-[12px] text-white/65 italic">
              En la foto: <span className="text-white/80">{kennelPhoto.dogName}</span>, criado en {kennel.name}
            </p>
          )}
        </div>
      </section>

      {/* ═══ COLORES DE LA RAZA (circulitos) ═══ */}
      {colors.length > 0 && (
        <section className="border-b border-hairline">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted mb-5">
              Colores admitidos en el estándar
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-4 sm:gap-x-8 sm:gap-y-6">
              {colors.slice(0, 10).map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-2 w-20">
                  <div
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-2 ring-hairline shadow-[inset_0_-8px_24px_rgba(0,0,0,0.25)]"
                    style={{ backgroundColor: c.hex_code || '#ddd' }}
                    aria-label={c.name}
                  />
                  <span className="text-[11px] sm:text-[12px] text-center text-body leading-tight">
                    {c.name}
                  </span>
                </div>
              ))}
              {colors.length > 10 && (
                <div className="flex flex-col items-center justify-center gap-2 w-20">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-dashed border-muted/40 flex items-center justify-center text-[12px] font-semibold text-muted">
                    +{colors.length - 10}
                  </div>
                  <span className="text-[11px] text-muted">más</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ INTRO ═══ */}
      {promo.intro && (
        <section className="border-b border-hairline">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="prose-content text-[16px] sm:text-[17px] leading-[1.75] text-body whitespace-pre-wrap">
              {promo.intro}
            </div>
          </div>
        </section>
      )}

      {/* ═══ VIRTUDES ═══ */}
      {promo.virtues && promo.virtues.length > 0 && (
        <section
          className="bg-surface-soft/40 border-b border-hairline"
          style={{
            marginLeft: 'calc(50% - 50vw)',
            marginRight: 'calc(50% - 50vw)',
            width: '100vw',
            maxWidth: '100vw',
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.18em] text-muted mb-3">
              Por qué nos gusta esta raza
            </h2>
            <p className="max-w-2xl text-[22px] sm:text-[26px] font-semibold text-ink tracking-[-0.02em] leading-[1.2] mb-10">
              Lo que la distingue, en {promo.virtues.length} puntos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {promo.virtues.map((v, i) => (
                <div key={i}>
                  <h3 className="text-[16px] sm:text-[17px] font-semibold text-ink mb-2">
                    {v.title}
                  </h3>
                  <p className="text-[14.5px] sm:text-[15px] leading-[1.7] text-body">
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BLOQUES LARGOS ═══ */}
      {(promo.temperament || promo.ideal_for || promo.daily_life || promo.considerations) && (
        <section>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20 space-y-12">
            {promo.temperament && (
              <LongBlock label="Temperamento" body={promo.temperament} />
            )}
            {promo.ideal_for && (
              <LongBlock label="¿Para quién es esta raza?" body={promo.ideal_for} />
            )}
            {promo.daily_life && (
              <LongBlock label="Cómo es vivir con uno" body={promo.daily_life} />
            )}
            {promo.considerations && (
              <LongBlock label="Lo que conviene saber" body={promo.considerations} />
            )}
          </div>
        </section>
      )}

      {/* ═══ CLOSING + CTA ═══ */}
      <section
        className="bg-ink text-canvas"
        style={{
          marginLeft: 'calc(50% - 50vw)',
          marginRight: 'calc(50% - 50vw)',
          width: '100vw',
          maxWidth: '100vw',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          {promo.closing && (
            <p className="text-[18px] sm:text-[20px] leading-[1.55] text-canvas/90 mb-8">
              {promo.closing}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
            <Link
              href={`/kennels/${kennel.slug || kennel.id}/perros`}
              className="inline-flex items-center gap-2 rounded-full bg-canvas text-ink px-6 py-3 text-[14px] font-semibold tracking-[-0.005em] hover:bg-canvas/90 transition-colors w-full sm:w-auto justify-center"
            >
              Ver nuestros {breed.name}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href={`/razas/${breed.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-canvas/40 text-canvas px-6 py-3 text-[14px] font-semibold tracking-[-0.005em] hover:bg-canvas/10 hover:border-canvas/60 transition-colors w-full sm:w-auto justify-center"
            >
              Ver estándar
              <span aria-hidden className="text-canvas/70">↗</span>
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-canvas/60">
            El estándar técnico completo de la raza en Genealogic
          </p>
        </div>
      </section>
    </>
  )
}

function LongBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h2 className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.18em] text-muted mb-3">
        {label}
      </h2>
      <p className="text-[16px] sm:text-[17px] leading-[1.75] text-body whitespace-pre-wrap">
        {body}
      </p>
    </div>
  )
}
