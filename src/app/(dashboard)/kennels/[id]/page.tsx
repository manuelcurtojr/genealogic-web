import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Calendar, MapPin, ExternalLink, Sparkles, BadgeCheck } from 'lucide-react'
import { isUUID } from '@/lib/slug'
import { pastelByName } from '@/lib/avatars'
import KennelPublicTabs from '@/components/kennel/kennel-public-tabs'
import KennelProHome from '@/components/kennel/pro-home'
import PageTracker from '@/components/track/page-tracker'
import ContactKennelButton from '@/components/kennel/contact-kennel-button'
import ClaimBanner from '@/components/admin-requests/claim-banner'
import { sortDogsByPhotoQuality } from '@/lib/dogs/sort-quality'
import { KennelJsonLd, BreadcrumbJsonLd } from '@/lib/seo/json-ld'
import { isKennelOnProPlan } from '@/lib/kennel/pro-web'
import type { Metadata } from 'next'

/**
 * Home pública del criadero.
 *
 * - Free / Kennel: perfil simple (hero rediseñado + tabs de perros + contacto).
 * - Kennel Pro / enterprise: landing Pro completa (KennelProHome) — el chrome
 *   con menú lo añade el layout superior. Las páginas secundarias (sobre,
 *   instalaciones, galería, blog, contacto, perros) viven en subdirectorios
 *   y comparten ese mismo chrome.
 *
 * /c/[slug] sigue funcionando tal cual — Irema sigue accesible por ambos.
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
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase.from('kennels').select('*').eq(field, id).single()
  if (!kennel) notFound()

  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}`)
  }

  // Nota: anteriormente había un redirect a /c/[slug] cuando el kennel tenía
  // `default_public_view='custom_web'`. Ya no aplica — los criaderos Pro
  // tienen directamente su web vitaminada en /kennels/[slug] (chrome + páginas).
  // /c/[slug] sigue accesible para quien lo enlace directamente, pero NO es
  // la vista por defecto para nadie.
  const isOwner = user?.id === kennel.owner_id

  // ─── Datos comunes ──────────────────────────────────────────────────
  const [allDogsRes, allLittersRes, breedsRes, faqRes, ownerProfileRes, reviewsRes, postsRes] = await Promise.all([
    supabase
      .from('dogs')
      .select('id, slug, name, sex, thumbnail_url, is_reproductive, is_for_sale, sale_price, sale_currency, sale_location, featured_in_home, breed:breeds(name)')
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
    // FAQ pública — todas las entries activas de la biblioteca del Emailbot
    // se muestran (las escribió el criador para que el bot las responda,
    // así que también son contenido público válido)
    supabase
      .from('knowledge_entries')
      .select('id, title, content, category')
      .eq('kennel_id', kennel.id)
      .eq('is_active', true)
      .order('position', { ascending: true })
      .limit(20),
    kennel.owner_id
      ? supabase.from('profiles').select('plan').eq('id', kennel.owner_id).single()
      : Promise.resolve({ data: null }),
    // Reseñas visibles en la home Pro (campos extra para resolver badges)
    supabase
      .from('kennel_reviews')
      .select('id, author_name, body, rating, author_avatar_url, submitted_by_user_id, is_manual')
      .eq('kennel_id', kennel.id)
      .eq('is_visible', true)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(12),
    // Últimos posts del blog para el slider de la home Pro
    supabase
      .from('kennel_posts')
      .select('id, slug, title, excerpt, cover_image_url, published_at, reading_time_minutes')
      .eq('kennel_id', kennel.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
  ])
  const recentPosts = postsRes.data || []

  const allDogs = allDogsRes.data || []
  const allLitters = allLittersRes.data || []
  const breedNames = (breedsRes.data || []).map((b: { name: string }) => b.name)
  const faqEntries = faqRes.data || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviewsRaw = (reviewsRes.data || []) as any[]

  // Resolver badges Cliente / Usuario / null (manual) en una pasada.
  // Cliente = el user que dejó la reseña tiene al menos 1 reservation con
  // este kennel en estado delivered/confirmed.
  const submitterIds = Array.from(new Set(
    reviewsRaw
      .filter(r => !r.is_manual && r.submitted_by_user_id)
      .map(r => r.submitted_by_user_id as string),
  ))
  const clientUserIds = new Set<string>()
  if (submitterIds.length > 0) {
    // En puppy_reservations el "comprador" es owner_id (no client_id).
    // Cualquier estado de reserva activa o cerrada cuenta como cliente
    // (confirmed/paid/delivered).
    const { data: resv } = await supabase
      .from('puppy_reservations')
      .select('owner_id')
      .eq('kennel_id', kennel.id)
      .in('owner_id', submitterIds)
      .in('status', ['delivered', 'confirmed', 'paid', 'paid_in_full'])
    for (const r of (resv || []) as Array<{ owner_id: string }>) {
      if (r.owner_id) clientUserIds.add(r.owner_id)
    }
  }
  const reviews = reviewsRaw.map(r => ({
    id: r.id,
    author_name: r.author_name,
    body: r.body,
    rating: r.rating,
    author_avatar_url: r.author_avatar_url,
    badge: r.is_manual
      ? null
      : (r.submitted_by_user_id && clientUserIds.has(r.submitted_by_user_id) ? 'client' as const : 'user' as const),
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerPlan = (ownerProfileRes.data as any)?.plan || null
  const isPro = isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })

  // Count fotos de galería por perro para ordenar por calidad
  const dogIds = (allDogs as Array<{ id: string }>).map(d => d.id)
  const photoCount: Record<string, number> = {}
  if (dogIds.length > 0) {
    const { data: dphotos } = await supabase
      .from('dog_photos')
      .select('dog_id')
      .in('dog_id', dogIds)
    for (const p of (dphotos || []) as Array<{ dog_id: string }>) {
      photoCount[p.dog_id] = (photoCount[p.dog_id] || 0) + 1
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dogs = sortDogsByPhotoQuality(allDogs as any[], photoCount)
  const litters = allLitters
  const forSale = dogs.filter((d: { is_for_sale: boolean | null }) => d.is_for_sale)
  const reproductores = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => d.is_reproductive && !d.is_for_sale)
  const criados = dogs.filter((d: { is_reproductive: boolean | null; is_for_sale: boolean | null }) => !d.is_reproductive && !d.is_for_sale)

  const currencySymbol: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', MXN: '$', COP: '$', ARS: '$', CLP: '$' }
  const canonicalUrl = `https://genealogic.io/kennels/${kennel.slug || id}`
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null

  // Stats enriquecidos: cada uno con icono, label y sublabel opcional.
  // El primero (yearsActive) es el highlight — sale grande arriba en la
  // card. Los demás van en el grid debajo. Cada stat se filtra si no
  // tiene contenido significativo.
  const yearsActive = foundationYear ? new Date().getFullYear() - foundationYear : 0
  const completedLittersCount = litters.filter((l: { status: string }) => l.status === 'born' || l.status === 'delivered').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const puppiesCount = litters.reduce((sum: number, l: any) => sum + (l.puppy_count || 0), 0)

  type StatItem = {
    icon: 'calendar' | 'dog' | 'baby' | 'sparkles' | 'medal'
    value: string
    label: string
    sublabel?: string
    highlight?: boolean
  }
  const stats: StatItem[] = []
  if (yearsActive >= 1) {
    stats.push({
      icon: 'calendar',
      value: yearsActive >= 50 ? `${yearsActive}+` : String(yearsActive),
      label: yearsActive === 1 ? 'año' : 'años',
      sublabel: `Desde ${foundationYear}`,
      highlight: true,
    })
  }
  if (dogs.length > 0) {
    stats.push({
      icon: 'dog',
      value: dogs.length.toLocaleString('es-ES'),
      label: dogs.length === 1 ? 'Perro' : 'Perros',
      sublabel: 'En la familia',
    })
  }
  if (completedLittersCount > 0) {
    stats.push({
      icon: 'baby',
      value: completedLittersCount.toLocaleString('es-ES'),
      label: completedLittersCount === 1 ? 'Camada' : 'Camadas',
      sublabel: puppiesCount > 0 ? `${puppiesCount.toLocaleString('es-ES')} cachorros` : undefined,
    })
  }
  if (breedNames.length > 0) {
    stats.push({
      icon: 'medal',
      value: breedNames.length === 1 ? breedNames[0] : String(breedNames.length),
      label: breedNames.length === 1 ? 'Raza' : 'Razas',
      sublabel: breedNames.length === 1 ? 'Especialidad' : undefined,
    })
  }

  // Tagline del hero del perfil básico — corta en límite de palabra
  // (sin '…') hasta ~280 chars, o devuelve completo si es corto.
  const tagline = kennel.description ? truncateAtWord(kennel.description, 280) : null
  const hasOwner = !!kennel.owner_id

  // ─── JSON-LD + tracking común ───────────────────────────────────────
  const seo = (
    <>
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
    </>
  )

  // ═══════════════════════════════════════════════════════════════════
  // KENNEL PRO — landing Pro completa
  // ═══════════════════════════════════════════════════════════════════
  if (isPro) {
    // Para perros destacados de la home Pro:
    // 1) Si el criador ha marcado perros con featured_in_home=true, esos son
    //    los que se muestran (en el orden que vinieron del fetch).
    // 2) Si no, fallback al orden automático por calidad de fotos (los 6
    //    primeros del array `dogs` que ya está sorteado).
    type RawDog = {
      id: string; slug: string | null; name: string;
      thumbnail_url: string | null;
      featured_in_home?: boolean;
      breed?: { name?: string } | { name?: string }[] | null
    }
    const all = dogs as RawDog[]
    const manualFeatured = all.filter(d => d.featured_in_home).slice(0, 6)
    const featuredSource = manualFeatured.length > 0
      ? manualFeatured
      : all.filter(d => d.thumbnail_url).slice(0, 6)
    const featured = featuredSource.map(d => {
      const breedRel = d.breed
      const breed = Array.isArray(breedRel) ? breedRel[0] : breedRel
      return {
        id: d.id,
        slug: d.slug,
        name: d.name,
        thumbnail_url: d.thumbnail_url,
        breed: breed || null,
      }
    })

    // ─── Section teasers (3 filas alternadas: Sobre · Perros · Galería) ──
    // Cada fila tiene foto + texto + CTA y solo se renderiza si tiene
    // contenido real disponible. Sustituye al antiguo bloque "Trayectoria
    // en números".
    //
    // Imágenes: cogemos de kennel_photos (kind='gallery' para Sobre y
    // Galería; un perro con foto para Nuestros perros). Sin trampas de
    // imágenes externas, todo del catálogo del propio criadero.
    const { data: kennelPhotos } = await supabase
      .from('kennel_photos')
      .select('id, url, kind')
      .eq('kennel_id', kennel.id)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
      .limit(20)
    const galleryPhotos = (kennelPhotos || []).filter(p => p.kind === 'gallery')
    // Las 3 fotos de los teasers son SIEMPRE perros distintos del criadero
    // (los 3 primeros con foto, que ya están ordenados por calidad). Si hay
    // menos de 3 perros con foto, las filas que no tengan imagen se descartan.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dogsWithPhoto = (dogs as any[]).filter(d => d.thumbnail_url) as Array<{ thumbnail_url: string; name: string }>
    const aboutImage = dogsWithPhoto[0]?.thumbnail_url || kennel.logo_url || null
    const aboutImageAlt = dogsWithPhoto[0]?.name || `${kennel.name} — sobre nosotros`
    const perrosImage = dogsWithPhoto[1]?.thumbnail_url || dogsWithPhoto[0]?.thumbnail_url || null
    const perrosImageAlt = dogsWithPhoto[1]?.name || dogsWithPhoto[0]?.name || 'Nuestros perros'
    const galleryImage = dogsWithPhoto[2]?.thumbnail_url || dogsWithPhoto[0]?.thumbnail_url || null
    const galleryImageAlt = dogsWithPhoto[2]?.name || `${kennel.name} — galería`

    const teasers: Array<{
      id: string
      eyebrow: string
      title: string
      body: string
      ctaLabel: string
      ctaHref: string
      imageUrl: string | null
      imageAlt: string
    }> = []

    // 1) Sobre nosotros (si hay about_md ≥50 chars)
    if (kennel.about_md && kennel.about_md.trim().length >= 50 && aboutImage) {
      teasers.push({
        id: 'sobre',
        eyebrow: 'Quiénes somos',
        title: `${kennel.name}, ${foundationYear ? `desde ${foundationYear}` : 'criadero familiar'}`,
        body: kennel.about_md.split(/\n\n+/)[0].replace(/\*\*([^*]+)\*\*/g, '$1').slice(0, 220).trim(),
        ctaLabel: 'Conoce nuestra historia',
        ctaHref: `/kennels/${kennel.slug}/sobre`,
        imageUrl: aboutImage,
        imageAlt: aboutImageAlt,
      })
    }

    // 2) Nuestros perros (si hay perros con foto)
    if (perrosImage) {
      const breedHint = breedNames[0] ? ` especializado en ${breedNames[0]}` : ''
      teasers.push({
        id: 'perros',
        eyebrow: 'Nuestros perros',
        title: 'Conoce a los protagonistas',
        body: `Catálogo completo de reproductores, cachorros en venta, camadas y producidos por el criadero${breedHint}. Cada perro con su genealogía completa documentada en Genealogic.`,
        ctaLabel: 'Ver todos los perros',
        ctaHref: `/kennels/${kennel.slug}/perros`,
        imageUrl: perrosImage,
        imageAlt: perrosImageAlt,
      })
    }

    // 3) Galería (si la página está enabled y tiene ≥3 fotos)
    const galleryEnabled =
      (kennel.enabled_pages as Record<string, unknown> | null)?.galeria === true
    if (galleryEnabled && galleryImage && galleryPhotos.length >= 3) {
      teasers.push({
        id: 'galeria',
        eyebrow: 'Imágenes',
        title: 'Cinco décadas en imágenes',
        body: `Fotos del día a día del criadero, eventos, familias que ya tienen su cachorro y los perros que han marcado la trayectoria de ${kennel.name}.`,
        ctaLabel: 'Ver galería',
        ctaHref: `/kennels/${kennel.slug}/galeria`,
        imageUrl: galleryImage,
        imageAlt: galleryImageAlt,
      })
    }

    // ─── Disponibilidad (próxima camada + cachorros en venta) ────────
    // Próxima camada: priorizamos status 'mated/confirmed/pending' (en
    // gestación) > 'planned' (planificada) > 'born' (nacida reciente).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lits = allLitters as any[]
    const priority = { mated: 1, confirmed: 1, pending: 1, planned: 2, born: 3, delivered: 99 } as Record<string, number>
    const upcomingLitter = lits
      .filter(l => l.status !== 'delivered')
      .sort((a, b) => (priority[a.status] ?? 50) - (priority[b.status] ?? 50))[0] || null

    const availablePuppiesCount = forSale.length
    const availability = {
      nextLitter: upcomingLitter ? {
        id: upcomingLitter.id as string,
        father: Array.isArray(upcomingLitter.father) ? upcomingLitter.father[0] : upcomingLitter.father,
        mother: Array.isArray(upcomingLitter.mother) ? upcomingLitter.mother[0] : upcomingLitter.mother,
        breedName: (Array.isArray(upcomingLitter.breed) ? upcomingLitter.breed[0]?.name : upcomingLitter.breed?.name) || null,
        expectedDate: upcomingLitter.birth_date || upcomingLitter.mating_date || null,
        status: upcomingLitter.status as string,
      } : null,
      availablePuppiesCount,
    }
    return (
      <div className="space-y-0">
        {seo}
        <KennelProHome
          kennel={{
            id: kennel.id,
            name: kennel.name,
            slug: kennel.slug,
            logo_url: kennel.logo_url,
            description: kennel.description,
            about_md: kennel.about_md,
            hero_image_url: kennel.hero_image_url,
            foundation_date: kennel.foundation_date,
            city: kennel.city,
            country: kennel.country,
            website: kennel.website,
            social_instagram: kennel.social_instagram,
            social_facebook: kennel.social_facebook,
            contact_form_config: kennel.contact_form_config,
            owner_id: kennel.owner_id,
          }}
          featuredDogs={featured}
          faqEntries={faqEntries}
          reviews={reviews}
          recentPosts={recentPosts}
          breedNames={breedNames}
          stats={stats}
          teasers={teasers}
          availability={availability}
        />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════
  // FREE / KENNEL — perfil básico (1 landing)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-8 sm:space-y-12">
      {seo}

      {/* Back nav */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={isOwner ? '/kennel' : '/kennels'}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </div>

      {/* HERO simple */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-orange-50/60 via-canvas to-blue-50/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full blur-3xl opacity-50"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(254,102,32,0.35) 0%, rgba(254,102,32,0.1) 40%, transparent 70%)',
          }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12">
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                {kennel.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={kennel.logo_url} alt={kennel.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: pastelByName(kennel.name) }}>
                    <span className="text-3xl sm:text-4xl font-semibold text-white">{kennel.name[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Criadero</span>
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
                  {location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {location}</span>}
                  {foundationYear && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Desde {foundationYear}</span>}
                </div>
              </div>
            </div>

            {tagline && (
              <p className="text-[15.5px] sm:text-[17px] text-body leading-[1.55] max-w-prose">{tagline}</p>
            )}

            {breedNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {breedNames.slice(0, 5).map(b => (
                  <span key={b} className="inline-flex items-center rounded-full bg-canvas border border-hairline px-2.5 py-1 text-[11.5px] font-medium text-body">
                    {b}
                  </span>
                ))}
                {breedNames.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 text-[11.5px] text-muted">+{breedNames.length - 5}</span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {hasOwner && (
                <ContactKennelButton kennelId={kennel.id} kennelName={kennel.name} config={kennel.contact_form_config || null} />
              )}
              <Link
                href="#perros"
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas text-ink px-4 py-2.5 text-[13px] font-bold hover:border-ink/30 transition"
              >
                Ver perros
              </Link>
              {kennel.social_instagram && (
                <a href={kennel.social_instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/70 backdrop-blur-sm text-body px-3 py-2.5 text-[12.5px] font-semibold hover:border-ink/30 hover:text-ink transition">
                  <ExternalLink className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {kennel.website && (
                <a href={kennel.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-canvas/70 backdrop-blur-sm text-body px-3 py-2.5 text-[12.5px] font-semibold hover:border-ink/30 hover:text-ink transition">
                  <Globe className="h-3.5 w-3.5" /> Web
                </a>
              )}
            </div>
          </div>

          {stats.length > 0 && (
            <aside className="rounded-2xl bg-canvas/80 backdrop-blur-md border border-hairline p-5 sm:p-6 self-start w-full">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#FE6620] mb-3">
                Trayectoria
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {stats.slice(0, 3).map((s: any) => {
                  const isLong = String(s.value).length > 6
                  return (
                    <div key={s.label} className="min-w-0">
                      <p className={`${isLong ? 'text-[15px]' : 'text-[24px] sm:text-[28px] tabular-nums'} font-semibold tracking-[-0.03em] text-ink leading-tight truncate`}>
                        {s.value}
                      </p>
                      <p className="mt-1.5 text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted truncate">{s.label}</p>
                      {s.sublabel && (
                        <p className="mt-0.5 text-[10.5px] text-muted/80 truncate">{s.sublabel}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* NUESTROS PERROS */}
      <section id="perros" className="scroll-mt-24">
        <div className="mb-5 sm:mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Catálogo</p>
          <h2 className="mt-1 text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink">Nuestros perros</h2>
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

      {/* CTA contacto */}
      {hasOwner && (
        <section className="rounded-2xl border border-hairline bg-canvas p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.6fr] gap-5 sm:gap-8 items-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Hablemos</p>
              <h2 className="mt-1 text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-ink">¿Te interesa una camada o un perro?</h2>
              <p className="mt-2 text-[14px] sm:text-[15px] text-body leading-[1.55] max-w-prose">Escríbenos por el formulario y te respondemos en breve. Sin compromiso.</p>
            </div>
            <div className="flex sm:justify-end">
              <ContactKennelButton kennelId={kennel.id} kennelName={kennel.name} config={kennel.contact_form_config || null} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/** Trunca un texto en el último límite de palabra antes de maxChars, sin
 *  añadir "…". Si es más corto que maxChars devuelve el original. */
function truncateAtWord(text: string, maxChars: number): string {
  const t = text.trim()
  if (t.length <= maxChars) return t
  const slice = t.slice(0, maxChars)
  const lastBreak = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'))
  if (lastBreak < maxChars * 0.6) return slice.trimEnd()
  return slice.slice(0, lastBreak).trimEnd()
}
