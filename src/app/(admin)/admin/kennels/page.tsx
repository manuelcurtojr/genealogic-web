import { createClient } from '@/lib/supabase/server'
import AdminKennelsClient from '@/components/admin/admin-kennels-client'

export default async function AdminKennelsPage() {
  const supabase = await createClient()

  const { data: kennels } = await supabase
    .from('kennels')
    .select('id, name, logo_url, description, website, owner_id, created_at, affix_format, owner:profiles!kennels_owner_id_fkey(display_name, email)')
    .order('created_at', { ascending: false })

  // Count dogs per kennel
  const kennelIds = (kennels || []).map(k => k.id)
  const { data: dogCounts } = kennelIds.length > 0
    ? await supabase.from('dogs').select('kennel_id').in('kennel_id', kennelIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  ;(dogCounts || []).forEach((d: any) => { countMap[d.kennel_id] = (countMap[d.kennel_id] || 0) + 1 })

  const enriched = (kennels || []).map(k => ({ ...k, dog_count: countMap[k.id] || 0 }))

  return <AdminKennelsClient kennels={enriched} />
}
