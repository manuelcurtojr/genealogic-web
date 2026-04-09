import { createClient } from '@/lib/supabase/server'
import DealsPageClient from '@/components/crm/deals-page-client'
import { getUserRole } from '@/lib/get-user-role'
import { roleAtLeast } from '@/lib/permissions'
import PlanGate from '@/components/ui/plan-gate'

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ dealId?: string }> }) {
  const params = await searchParams
  const { userId, role } = await getUserRole()
  if (!userId) return null
  if (!roleAtLeast(role, 'pro')) return <PlanGate requiredPlan="pro" featureName="CRM — Negocios" featureDescription="Gestiona tu pipeline de ventas con etapas personalizadas y seguimiento de cada negocio." />

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [pipelinesRes, dealsRes, contactsRes] = await Promise.all([
    supabase
      .from('pipelines')
      .select('id, name, stages:pipeline_stages(id, name, position, color)')
      .eq('owner_id', user.id)
      .order('created_at'),
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

  const pipelines = (pipelinesRes.data || []).map((p: any) => ({
    ...p,
    stages: p.stages ? [...p.stages].sort((a: any, b: any) => a.position - b.position) : [],
  }))

  return (
    <DealsPageClient
      initialDeals={dealsRes.data || []}
      pipelines={pipelines}
      contacts={contactsRes.data || []}
      userId={user.id}
      openDealId={params.dealId}
    />
  )
}
