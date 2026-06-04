import { createClient } from '@/lib/supabase/server'
import DogsPageClient from '@/components/dogs/dogs-page-client'
import { sortDogsPhotoFirst } from '@/lib/dogs/sort'

export default async function DogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Detectar si el usuario es criador (tiene kennel) para mostrar tabs avanzados
  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user!.id)
    .limit(1)
  const myKennelId = kennelArr?.[0]?.id || null
  const isBreeder = !!myKennelId

  // Traer perros donde el usuario es owner OR breeder OR el kennel del perro es el suyo.
  // Esto cubre: 'Todos' (owner), 'Criados por mí' (breeder o kennel_id),
  // y perros históricos sin owner pero con breeder/kennel.
  const orFilters = [`owner_id.eq.${user!.id}`, `breeder_id.eq.${user!.id}`]
  if (myKennelId) orFilters.push(`kennel_id.eq.${myKennelId}`)

  const [dogsRes, breedsRes, importsRes] = await Promise.all([
    supabase
      .from('dogs')
      .select(`
        id, slug, name, sex, birth_date, thumbnail_url, original_thumbnail_url, thumbnail_upscaled_at, breed_id,
        is_reproductive, is_for_sale, show_in_kennel, breeder_id, kennel_id, created_at, updated_at,
        breed:breeds(name),
        color:colors(name),
        kennel:kennels(id, name, logo_url)
      `)
      .or(orFilters.join(','))
      .order('created_at', { ascending: false }),
    supabase.from('breeds').select('id, name').order('name'),
    // Historial de importaciones (notifications type='import'). message = JSON
    // { importId, createdIds, mainDogId }. Para la tab "Mis importaciones".
    supabase
      .from('notifications')
      .select('id, title, message, created_at')
      .eq('user_id', user!.id)
      .eq('type', 'import')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const imports = (importsRes.data || []).map((n: { id: string; title: string | null; message: string; created_at: string }) => {
    let p: { importId?: string; createdIds?: string[]; mainDogId?: string } = {}
    try { p = JSON.parse(n.message) } catch {}
    return {
      id: n.id,
      importId: p.importId || null,
      mainDogId: p.mainDogId || null,
      count: Array.isArray(p.createdIds) ? p.createdIds.length : 0,
      name: typeof n.title === 'string' ? n.title.replace(/^Genealogía importada:\s*/i, '') : '',
      createdAt: n.created_at,
    }
  }).filter((i) => i.importId)

  return (
    <div>
      <DogsPageClient
        dogs={sortDogsPhotoFirst(dogsRes.data || [])}
        breeds={breedsRes.data || []}
        userId={user!.id}
        isBreeder={isBreeder}
        myKennelId={myKennelId}
        imports={imports}
      />
    </div>
  )
}
