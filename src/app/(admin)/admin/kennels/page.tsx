import { createClient } from '@/lib/supabase/server'
import AdminKennelsClient from '@/components/admin/admin-kennels-client'

export default async function AdminKennelsPage() {
  const supabase = await createClient()

  const { data: kennels } = await supabase
    .from('kennels')
    .select('id, name, logo_url, description, website, owner_id, created_at, affix_format')
    .order('created_at', { ascending: false })

  // Get owner info and dog counts
  const ownerIds = [...new Set((kennels || []).map(k => k.owner_id).filter(Boolean))]
  const kennelIds = (kennels || []).map(k => k.id)

  const [ownersRes, dogCountsRes] = await Promise.all([
    ownerIds.length > 0 ? supabase.from('profiles').select('id, display_name, email').in('id', ownerIds) : { data: [] },
    kennelIds.length > 0 ? supabase.from('dogs').select('kennel_id').in('kennel_id', kennelIds) : { data: [] },
  ])

  const ownerMap = new Map((ownersRes.data || []).map(p => [p.id, p]))
  const countMap: Record<string, number> = {}
  ;(dogCountsRes.data || []).forEach((d: any) => { countMap[d.kennel_id] = (countMap[d.kennel_id] || 0) + 1 })

  const enriched = (kennels || []).map(k => ({
    ...k,
    owner: ownerMap.get(k.owner_id) || null,
    dog_count: countMap[k.id] || 0,
  }))

  return <AdminKennelsClient kennels={enriched} />
}
