import { createClient } from '@/lib/supabase/server'
import LittersPageClient from '@/components/litters/litters-page-client'
import { getUserRole } from '@/lib/get-user-role'
import { roleAtLeast } from '@/lib/permissions'
import PlanGate from '@/components/ui/plan-gate'

export default async function LittersPage() {
  const { userId, role } = await getUserRole()
  if (!userId) return null
  if (!roleAtLeast(role, 'amateur')) return <PlanGate requiredPlan="amateur" featureName="Camadas" featureDescription="Gestiona tus camadas, registra nacimientos y haz seguimiento de cada cachorro." />

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [littersRes, kennelRes] = await Promise.all([
    supabase
      .from('litters')
      .select(`
        id, birth_date, mating_date, puppy_count, is_public, status, kennel_id, created_at, updated_at,
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
