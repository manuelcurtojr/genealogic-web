import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { isUUID } from '@/lib/slug'
import KennelPublicTabs from '@/components/kennel/kennel-public-tabs'
import KennelProfileHero from '@/components/kennel/profile-hero'
import {
  KennelAbout, KennelAwards, KennelBlog, KennelFAQ,
  KennelGalleryPlaceholder, KennelFacilitiesPlaceholder, KennelContact,
} from '@/components/kennel/profile-sections'
import PageTracker from '@/components/track/page-tracker'
import ClaimBanner from '@/components/admin-requests/claim-banner'
import { sortDogsPhotoFirst } from '@/lib/dogs/sort'
import { KennelJsonLd, BreadcrumbJsonLd } from '@/lib/seo/json-ld'
import { isSectionEnabled, ALL_SECTION_IDS, type SectionId } from '@/lib/kennel/sections'
import type { Metadata } from 'next'

/**
 * Perfil público de criadero (/kennels/[slug]).
 *
 * Filosofía: el perfil ES la web del criadero. Cada sección extra (awards,
 * blog, galería, faq, instalaciones) se activa desde el panel admin y se
 * autorellena desde tablas canónicas. Cero builders, cero HTML manual.
 *
 * Para Irema (enterprise): todas las secciones extra están on. Para los
 * demás criaderos, el toggle aparece pero deshabilitado con badge
 * "Próximamente" hasta que Kennel Pro abra públicamente.
 *
 * La web custom (/c/[slug]) sigue existiendo y funcionando — quien tenga
 * `default_public_view='custom_web'` se redirige allí como antes.
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

  // Mismo flujo de redirect a web custom que antes — sin tocar nada
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
  // Cargamos en paralelo: perros, camadas, awards públicos, posts publicados,
  // FAQ activas, razas. Algunas queries solo importan si su sección está on,
  // pero al ser counts/short selects no merece la pena gating.
  const [allDogsRes, allLittersRes, awardsRes, postsRes, faqRes, breedsRes, customPageRes] = await Promise.all([
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
    // Awards: solo los is_public de perros de este criadero
    supabase
      .from('awards')
      .select('id, award_type, event_name, date, judge, notes, is_public, dog:dogs!awards_dog_id_fkey(id, name, slug, kennel_id)')
      .eq('is_public', true)
      .order('date', { ascending: false })
      .limit(20),
    supabase
      .from('kennel_posts')
      .select('id, slug, title, excerpt, cover_image_url, published_at, reading_time_minutes, category_slug')
      .eq('kennel_id', kennel.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('knowledge_entries')
      .select('id, title, content, category, position')
      .eq('kennel_id', kennel.id)
      .eq('is_active', true)
      .order('position', { ascending: true })
      .limit(20),
    // Resolver nombres de razas que cría
    kennel.breed_ids && kennel.breed_ids.length > 0
      ? supabase.from('breeds').select('id, name').in('id', kennel.breed_ids)
      : Promise.resolve({ data: [] }),
    // Custom web indicator (para mostrar CTA "Ver web" en owner view)
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
  // Filtramos awards a perros de este kennel (el join no permite where por
  // FK indirecta; se filtra en memoria — son pocas filas).
  // PostgREST devuelve el join `dog:dogs!fk(...)` como objeto cuando es
  // a-one-row, pero el cliente TypeScript a veces lo infiere como array.
  // Normalizamos a objeto plano para alimentar el componente.
  const allAwards = (awardsRes.data || [])
    .map((row: Record<string, unknown>) => {
      const dogRel = row.dog as unknown
      const dog = Array.isArray(dogRel) ? dogRel[0] : dogRel
      return { ...row, dog: dog || null }
    })
    .filter((a: Record<string, unknown>) => {
      const dog = a.dog as { kennel_id?: string } | null
      return dog && dog.kennel_id === kennel.id
    }) as Array<{
      id: string
      award_type: string | null
      event_name: string | null
      date: string | null
      judge: string | null
      notes: string | null
      is_public: boolean | null
      dog: { id: string; name: string; slug: string | null } | null
    }>
  const posts = postsRes.data || []
  const faqEntries = faqRes.data || []
  const breedNames = (breedsRes.data || []).map((b: { name: string }) => b.name)
  const hasCustomWeb = !!customPageRes.data && !!kennel.slug

  // Foto primero — nunca cajas vacías en el primer pantallazo
  const dogs = sortDogsPhotoFirst(allDogs)
  const litters = allLitters
  const forSale = dogs.filter((d: { is_for_sale: boolean | null }) => d.is_for_sale)
  const reproductores = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => d.is_reproductive && !d.is_for_sale)
  const criados = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => !d.is_reproductive && !d.is_for_sale)

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }
  const canonicalUrl = `https://genealogic.io/kennels/${kennel.slug || id}`
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null

  // ─── Secciones extra: enabled + autoshow si hay datos ──────────────
  // Si una sección está enabled pero su tabla está vacía, igual la
  // ocultamos (cada componente devuelve null si no hay datos relevantes).
  // Para sections placeholder (gallery/facilities) la mostramos como
  // "Coming soon" solo si está enabled — refuerza la promesa al visitante.
  const enabled = kennel.enabled_sections || {}
  const isEnabled = (id: SectionId) => isSectionEnabled(enabled, id)

  const enabledSectionIds: string[] = ALL_SECTION_IDS.filter(id => {
    if (!isEnabled(id)) return false
    // Solo añadir al nav del hero si la sección tendrá contenido para
    // mostrar o es un placeholder informativo válido.
    if (id === 'awards')     return allAwards.length > 0
    if (id === 'blog')       return posts.length > 0
    if (id === 'faq')        return faqEntries.length > 0
    if (id === 'gallery')    return true
    if (id === 'facilities') return true
    return false
  })

  // Stats para el hero
  const stats = [
    { value: dogs.length, label: 'Perros' },
    { value: litters.filter((l: { status: string }) => l.status === 'born' || l.status === 'delivered').length, label: 'Camadas' },
    { value: breedNames.length, label: 'Razas' },
    ...(allAwards.length > 0 ? [{ value: allAwards.length, label: 'Logros' }] : []),
  ].slice(0, 4)

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

      {/* Claim banner si el criadero no tiene owner asignado */}
      {!kennel.owner_id && (
        <ClaimBanner type="kennel" targetId={kennel.slug || kennel.id} targetName={kennel.name} />
      )}

      {/* Back + CTA web personalizada (solo si existe) */}
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

      {/* HERO — el "presenta" del perfil */}
      <KennelProfileHero
        kennelId={kennel.id}
        kennelName={kennel.name}
        logoUrl={kennel.logo_url}
        description={kennel.description}
        location={location}
        foundationYear={foundationYear}
        topBreeds={breedNames}
        stats={stats}
        verified={!!kennel.owner_id}
        perrosAnchor="#perros"
        contactFormConfig={kennel.contact_form_config}
        enabledSectionIds={enabledSectionIds}
      />

      {/* SOBRE EL CRIADERO — siempre */}
      <KennelAbout
        description={kennel.description}
        breedNames={breedNames}
        socials={{
          instagram: kennel.social_instagram,
          facebook: kennel.social_facebook,
          youtube: kennel.social_youtube,
          tiktok: kennel.social_tiktok,
          website: kennel.website,
          whatsapp: kennel.whatsapp_enabled ? kennel.whatsapp_phone : null,
        }}
      />

      {/* NUESTROS PERROS — siempre */}
      <section id="perros" className="scroll-mt-24">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Catálogo</p>
          <h2 className="mt-1.5 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">
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

      {/* AWARDS — toggleable */}
      {isEnabled('awards') && <KennelAwards awards={allAwards} />}

      {/* GALLERY — toggleable (placeholder hasta tener tabla kennel_photos) */}
      {isEnabled('gallery') && <KennelGalleryPlaceholder />}

      {/* FACILITIES — toggleable (placeholder) */}
      {isEnabled('facilities') && <KennelFacilitiesPlaceholder />}

      {/* BLOG — toggleable */}
      {isEnabled('blog') && kennel.slug && <KennelBlog posts={posts} kennelSlug={kennel.slug} />}

      {/* FAQ — toggleable */}
      {isEnabled('faq') && <KennelFAQ entries={faqEntries} />}

      {/* CONTACTO — siempre, al final */}
      <KennelContact
        kennelId={kennel.id}
        kennelName={kennel.name}
        location={location}
        foundationYear={foundationYear}
        contactFormConfig={kennel.contact_form_config}
      />
    </div>
  )
}
