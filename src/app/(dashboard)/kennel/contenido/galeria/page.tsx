import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PhotosManager from '@/components/kennel/photos-manager'

export const dynamic = 'force-dynamic'

export default async function KennelGaleriaEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!kennel) redirect('/kennel/new')

  const { data: photos } = await supabase
    .from('kennel_photos')
    .select('id, url, caption, position')
    .eq('kennel_id', kennel.id)
    .eq('kind', 'gallery')
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-ink">Galería</h2>
        <p className="mt-1 text-[12.5px] text-muted max-w-prose">
          Fotos generales del criadero: perros, eventos, familias con sus cachorros, momentos especiales.
          Mínimo 3 fotos para que la página sea pública.
        </p>
      </div>
      <PhotosManager
        kennelId={kennel.id}
        kind="gallery"
        photos={photos || []}
        minToPublish={3}
      />
    </div>
  )
}
