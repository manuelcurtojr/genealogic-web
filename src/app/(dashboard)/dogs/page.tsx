import { createClient } from '@/lib/supabase/server'
import DogsPageClient from '@/components/dogs/dogs-page-client'

export default async function DogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [dogsRes, breedsRes, favoritesRes] = await Promise.all([
    supabase
      .from('dogs')
      .select(`
        id, name, sex, birth_date, thumbnail_url, breed_id,
        breed:breeds(name),
        color:colors(name)
      `)
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('breeds')
      .select('id, name')
      .order('name'),
    supabase
      .from('favorites')
      .select('dog_id')
      .eq('user_id', user!.id),
  ])

  const dogs = dogsRes.data || []
  const breeds = breedsRes.data || []
  const favoriteDogIds = (favoritesRes.data || []).map((f: any) => f.dog_id)

  return (
    <div>
      <DogsPageClient
        dogs={dogs}
        breeds={breeds}
        favoriteDogIds={favoriteDogIds}
        userId={user!.id}
      />
    </div>
  )
}
