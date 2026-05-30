import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan, isExtraPageEnabled, hasPublishableContent } from '@/lib/kennel/pro-web'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'
import { pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import AboutContent from '@/components/kennel/about-content'
import AboutHero from '@/components/kennel/about-hero'
import AboutGallery from '@/components/kennel/about-gallery'
import AboutTeam from '@/components/kennel/about-team'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('name, slug, city, country, foundation_date')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) return { title: 'No encontrado' }
  const loc = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const year = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null
  const title = `Sobre ${kennel.name}`
  const description = `La historia de ${kennel.name}${loc ? ` en ${loc}` : ''}${year ? `, desde ${year}` : ''}: quiénes somos, desde cuándo criamos y qué nos diferencia.`
  const canonical = `https://genealogic.io/kennels/${kennel.slug}/sobre`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', locale: 'es_ES' },
  }
}

/**
 * /kennels/[slug]/sobre — "Sobre nosotros".
 *
 * Estructura editorial:
 *  1. Hero rico (foto + chips: año fundación, ubicación, raza, hitos)
 *  2. Texto / Timeline (about_md parseado por AboutContent — si tiene
 *     hitos `**YYYY · ...**` los pinta como línea del tiempo)
 *  3. Galería integrada (3-4 fotos del kennel: gallery + facilities)
 *  4. Equipo (founder con foto si el owner tiene avatar)
 *
 * Las gates se hacen aquí inline (no via loadProPage) porque el checker
 * de contenido necesita kennel.about_md y resolver la referencia circular
 * con un callback genera TDZ.
 */
export default async function KennelSobrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id, name, about_md, logo_url, foundation_date, city, country, enabled_pages')
    .eq(field, id)
    .single()
  if (!kennel) notFound()

  // Slug canonical
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}/sobre`)
  }

  // Plan del dueño
  let ownerPlan: string | null = null
  let ownerProfile: { display_name: string | null; avatar_url: string | null; bio: string | null } | null = null
  if (kennel.owner_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, display_name, avatar_url, bio')
      .eq('id', kennel.owner_id)
      .single()
    ownerPlan = profile?.plan || null
    if (profile) {
      ownerProfile = {
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        bio: profile.bio || null,
      }
    }
  }
  const isPro = isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })
  if (!isPro) {
    redirect(`/kennels/${kennel.slug || kennel.id}`)
  }

  const isOwner = user?.id === kennel.owner_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabled = isExtraPageEnabled(kennel.enabled_pages as any, 'sobre')
  if (!enabled && !isOwner) notFound()

  const hasContent = hasPublishableContent({ page: 'sobre', aboutMd: kennel.about_md })
  if (!hasContent && !isOwner) notFound()

  // ─── Datos enriquecedores cargados en paralelo ────────────────────────
  // Sólo necesitamos algunos del lado público — el resto es decoración.
  const [photosRes, breedsRes] = await Promise.all([
    supabase
      .from('kennel_photos')
      .select('id, image_url, caption, kind')
      .eq('kennel_id', kennel.id)
      .in('kind', ['gallery', 'facilities'])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('kennel_breeds')
      .select('breed:breeds(name)')
      .eq('kennel_id', kennel.id),
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryPhotos = ((photosRes.data || []) as any[]).map(p => ({
    id: p.id as string,
    url: p.image_url as string,
    caption: (p.caption as string | null) || null,
    kind: p.kind as 'gallery' | 'facilities',
  }))
  const breedNames = (breedsRes.data || []).map((b: { breed: { name: string }[] | { name: string } | null }) => {
    const br = Array.isArray(b.breed) ? b.breed[0] : b.breed
    return br?.name
  }).filter(Boolean) as string[]

  // Conteo de hitos en about_md para chip del hero
  const milestoneMatches = (kennel.about_md || '').match(/^\*\*\d{4}/gm) || []
  const milestoneCount = milestoneMatches.length

  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const foundationYear = kennel.foundation_date ? new Date(kennel.foundation_date).getFullYear() : null

  return (
    <ProPageShell eyebrow="Quiénes somos" title={`Sobre ${kennel.name}`}>
      {isOwner && (!enabled || !hasContent) && (
        <OwnerDraftBanner
          message={!enabled
            ? 'Activa la página "Sobre nosotros" desde Mi criadero para que sea pública.'
            : pageNotYetPublicMessage('sobre')}
          ctaHref="/kennel/contenido/sobre"
          ctaLabel="Editar contenido"
        />
      )}

      {/* Hero editorial — foto/logo + chips contextuales. Solo si hay algún
          dato relevante; si todo es null se renderiza vacío y no aporta. */}
      {(kennel.logo_url || foundationYear || location || breedNames.length > 0) && (
        <AboutHero
          kennelName={kennel.name}
          logoUrl={kennel.logo_url}
          foundationYear={foundationYear}
          location={location}
          breedNames={breedNames}
          milestoneCount={milestoneCount}
        />
      )}

      {kennel.about_md ? (
        <AboutContent markdown={kennel.about_md} />
      ) : isOwner ? (
        <EmptyContentState
          title="Cuenta tu historia"
          description='Escribe la historia del criadero, vuestra filosofía y qué os distingue. Se edita desde "Mi criadero → Editar contenido".'
        />
      ) : (
        <EmptyContentState
          title="Próximamente"
          description={`Más información sobre ${kennel.name} estará disponible muy pronto.`}
        />
      )}

      {/* Galería integrada (solo si hay >= 2 fotos) */}
      {galleryPhotos.length >= 2 && (
        <AboutGallery photos={galleryPhotos} kennelName={kennel.name} kennelSlug={kennel.slug || kennel.id} />
      )}

      {/* Equipo — sólo si el owner tiene un nombre de PERSONA real, distinto
          del nombre del criadero. Si display_name coincide con el kennel
          (caso del que no rellenó su nombre), mostrar "Fundador · X / X" es
          redundante y da imagen de web sin terminar → no se renderiza. */}
      {ownerProfile?.display_name &&
        ownerProfile.display_name.trim().toLowerCase() !== kennel.name.trim().toLowerCase() && (
        <AboutTeam owner={ownerProfile} kennelName={kennel.name} />
      )}
    </ProPageShell>
  )
}
