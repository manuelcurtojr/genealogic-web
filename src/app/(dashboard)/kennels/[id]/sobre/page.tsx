import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan, isExtraPageEnabled, hasPublishableContent } from '@/lib/kennel/pro-web'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'
import { pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import AboutContent from '@/components/kennel/about-content'

export const dynamic = 'force-dynamic'

/**
 * /kennels/[slug]/sobre — Sobre nosotros.
 *
 * Hace todas las gates aquí en vez de via loadProPage porque el checker de
 * contenido necesita kennel.about_md, y resolver la referencia circular con
 * un callback genera TDZ en JS (kennel se usa dentro del callback antes de
 * estar asignada). Más limpio inline.
 */
export default async function KennelSobrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id, name, about_md, enabled_pages')
    .eq(field, id)
    .single()
  if (!kennel) notFound()

  // Slug canonical
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}/sobre`)
  }

  // Plan del dueño
  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', kennel.owner_id)
      .single()
    ownerPlan = profile?.plan || null
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
    </ProPageShell>
  )
}
