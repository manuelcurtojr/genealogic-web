import { createClient } from '@/lib/supabase/server'
import AdminGenealogyClient from '@/components/admin/admin-genealogy-client'

export default async function AdminGenealogyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get all dogs with their parent info to detect incomplete pedigrees
  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, father_id, mother_id, owner_id, breed:breeds(name), kennel:kennels(name)')
    .order('name')

  // Get owner names
  const ownerIds = [...new Set((dogs || []).map(d => d.owner_id).filter(Boolean))]
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, display_name').in('id', ownerIds)
    : { data: [] }
  const ownerMap = new Map((ownerProfiles || []).map(p => [p.id, p]))

  // Attach owner info
  const dogsWithOwner = (dogs || []).map(d => ({ ...d, owner: ownerMap.get(d.owner_id) || null }))

  const { data: breeds } = await supabase.from('breeds').select('id, name').order('name')
  const { data: colors } = await supabase.from('colors').select('id, name, breed_id').order('name')

  // Calculate completeness: how many ancestors out of expected
  const dogMap = new Map(dogsWithOwner.map(d => [d.id, d]))
  const dogsWithCompleteness = dogsWithOwner.map(d => {
    let filled = 0, total = 0
    // Check 5 generations (parents, grandparents, great-grandparents...)
    function check(id: string | null, gen: number) {
      if (gen > 5) return
      total++
      if (!id) return
      const dog = dogMap.get(id)
      if (!dog) return
      filled++
      check(dog.father_id, gen + 1)
      check(dog.mother_id, gen + 1)
    }
    check(d.father_id, 1) // father line
    check(d.mother_id, 1) // mother line
    const completeness = total > 0 ? Math.round((filled / total) * 100) : 0
    const missingParents = (!d.father_id ? 1 : 0) + (!d.mother_id ? 1 : 0)
    return { ...d, completeness, missingParents, filledAncestors: filled, totalSlots: total }
  })

  return (
    <div className="-m-6 lg:-m-8">
      <AdminGenealogyClient
        dogs={dogsWithCompleteness}
        allDogs={dogs || []}
        breeds={breeds || []}
        colors={colors || []}
        userId={user.id}
      />
    </div>
  )
}
