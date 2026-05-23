import { createClient } from '@/lib/supabase/server'
import DogsPageClient from '@/components/dogs/dogs-page-client'

export default async function DogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Detectar si el usuario es criador (tiene kennel) para mostrar tabs avanzados
  const { data: kennelArr } = await supabase
    .from('kennels')
    .select('id')
    .eq('owner_id', user!.id)
    .limit(1)
  const isBreeder = !!kennelArr?.[0]

  const [dogsRes, breedsRes] = await Promise.all([
    supabase
      .from('dogs')
      .select(`
        id, slug, name, sex, birth_date, thumbnail_url, breed_id,
        is_reproductive, is_for_sale, breeder_id, kennel_id, created_at, updated_at,
        breed:breeds(name),
        color:colors(name),
        kennel:kennels(id, name, logo_url)
      `)
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('breeds').select('id, name').order('name'),
  ])

  return (
    <div>
      <DogsPageClient
        dogs={dogsRes.data || []}
        breeds={breedsRes.data || []}
        userId={user!.id}
        isBreeder={isBreeder}
      />
    </div>
  )
}
