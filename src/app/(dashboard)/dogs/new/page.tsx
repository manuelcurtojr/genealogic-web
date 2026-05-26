import { createClient } from '@/lib/supabase/server'
import DogForm from '@/components/dogs/dog-form'
import FeedbackButton from '@/components/feedback/feedback-button'

export default async function NewDogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [breedsRes, colorsRes, kennelsRes, maleDogsRes, femaleDogsRes] = await Promise.all([
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('colors').select('id, name').order('name'),
    supabase.from('kennels').select('id, name').eq('owner_id', user.id).order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'male').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'female').order('name'),
  ])

  return (
    <>
      <DogForm
        breeds={breedsRes.data || []}
        colors={colorsRes.data || []}
        kennels={kennelsRes.data || []}
        maleDogs={maleDogsRes.data || []}
        femaleDogs={femaleDogsRes.data || []}
        userId={user.id}
      />
      <FeedbackButton scope="dog_form" pageLabel="Crear perro (/dogs/new)" />
    </>
  )
}
