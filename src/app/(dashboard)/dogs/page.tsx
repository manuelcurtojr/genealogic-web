import { createClient } from '@/lib/supabase/server'
import DogsPageClient from '@/components/dogs/dogs-page-client'

export default async function DogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [dogsRes, breedsRes, colorsRes, kennelsRes, maleDogsRes, femaleDogsRes] = await Promise.all([
    supabase
      .from('dogs')
      .select(`
        id, name, sex, birth_date, thumbnail_url, breed_id,
        breed:breeds(name),
        color:colors(name),
        kennel:kennels(id, name, logo_url)
      `)
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('colors').select('id, name').order('name'),
    supabase.from('kennels').select('id, name').eq('owner_id', user!.id).order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user!.id).eq('sex', 'male').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user!.id).eq('sex', 'female').order('name'),
  ])

  return (
    <div>
      <DogsPageClient
        dogs={dogsRes.data || []}
        breeds={breedsRes.data || []}
        colors={colorsRes.data || []}
        kennels={kennelsRes.data || []}
        maleDogs={maleDogsRes.data || []}
        femaleDogs={femaleDogsRes.data || []}
        userId={user!.id}
      />
    </div>
  )
}
