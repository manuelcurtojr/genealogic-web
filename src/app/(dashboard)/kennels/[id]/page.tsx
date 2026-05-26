import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Calendar, MapPin, ExternalLink, Sparkles, BadgeCheck } from 'lucide-react'
import { isUUID } from '@/lib/slug'
import { pastelByName } from '@/lib/avatars'
import KennelPublicTabs from '@/components/kennel/kennel-public-tabs'
import PageTracker from '@/components/track/page-tracker'
import ContactKennelButton from '@/components/kennel/contact-kennel-button'
import ClaimBanner from '@/components/admin-requests/claim-banner'
import { sortDogsPhotoFirst } from '@/lib/dogs/sort'
import { KennelJsonLd, BreadcrumbJsonLd } from '@/lib/seo/json-ld'
import type { Metadata } from 'next'

/**
 * Perfil público de criadero (versión "básica") — una sola landing.
 *
 * Para Free/Kennel este es el destino final: una landing simple pero
 * vendedora con hero + catálogo de perros + contacto.
 *
 * Para Kennel Pro (Irema y futuros) este perfil seguirá existiendo, pero
 * además habrá una web multi-página con chrome propio (separado, en otra
 * fase). Mientras tanto, si el kennel tiene `default_public_view='custom_web'`
 * el redirect a /c/[slug] sigue funcionando intacto.
 *
 * Foco del diseño: el hero. Es lo único que cambia respecto al anterior
 * — visual más fuerte, CTA contacto destacado (si el kennel tiene owner),
 * stats claras del criadero, redes como botones (no links texto suelto).
 */

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, slug, logo_url, description, country, city')
    .eq(field, id)
    .single()
  if (!kennel) return { title: 'Criadero no encontrado — Genealogic' }

  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const description = kennel.description?.substring(0, 160)
    || `Criadero ${kennel.name}${location ? ' en ' + location : ''} | Genealogic`
  const image = kennel.logo_url || 'https://genealogic.io/icon.svg'
  const canonical = `https://genealogic.io/kennels/${kennel.slug || id}`

  return {
    title: `${kennel.name} — Criadero | Genealogic`,
    description,
    alternates: { canonical },
    openGraph: {
      title: kennel.name,
      description,
      url: canonical,
      images: [{ url: image, alt: kennel.name }],
      type: 'website',
      siteName: 'Genealogic',
    },
    twitter: { card: 'summary_large_image', title: kennel.name, description, images: [image] },
  }
}

