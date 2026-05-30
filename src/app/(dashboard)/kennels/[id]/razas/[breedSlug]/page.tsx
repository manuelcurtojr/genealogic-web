/**
 * /kennels/[slug]/razas/[breedSlug] — ficha promocional de la raza
 * brandeada con el contexto del kennel.
 *
 * Distinta de /razas/[slug] (público, técnico, FCI). Aquí el contenido
 * es marketing — virtudes, temperamento, vida diaria, consideraciones
 * y CTA hacia los perros de esta raza del kennel.
 *
 * Reglas de acceso:
 *  · Kennel debe ser Pro (o enterprise como Irema). Si no → 404.
 *  · El breed debe ser realmente uno de los reproductores del kennel.
 *    Si alguien escribe /razas/cualquier-raza y el kennel no la cría → 404.
 *  · La raza debe tener promotional_content rellenado. Si no → 404.
 */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan } from '@/lib/kennel/pro-web'
import { isReproductiveBreedOfKennel } from '@/lib/kennel/breeds'

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

  return { kennel, breed }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; breedSlug: string }> },
): Promise<Metadata> {
  const { id, breedSlug } = await params
  const data = await loadData(id, breedSlug)
  if (!data) return { title: 'No encontrado' }
  const { kennel, breed } = data
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
      images: breed.image_url ? [{ url: breed.image_url }] : undefined,
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
  const { kennel, breed } = data
  const promo = breed.promotional_content as Promo

  return (
    <main className="min-h-screen bg-canvas">
      {/* Hero con imagen de la raza */}
      <section className="relative overflow-hidden border-b border-hairline">
        {breed.image_url && (
          <>
            <div className="absolute inset-0">
              <Image
                src={breed.image_url}
                alt={breed.name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
            </div>
          </>
        )}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-20 sm:py-28 lg:py-36">
          <Link
            href={`/kennels/${kennel.slug || kennel.id}/razas`}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.18em] text-white/80 hover:text-white mb-6"
          >
            <span aria-hidden>←</span> {kennel.name}
          </Link>
          <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.22em] text-white/85 mb-4">
            La raza que criamos
          </p>
          <h1
            className="font-bold text-white tracking-[-0.03em] leading-[1] drop-shadow-[0_2px_30px_rgba(0,0,0,0.45)]"
            style={{ fontSize: 'clamp(36px, 6.5vw, 72px)' }}
          >
            {breed.name}
          </h1>
          {promo.tagline && (
            <p className="mt-6 max-w-2xl text-[17px] sm:text-[19px] leading-[1.5] text-white/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)]">
              {promo.tagline}
            </p>
          )}
        </div>
      </section>

      {/* Intro */}
      {promo.intro && (
        <section className="border-b border-hairline">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="prose-content text-[16px] sm:text-[17px] leading-[1.75] text-body whitespace-pre-wrap">
              {promo.intro}
            </div>
          </div>
        </section>
      )}

      {/* Virtues — grid de 2 col */}
      {promo.virtues && promo.virtues.length > 0 && (
        <section className="bg-surface-soft/40 border-b border-hairline">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted mb-3">
              Por qué nos gusta esta raza
            </h2>
            <p className="max-w-2xl text-[22px] sm:text-[26px] font-semibold text-ink tracking-[-0.02em] leading-[1.2] mb-10">
              Lo que la distingue, en cuatro puntos.
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

      {/* Secciones largas: temperamento, ideal_for, daily_life, considerations */}
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

      {/* Closing + CTA hacia los perros del kennel */}
      <section className="bg-ink text-canvas">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          {promo.closing && (
            <p className="text-[18px] sm:text-[20px] leading-[1.55] text-canvas/90 mb-8">
              {promo.closing}
            </p>
          )}
          <Link
            href={`/kennels/${kennel.slug || kennel.id}/perros`}
            className="inline-flex items-center gap-2 rounded-full bg-canvas text-ink px-6 py-3 text-[14px] font-semibold tracking-[-0.005em] hover:bg-canvas/90 transition-colors"
          >
            Ver nuestros {breed.name}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </main>
  )
}

function LongBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted mb-3">
        {label}
      </h2>
      <p className="text-[16px] sm:text-[17px] leading-[1.75] text-body whitespace-pre-wrap">
        {body}
      </p>
    </div>
  )
}
