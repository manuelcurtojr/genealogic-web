/**
 * /kennels/[slug]/razas — listado dinámico de razas que cría el kennel Pro.
 *
 * Reglas:
 *  · Solo accesible si el dueño del kennel es Pro (o enterprise como Irema).
 *    Si no, 404 — los kennels Free no tienen esta página.
 *  · Lista las razas DISTINCT de los perros con is_reproductive = true
 *    y is_public = true del kennel.
 *  · Solo entran razas que tienen promotional_content rellenado en BD.
 *    Sin contenido promocional, la card no se renderiza (evita cards
 *    huérfanas que llevan a páginas vacías).
 *
 * El layout superior se encarga de añadir el item al nav del kennel
 * cuando esta página existe (count > 0).
 */
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan } from '@/lib/kennel/pro-web'
import { getKennelReproductiveBreeds, pickKennelHeroPhotoForBreed } from '@/lib/kennel/breeds'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, slug')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) return { title: 'No encontrado' }
  return {
    title: `Nuestras razas · ${kennel.name}`,
    description: `Las razas que cría ${kennel.name}: características, virtudes y consideraciones reales de cada una.`,
    alternates: { canonical: `https://genealogic.io/kennels/${kennel.slug}/razas` },
  }
}

export default async function KennelRazasPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, name, owner_id')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) notFound()

  // Pro check — para Free, esta página no existe (404)
  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', kennel.owner_id)
      .maybeSingle()
    ownerPlan = prof?.plan || null
  }
  if (!isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })) {
    notFound()
  }

  const breedsBase = await getKennelReproductiveBreeds(kennel.id)
  if (breedsBase.length === 0) notFound()

  // Para cada raza, resolver la foto que se mostrará en la card. Prio:
  // perro elegido manualmente > reproductor > cualquier perro del kennel
  // > foto genérica de la raza. Hace que las cards muestren ejemplares
  // del propio criadero, mucho más auténtico que el stock.
  const breeds = await Promise.all(
    breedsBase.map(async (b) => {
      const kennelPhoto = await pickKennelHeroPhotoForBreed(kennel.id, b.id)
      return {
        ...b,
        card_image_url: kennelPhoto?.url || b.image_url,
        card_credit_dog: kennelPhoto?.dogName || null,
      }
    }),
  )

  const isSingular = breeds.length === 1
  const heading = isSingular ? t('Nuestra raza') : t('Nuestras razas')
  const sub = isSingular
    ? `${t('La raza que criamos en')} ${kennel.name}. ${t('Lo que la hace especial — y lo que conviene saber antes.')}`
    : `${t('Las razas que criamos en')} ${kennel.name}. ${t('Lo que las hace especiales — y lo que conviene saber antes.')}`

  return (
    <>
      {/* ═══ HERO LIGERO — FULL-BLEED ═══ */}
      <section
        className="kennel-bleed border-b border-hairline bg-surface-soft/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted mb-3">
            {kennel.name}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink tracking-[-0.025em] leading-[1.05]">
            {heading}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] sm:text-[16px] leading-[1.6] text-body">
            {sub}
          </p>
        </div>
      </section>

      {/* Grid de razas */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
          <div className={breeds.length === 1
            ? 'max-w-2xl mx-auto'
            : 'grid grid-cols-1 sm:grid-cols-2 gap-6'
          }>
            {breeds.map((b) => (
              <Link
                key={b.id}
                href={`/kennels/${kennel.slug || kennel.id}/razas/${b.slug}`}
                className="group block overflow-hidden rounded-2xl border border-hairline bg-canvas transition-all hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)] hover:border-ink/20"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-card">
                  {b.card_image_url ? (
                    <Image
                      src={b.card_image_url}
                      alt={b.card_credit_dog ? `${b.card_credit_dog} — ${b.name}` : b.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-wider text-muted/60">
                      {t('Sin imagen')}
                    </div>
                  )}
                  {b.card_credit_dog && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                      <p className="text-[11px] text-white/90 font-medium tracking-wide">
                        {b.card_credit_dog}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <h2 className="text-[20px] sm:text-[22px] font-semibold text-ink tracking-[-0.015em]">
                    {b.name}
                  </h2>
                  {b.tagline && (
                    <p className="mt-2 text-[14px] leading-[1.55] text-body line-clamp-3">
                      {b.tagline}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-[13px] font-medium text-ink">
                    <span>{t('Conoce la raza')}</span>
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
