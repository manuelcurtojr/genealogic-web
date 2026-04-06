import { createClient } from '@/lib/supabase/server'
import LittersPageClient from '@/components/litters/litters-page-client'

export default async function LittersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: litters, error } = await supabase
    .from('litters')
    .select(`
      id, birth_date, puppy_count, is_public, status,
      breed:breeds(id, name),
      father:dogs!litters_father_id_fkey(id, name, sex, thumbnail_url),
      mother:dogs!litters_mother_id_fkey(id, name, sex, thumbnail_url)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <LittersPageClient litters={litters || []} userId={user.id} />
    </div>
  )
}
