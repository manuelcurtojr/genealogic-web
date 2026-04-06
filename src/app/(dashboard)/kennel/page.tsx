import { createClient } from '@/lib/supabase/server'
import { Dog } from 'lucide-react'
import KennelDashboard from '@/components/kennel/kennel-dashboard'
import KennelEmpty from '@/components/kennel/kennel-empty'

export default async function KennelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: kennels } = await supabase
    .from('kennels')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
  const kennel = kennels?.[0] || null

  if (!kennel) {
    return <KennelEmpty userId={user.id} />
  }

  const { data: dogs } = await supabase
    .from('dogs')
    .select('id, name, sex, thumbnail_url, is_public, is_reproductive, show_in_kennel, is_for_sale, sale_price, sale_currency, owner_id, breeder_id, breed:breeds(name), birth_date, color:colors(name)')
    .eq('kennel_id', kennel.id)
    .order('name')

  const { data: litters } = await supabase
    .from('litters')
    .select('id, name, status')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <KennelDashboard
      kennel={kennel}
      dogs={dogs || []}
      litters={litters || []}
      userId={user.id}
    />
  )
}
