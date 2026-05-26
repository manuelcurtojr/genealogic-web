import { createClient } from '@/lib/supabase/server'
import { loadProPage, pageNotYetPublicMessage } from '@/lib/kennel/pro-page-loader'
import { ProPageShell, OwnerDraftBanner, EmptyContentState } from '@/components/kennel/pro-page-shell'

export const dynamic = 'force-dynamic'

export default async function KennelInstalacionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { kennel, isOwner } = await loadProPage({
    kennelId: id,
    pageId: 'instalaciones',
    contentChecker: async () => {
      const { data } = await supabase
        .from('kennel_photos')
        .select('id')
        .eq('kennel_id', id)
        .eq('kind', 'facilities')
      return { facilitiesCount: (data || []).length }
    },
  })

  const { data: photos } = await supabase
    .from('kennel_photos')
    .select('id, url, caption, position')
    .eq('kennel_id', kennel.id)
    .eq('kind', 'facilities')
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const list = photos || []
  const hasEnough = list.length >= 3

  return (
    <ProPageShell
      eyebrow="Dónde viven"
      title="Instalaciones"
      description="Un vistazo a dónde viven, juegan y crecen nuestros perros."
    >
      {isOwner && !hasEnough && (
        <OwnerDraftBanner
          message={pageNotYetPublicMessage('instalaciones')}
          ctaHref="/kennel/edit"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {list.map(p => (
            <figure key={p.id} className="group overflow-hidden rounded-2xl border border-hairline bg-canvas">
              <div className="aspect-[4/3] overflow-hidden bg-surface-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
              </div>
              {p.caption && (
                <figcaption className="px-4 py-3 text-[12.5px] text-body">{p.caption}</figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </ProPageShell>
  )
}
