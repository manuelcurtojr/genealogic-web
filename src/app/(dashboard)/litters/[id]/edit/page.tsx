import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import LitterForm from '@/components/litters/litter-form'

export default async function EditLitterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: litter } = await supabase
    .from('litters')
    .select('*')
    .eq('id', id)
    .single()

  if (!litter) notFound()
  if (litter.owner_id !== user.id) redirect('/litters')

  const [breedsRes, maleDogsRes, femaleDogsRes] = await Promise.all([
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'male').order('name'),
    supabase.from('dogs').select('id, name').eq('owner_id', user.id).eq('sex', 'female').order('name'),
  ])

  return (
    <LitterForm
      initialData={litter}
      breeds={breedsRes.data || []}
      maleDogs={maleDogsRes.data || []}
      femaleDogs={femaleDogsRes.data || []}
      userId={user.id}
    />
  )
}