export default async function KennelDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ force?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase.from('kennels').select('*').eq(field, id).single()
  if (!kennel) notFound()

  // 301 canónica UUID → slug
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}`)
  }

  // Mismo flujo de redirect a web custom — sin tocar nada (Irema sigue con
  // su /c/irema-curto cuando default_public_view='custom_web').
  const isOwner = user?.id === kennel.owner_id
  const forceStandard = sp.force === 'standard'
  const forceCustom = sp.force === 'custom'
  const wantsCustomRedirect =
    kennel.default_public_view === 'custom_web' && !!kennel.slug
  if (wantsCustomRedirect && !forceStandard && (!isOwner || forceCustom)) {
    const { data: customPageCheck } = await supabase
      .from('kennel_pages')
      .select('id')
      .eq('kennel_id', kennel.id)
      .eq('slug', 'home')
      .eq('enabled', true)
      .maybeSingle()
    if (customPageCheck) {
      redirect(`/c/${kennel.slug}`)
    }
  }

  // ─── Datos del perfil ──────────────────────────────────────────────
  const [allDogsRes, allLittersRes, breedsRes, customPageRes] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, slug, name, sex, thumbnail_url, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, breed:breeds(name)')
      .eq('kennel_id', kennel.id)
      .or('show_in_kennel.is.null,show_in_kennel.eq.true')
      .order('name'),
    supabase
      .from('litters')
      .select('id, status, birth_date, mating_date, breed:breeds(name), father:dogs!litters_father_id_fkey(id, name, thumbnail_url), mother:dogs!litters_mother_id_fkey(id, name, thumbnail_url)')
      .eq('owner_id', kennel.owner_id)
      .eq('show_in_kennel', true)
      .order('created_at', { ascending: false }),
    kennel.breed_ids && kennel.breed_ids.length > 0
      ? supabase.from('breeds').select('id, name').in('id', kennel.breed_ids)
      : Promise.resolve({ data: [] }),
    supabase
      .from('kennel_pages')
      .select('id')
      .eq('kennel_id', kennel.id)
      .eq('slug', 'home')
      .eq('enabled', true)
      .maybeSingle(),
  ])

  const allDogs = allDogsRes.data || []
  const allLitters = allLittersRes.data || []
  const breedNames = (breedsRes.data || []).map((b: { name: string }) => b.name)
  const hasCustomWeb = !!customPageRes.data && !!kennel.slug

  const dogs = sortDogsPhotoFirst(allDogs)
  const litters = allLitters
  const forSale = dogs.filter((d: { is_for_sale: boolean | null }) => d.is_for_sale)
  const reproductores = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => d.is_reproductive && !d.is_for_sale)
  const criados = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => !d.is_reproductive && !d.is_for_sale)

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }
  const canonicalUrl = `https://genealogic.io/kennels/${kennel.slug || id}`
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null

  // Stats para mostrar en el hero (solo las que tengan valor positivo)
  const stats = [
    { value: dogs.length, label: dogs.length === 1 ? 'Perro' : 'Perros' },
    { value: litters.filter((l: { status: string }) => l.status === 'born' || l.status === 'delivered').length, label: 'Camadas' },
    { value: breedNames.length, label: breedNames.length === 1 ? 'Raza' : 'Razas' },
  ].filter(s => s.value > 0)

  // Tagline = primeros 180 chars de la descripción (sin cortar palabras feas)
  const tagline = kennel.description
    ? (kennel.description.length > 180
        ? kennel.description.slice(0, 180).trimEnd().replace(/[,;:.\s]+$/, '') + '…'
        : kennel.description)
    : null

  // Mostrar CTA "Contactar" funcional solo si el kennel tiene owner real.
  // Si está sin reclamar (importado), el claim banner ya guía al user.
  const hasOwner = !!kennel.owner_id

  return (
    <div className="space-y-8 sm:space-y-12">
      <KennelJsonLd
        name={kennel.name}
        url={canonicalUrl}
        description={kennel.description}
        logoUrl={kennel.logo_url}
        city={kennel.city}
        country={kennel.country}
        foundationDate={kennel.foundation_date}
        website={kennel.website}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: 'https://genealogic.io' },
          { name: 'Criaderos', url: 'https://genealogic.io/kennels' },
          { name: kennel.name, url: canonicalUrl },
        ]}
      />
      <PageTracker kennelId={kennel.id} />

      {!kennel.owner_id && (
        <ClaimBanner type="kennel" targetId={kennel.slug || kennel.id} targetName={kennel.name} />
      )}

      {/* Back + CTA web custom (si existe — Irema lo tiene) */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={isOwner ? '/kennel' : '/kennels'}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        {hasCustomWeb && (
          <Link
            href={`/c/${kennel.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            <Sparkles className="h-3.5 w-3.5" /> Ver web del criadero
          </Link>
        )}
      </div>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-orange-50/60 via-canvas to-blue-50/60">
        {/* Glow decorativo en esquina sup-derecha (palette marca) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full blur-3xl opacity-50"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(254,102,32,0.35) 0%, rgba(254,102,32,0.1) 40%, transparent 70%)',
          }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12">

          {/* Izquierda — identidad + tagline + CTAs */}
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                {kennel.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={kennel.logo_url} alt={kennel.name} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: pastelByName(kennel.name) }}
                  >
                    <span className="text-3xl sm:text-4xl font-semibold text-white">{kennel.name[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                    Criadero
                  </span>
                  {hasOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <BadgeCheck className="h-3 w-3" /> Verificado
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-[30px] sm:text-[40px] lg:text-[44px] font-semibold leading-[1.05] tracking-[-0.04em] text-ink break-words">
                  {kennel.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
                  {location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {location}</span>
                  )}
                  {foundationYear && (
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Desde {foundationYear}</span>
                  )}
                </div>
              </div>
            </div>

            {tagline && (
              <p className="text-[15.5px] sm:text-[17px] text-body leading-[1.55] max-w-prose">
                {tagline}
              </p>
            )}

            {breedNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {breedNames.slice(0, 5).map(b => (
                  <span key={b} className="inline-flex items-center rounded-full bg-canvas border border-hairline px-2.5 py-1 text-[11.5px] font-medium text-body">
                    {b}
                  </span>
                ))}
                {breedNames.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 text-[11.5px] text-muted">
                    +{breedNames.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* CTAs primarios */}
            <div className="flex flex-wrap gap-2 pt-1">
              {hasOwner ? (
                <ContactKennelButton
                  kennelId={kennel.id}
                  kennelName={kennel.name}
                  config={kennel.contact_form_config || null}
                />
              ) : null}
              <Link
                href="#perros"
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-4 py-2.5 text-[13px] font-bold hover:border-ink/30 transition"
              >
                Ver perros
              </Link>
              {kennel.social_instagram && (
                <a
                  href={kennel.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/70 backdrop-blur-sm text-body px-3 py-2.5 text-[12.5px] font-semibold hover:border-ink/30 hover:text-ink transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {kennel.website && (
                <a
                  href={kennel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/70 backdrop-blur-sm text-body px-3 py-2.5 text-[12.5px] font-semibold hover:border-ink/30 hover:text-ink transition"
                >
                  <Globe className="h-3.5 w-3.5" /> Web
                </a>
              )}
            </div>
          </div>

          {/* Derecha — card de stats */}
          {stats.length > 0 && (
            <aside className="rounded-2xl bg-canvas/80 backdrop-blur-md border border-hairline p-5 sm:p-6 self-start w-full">
              <div className="flex items-center gap-1.5 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-[#FE6620]" />
                <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink">El criadero en números</p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {stats.map(s => (
                  <div key={s.label} className="min-w-0">
                    <p className="text-[24px] sm:text-[28px] font-semibold tabular-nums tracking-[-0.03em] text-ink leading-none">
                      {s.value.toLocaleString('es-ES')}
                    </p>
                    <p className="mt-1.5 text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ═══ NUESTROS PERROS — anchor #perros ═══ */}
      <section id="perros" className="scroll-mt-24">
        <div className="mb-5 sm:mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Catálogo</p>
          <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
            Nuestros perros
          </h2>
        </div>
        <KennelPublicTabs
          kennelName={kennel.name}
          reproductores={reproductores}
          forSale={forSale}
          litters={litters}
          criados={criados}
          currencySymbol={currencySymbol}
        />
      </section>

      {/* ═══ CONTACTO — siempre al final si hay owner ═══ */}
      {hasOwner && (
        <section className="rounded-2xl border border-hairline bg-canvas p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.6fr] gap-5 sm:gap-8 items-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Hablemos</p>
              <h2 className="mt-1 text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-ink">
                ¿Te interesa una camada o un perro?
              </h2>
              <p className="mt-2 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-prose">
                Escríbenos por el formulario y te respondemos en breve. Sin compromiso.
              </p>
            </div>
            <div className="flex sm:justify-end">
              <ContactKennelButton
                kennelId={kennel.id}
                kennelName={kennel.name}
                config={kennel.contact_form_config || null}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
