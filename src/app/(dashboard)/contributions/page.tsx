import { createClient } from '@/lib/supabase/server'
import ContributionsClient from '@/components/contributions/contributions-page-client'

export default async function ContributionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, sex, birth_date, thumbnail_url, breed:breeds(id, name), color:colors(id, name), breed_id')
    .eq('contributor_id', user!.id)
    .is('owner_id', null)
    .order('created_at', { ascending: false })

  const { data: breeds } = await supabase
    .from('breeds')
    .select('id, name')
    .order('name')

  return <ContributionsClient dogs={dogs || []} breeds={breeds || []} userId={user!.id} />
}
