import { createClient } from '@/lib/supabase/server'
import ContributionsClient from '@/components/contributions/contributions-page-client'

export default async function ContributionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [dogsRes, breedsRes, importsRes] = await Promise.all([
    supabase.from('dogs')
      .select('id, slug, name, sex, birth_date, thumbnail_url, breed:breeds(id, name), color:colors(id, name), breed_id')
      .eq('contributor_id', user!.id).is('owner_id', null)
      .order('created_at', { ascending: false }),
    supabase.from('breeds').select('id, name').order('name'),
    supabase.from('notifications')
      .select('id, title, message, created_at')
      .eq('user_id', user!.id).eq('type', 'import')
      .order('created_at', { ascending: false }),
  ])

  return <ContributionsClient dogs={dogsRes.data || []} breeds={breedsRes.data || []} imports={importsRes.data || []} userId={user!.id} />
}
