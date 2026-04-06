import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DogForm from '@/components/dogs/dog-form'

export default async function EditDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: dog } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', id)
    .single()

  if (!dog) notFound()
  if (dog.owner_id !== user.id) redirect('/dogs')

  const [breedsRes, colorsRes, kennelsRes, maleDogsRes, femaleDogsRes] = await Promise.all([
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('colors').select('id, name').order('name'),
    supabase.from('kennels').select('id, name').eq('owner_id', user.id).order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'male').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'female').order('name'),
  ])

  return (
    <DogForm
      initialData={dog}
      breeds={breedsRes.data || []}
      colors={colorsRes.data || []}
      kennels={kennelsRes.data || []}
      maleDogs={maleDogsRes.data || []}
      femaleDogs={femaleDogsRes.data || []}
      userId={user.id}
    />
  )
}
