import { createClient } from '@/lib/supabase/server'
import { loadProPage, pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'

export const dynamic = 'force-dynamic'

export default async function KennelGaleriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Carga el kennel primero (sin gate de content) para poder hacer la query de
  // fotos. Luego comprobamos manualmente si pasa los gates.
  const supabase = await createClient()

  // Esta llamada hace todos los gates excepto el de content (que necesita
  // counts). Si pasa, ya hicimos auth + slug canonical + Pro check.
  const { kennel, isOwner } = await loadProPage({
    kennelId: id,
    pageId: 'galeria',
    contentChecker: async () => {
      const { data } = await supabase
        .from('kennel_photos')
        .select('id', { count: 'exact', head: false })
        .eq('kennel_id', id) // id puede ser slug aquí — la query no rompe
      return { galleryCount: (data || []).length }
    },
  })

  const { data: photos } = await supabase
    .from('kennel_photos')
    .select('id, url, caption, position')
    .eq('kennel_id', kennel.id)
    .eq('kind', 'gallery')
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const list = photos || []
  const hasEnough = list.length >= 3

  return (
    <ProPageShell
      eyebrow="Imágenes"
      title="Galería"
      description={list.length > 0 ? undefined : 'Próximamente.'}
    >
      {isOwner && !hasEnough && (
        <OwnerDraftBanner
          message={pageNotYetPublicMessage('galeria')}
          ctaHref="/kennel/edit"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {list.map(p => (
            <figure key={p.id} className="group overflow-hidden rounded-2xl border border-hairline bg-canvas">
              <div className="aspect-square overflow-hidden bg-surface-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
              </div>
              {p.caption && (
                <figcaption className="px-3 py-2 text-[11.5px] text-muted truncate">{p.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </ProPageShell>
  )
}
