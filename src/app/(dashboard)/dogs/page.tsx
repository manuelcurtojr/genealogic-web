import { createClient } from '@/lib/supabase/server'
import DogsPageClient from '@/components/dogs/dogs-page-client'

export default async function DogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [dogsRes, breedsRes] = await Promise.all([
    supabase
      .from('dogs')
      .select(`
        id, slug, name, sex, birth_date, thumbnail_url, breed_id, is_verified, created_at, updated_at,
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
      />
    </div>
  )
}
