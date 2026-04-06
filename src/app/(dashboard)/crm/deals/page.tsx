import { createClient } from '@/lib/supabase/server'
import DealsPageClient from '@/components/crm/deals-page-client'

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [pipelinesRes, dealsRes, contactsRes] = await Promise.all([
    supabase
      .from('pipelines')
      .select('id, name, stages:pipeline_stages(id, name, position, color)')
      .eq('owner_id', user.id)
      .limit(1)
      .single(),
    supabase
      .from('deals')
      .select('id, title, value, currency, contact_id, stage_id, pipeline_id, lost_reason, contact:contacts(id, name)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('contacts')
      .select('id, name')
      .eq('owner_id', user.id)
      .order('name'),
  ])

  const pipeline = pipelinesRes.data
  const stages = pipeline?.stages
    ? [...(pipeline.stages as any[])].sort((a: any, b: any) => a.position - b.position)
    : []

  return (
    <DealsPageClient
      initialDeals={dealsRes.data || []}
      stages={stages}
      contacts={contactsRes.data || []}
      pipelineId={pipeline?.id || ''}
      userId={user.id}
    />
  )
}
