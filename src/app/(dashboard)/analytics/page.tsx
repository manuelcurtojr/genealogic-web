import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get kennel first (needed for submissions query)
  const { data: kennelArr } = await supabase.from('kennels').select('id, name, breed_ids, created_at').eq('owner_id', user.id).limit(1)
  const kennel = kennelArr?.[0] || null
  const kennelId = kennel?.id

  // Fetch all data in parallel
  const [
    dogsRes, littersRes, dealsRes, contactsRes,
    pipelinesRes, vetRes, awardsRes, submissionsRes, profileRes, genesRes,
  ] = await Promise.all([
    supabase.from('dogs').select('id, name, sex, birth_date, breed_id, color_id, kennel_id, is_for_sale, is_reproductive, is_public, show_in_kennel, owner_id, breeder_id, father_id, mother_id, created_at, breed:breeds(name), color:colors(name)').eq('owner_id', user.id),
    supabase.from('litters').select('id, status, birth_date, mating_date, puppy_count, breed_id, father_id, mother_id, is_public, created_at, breed:breeds(name)').eq('owner_id', user.id),
    supabase.from('deals').select('id, title, value, currency, stage_id, pipeline_id, contact_id, lost_reason, is_reservation, advance_amount, created_at, contact:contacts(name, country, city)').eq('owner_id', user.id),
    supabase.from('contacts').select('id, name, email, country, city, created_at').eq('owner_id', user.id),
    supabase.from('pipelines').select('id, name, stages:pipeline_stages(id, name, position, color)').eq('owner_id', user.id),
    supabase.from('vet_records').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('awards').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    kennelId ? supabase.from('form_submissions').select('id, data, created_at, kennel_id').eq('kennel_id', kennelId) : Promise.resolve({ data: [] }),
    supabase.from('profiles').select('display_name, genes, created_at').eq('id', user.id).single(),
    supabase.from('genes_transactions').select('id, type, amount, description, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ])

  // Get kennel dogs (includes transferred)
  const kennelDogsRes = kennelId
    ? await supabase.from('dogs').select('id, name, sex, breed_id, owner_id, breeder_id, is_reproductive, is_for_sale, created_at, breed:breeds(name)').eq('kennel_id', kennelId)
    : { data: [] }

  const pipelines = (pipelinesRes.data || []).map((p: any) => ({
    ...p,
    stages: (p.stages || []).sort((a: any, b: any) => a.position - b.position),
  }))

  return (
    <AnalyticsDashboard
      dogs={dogsRes.data || []}
      kennelDogs={kennelDogsRes.data || []}
      litters={littersRes.data || []}
      deals={dealsRes.data || []}
      contacts={contactsRes.data || []}
      kennel={kennel}
      pipelines={pipelines}
      vetCount={vetRes.count || 0}
      awardsCount={awardsRes.count || 0}
      submissions={(submissionsRes as any).data || []}
      profile={profileRes.data}
      genesTransactions={genesRes.data || []}
      userId={user.id}
    />
  )
}
