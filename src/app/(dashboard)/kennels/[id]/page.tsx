import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Calendar, ExternalLink, Sparkles } from 'lucide-react'
import { isUUID } from '@/lib/slug'
import { pastelByName } from '@/lib/avatars'
import KennelPublicTabs from '@/components/kennel/kennel-public-tabs'
import PageTracker from '@/components/track/page-tracker'
import ContactKennelButton from '@/components/kennel/contact-kennel-button'
import ClaimBanner from '@/components/admin-requests/claim-banner'
import { sortDogsPhotoFirst } from '@/lib/dogs/sort'
import { KennelJsonLd, BreadcrumbJsonLd } from '@/lib/seo/json-ld'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase.from('kennels').select('name, slug, logo_url, description, country, city').eq(field, id).single()
  if (!kennel) return { title: 'Criadero no encontrado — Genealogic' }

  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const description = kennel.description?.substring(0, 160) || `Criadero ${kennel.name}${location ? ' en ' + location : ''} | Genealogic`
  const image = kennel.logo_url || 'https://genealogic.io/icon.svg'
  const canonical = `https://genealogic.io/kennels/${kennel.slug || id}`

  return {
    title: `${kennel.name} — Criadero | Genealogic`,
    description,
    alternates: { canonical },
    openGraph: { title: kennel.name, description, url: canonical, images: [{ url: image, alt: kennel.name }], type: 'website', siteName: 'Genealogic' },
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

  // 301 canónica UUID → slug (SEO + URLs limpias)
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}`)
  }

  // ¿El criador prefiere redirigir a su web personalizada?
  // - Solo si tiene default_public_view='custom_web'
  // - Solo si hay web publicada (kennel_pages home enabled)
  // - El owner ve siempre el estándar (para gestionar) UNLESS force=custom
  // - Visitantes pueden hacer bypass con ?force=standard
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

  const { data: allDogs } = await supabase
    .from('dogs')
    .select('id, slug, name, sex, thumbnail_url, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, breed:breeds(name)')
    .eq('kennel_id', kennel.id)
    .or('show_in_kennel.is.null,show_in_kennel.eq.true')
    .order('name')

  const { data: allLitters } = await supabase
    .from('litters')
    .select('id, status, birth_date, mating_date, breed:breeds(name), father:dogs!litters_father_id_fkey(id, name, thumbnail_url), mother:dogs!litters_mother_id_fkey(id, name, thumbnail_url)')
    .eq('owner_id', kennel.owner_id)
    .eq('show_in_kennel', true)
    .order('created_at', { ascending: false })

  // ¿Tiene este criadero una web personalizada publicada con el builder de Genealogic?
  const { data: customPage } = await supabase
    .from('kennel_pages')
    .select('id')
    .eq('kennel_id', kennel.id)
    .eq('slug', 'home')
    .eq('enabled', true)
    .maybeSingle()
  const hasCustomWeb = !!customPage && !!kennel.slug

  // Foto primero — nunca cajas vacías en el primer pantallazo
  const dogs = sortDogsPhotoFirst(allDogs || [])
  const litters = allLitters || []
  const forSale = dogs.filter((d: any) => d.is_for_sale)
  const reproductores = dogs.filter((d: any) => d.is_reproductive && !d.is_for_sale)
  const criados = dogs.filter((d: any) => !d.is_reproductive && !d.is_for_sale)

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }

  const canonicalUrl = `https://genealogic.io/kennels/${kennel.slug || id}`
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-8">
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

      {/* Claim banner — solo si el criadero no tiene owner (típicamente importado) */}
      {!kennel.owner_id && (
        <ClaimBanner type="kennel" targetId={kennel.slug || kennel.id} targetName={kennel.name} />
      )}

      {/* Back button + CTA web personalizada (si existe) */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={user?.id === kennel.owner_id ? '/kennel' : '/kennels'}
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

      {/* Kennel header — Cal clean card */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
            {kennel.logo_url ? (
              <img src={kennel.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: pastelByName(kennel.name) }}
              >
                <span className="text-4xl font-semibold text-white">{kennel.name[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">Criadero</p>
            <h1 className="mt-1 text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
              {kennel.name}
            </h1>
            {kennel.description && (
              <p className="mt-2 max-w-prose text-[14px] text-body line-clamp-3">{kennel.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {kennel.foundation_date && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                  <Calendar className="h-3.5 w-3.5" /> Fundado en {new Date(kennel.foundation_date).getFullYear()}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">📍 {location}</span>
              )}
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <Globe className="h-3.5 w-3.5" /> Web
                </a>
              )}
              {kennel.social_instagram && (
                <a href={kennel.social_instagram} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <ExternalLink className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {kennel.social_facebook && (
                <a href={kennel.social_facebook} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] text-body transition-colors hover:text-ink">
                  <ExternalLink className="h-3.5 w-3.5" /> Facebook
                </a>
              )}
              <ContactKennelButton kennelId={kennel.id} kennelName={kennel.name} config={kennel.contact_form_config || null} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Cal — Reproductores / En venta / Camadas / Producido */}
      <KennelPublicTabs
        kennelName={kennel.name}
        reproductores={reproductores}
        forSale={forSale}
        litters={litters}
        criados={criados}
        currencySymbol={currencySymbol}
      />
    </div>
  )
}
