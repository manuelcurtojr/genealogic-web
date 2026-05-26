import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan, isExtraPageEnabled } from '@/lib/kennel/pro-web'
import { pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'
import KennelPhotosGallery from '@/components/kennel/photos-gallery'

export const dynamic = 'force-dynamic'

export default async function KennelInstalacionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const field = isUUID(id) ? 'id' : 'slug'
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug, owner_id, name, enabled_pages')
    .eq(field, id)
    .single()
  if (!kennel) notFound()
  if (field === 'id' && kennel.slug && kennel.slug !== id) {
    redirect(`/kennels/${kennel.slug}/instalaciones`)
  }

  let ownerPlan: string | null = null
  if (kennel.owner_id) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', kennel.owner_id).single()
    ownerPlan = profile?.plan || null
  }
  const isPro = isKennelOnProPlan({ ownerPlan, ownerUserId: kennel.owner_id })
  if (!isPro) redirect(`/kennels/${kennel.slug || kennel.id}`)

  const isOwner = user?.id === kennel.owner_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabled = isExtraPageEnabled(kennel.enabled_pages as any, 'instalaciones')

  const { data: photos } = await supabase
    .from('kennel_photos')
    .select('id, url, caption, position')
    .eq('kennel_id', kennel.id)
    .eq('kind', 'facilities')
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const list = photos || []
  const hasEnough = list.length >= 3

  if (!isOwner && (!enabled || !hasEnough)) notFound()

  return (
    <ProPageShell
      eyebrow="Dónde viven"
      title="Instalaciones"
      description="Un vistazo a dónde viven, juegan y crecen nuestros perros."
      fullWidth
    >
      {isOwner && (!enabled || !hasEnough) && (
        <OwnerDraftBanner
          message={!enabled
            ? 'Activa la página "Instalaciones" desde Mi criadero para que sea pública.'
            : pageNotYetPublicMessage('instalaciones')}
          ctaHref="/kennel/contenido/instalaciones"
          ctaLabel="Subir fotos"
        />
      )}

      {list.length === 0 ? (
        isOwner ? (
          <EmptyContentState
            title="Aún no has subido fotos"
            description="Sube al menos 3 fotos de tus instalaciones para que esta página se haga pública."
          />
        ) : (
          <EmptyContentState
            title="Próximamente"
            description={`${kennel.name} subirá fotos de sus instalaciones en breve.`}
          />
        )
      ) : (
        <KennelPhotosGallery photos={list} layout="facilities" />
      )}
    </ProPageShell>
  )
}
