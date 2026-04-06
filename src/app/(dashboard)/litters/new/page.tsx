import { createClient } from '@/lib/supabase/server'
import LitterForm from '@/components/litters/litter-form'

export default async function NewLitterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [breedsRes, maleDogsRes, femaleDogsRes] = await Promise.all([
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'male').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'female').order('name'),
  ])

  return (
    <LitterForm
      breeds={breedsRes.data || []}
      maleDogs={maleDogsRes.data || []}
      femaleDogs={femaleDogsRes.data || []}
      userId={user.id}
    />
  )
}
