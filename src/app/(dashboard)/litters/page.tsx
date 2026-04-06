import { createClient } from '@/lib/supabase/server'
import LittersPageClient from '@/components/litters/litters-page-client'

export default async function LittersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [littersRes, kennelRes] = await Promise.all([
    supabase
      .from('litters')
      .select(`
        id, birth_date, mating_date, puppy_count, is_public, status, kennel_id,
        breed:breeds(id, name),
        father:dogs!litters_father_id_fkey(id, name, sex, thumbnail_url),
        mother:dogs!litters_mother_id_fkey(id, name, sex, thumbnail_url)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('kennels')
      .select('id, name, affix_format')
      .eq('owner_id', user.id)
      .limit(1),
  ])

  const userKennel = kennelRes.data?.[0] || null

  return (
    <div>
      <LittersPageClient
        litters={littersRes.data || []}
        userId={user.id}
        userKennelId={userKennel?.id}
        userKennelName={userKennel?.name}
        userAffixFormat={userKennel?.affix_format}
      />
    </div>
  )
}
