import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { isUUID } from '@/lib/slug'
import { isKennelOnProPlan, isExtraPageEnabled } from '@/lib/kennel/pro-web'
import { pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'
import KennelPhotosGallery from '@/components/kennel/photos-gallery'
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
    .select('name, slug, city, country')
    .eq(field, id)
    .maybeSingle()
  if (!kennel) return { title: 'No encontrado' }
  const loc = [kennel.city, kennel.country].filter(Boolean).join(', ')
  const title = `Galería · ${kennel.name}`
  const description = `Imágenes del día a día de ${kennel.name}${loc ? ` en ${loc}` : ''}: nuestros perros, familias y momentos del criadero.`
  const canonical = `https://genealogic.io/kennels/${kennel.slug}/galeria`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', locale: 'es_ES' },
  }
}

export default async function KennelGaleriaPage({ params }: { params: Promise<{ id: string }> }) {
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
    redirect(`/kennels/${kennel.slug}/galeria`)
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
  const enabled = isExtraPageEnabled(kennel.enabled_pages as any, 'galeria')

  const { data: photos } = await supabase
    .from('kennel_photos')
    .select('id, url, caption, position')
    .eq('kennel_id', kennel.id)
    .eq('kind', 'gallery')
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const list = photos || []
  const hasEnough = list.length >= 3

  if (!isOwner && (!enabled || !hasEnough)) notFound()

  return (
    <ProPageShell eyebrow="Imágenes" title="Galería" fullWidth>
      {isOwner && (!enabled || !hasEnough) && (
        <OwnerDraftBanner
          message={!enabled
            ? 'Activa la página "Galería" desde Mi criadero para que sea pública.'
            : pageNotYetPublicMessage('galeria')}
          ctaHref="/kennel/contenido/galeria"
          ctaLabel="Subir fotos"
        />
      )}

      {list.length === 0 ? (
        isOwner ? (
          <EmptyContentState
            title="Aún no has subido fotos"
            description="Sube al menos 3 fotos para que esta galería se haga pública."
          />
        ) : (
          <EmptyContentState
            title="Próximamente"
            description={`${kennel.name} subirá fotos en breve.`}
          />
        )
      ) : (
        <KennelPhotosGallery photos={list} />
      )}
    </ProPageShell>
  )
}
