/**
 * Lecturas del CRM de marketing. Todas server-only y con el cliente service_role
 * (el área /admin/marketing hereda el guard de rol admin del layout).
 *
 * La gracia de tener el CRM en la MISMA DB que el producto: la "activación" de
 * cada lead no se sincroniza de ningún sitio, se calcula cruzando matched_* con
 * dogs / profiles.
 */
import 'server-only'
import type { MarketingLead, LeadEvent, LeadMessage, LeadActivation } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getLeads(admin: any): Promise<MarketingLead[]> {
  const { data } = await admin
    .from('marketing_leads')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
  return (data || []) as MarketingLead[]
}

export async function getLead(
  admin: any,
  id: string,
): Promise<{ lead: MarketingLead; events: LeadEvent[]; messages: LeadMessage[] } | null> {
  const { data: lead } = await admin.from('marketing_leads').select('*').eq('id', id).single()
  if (!lead) return null
  const [{ data: events }, { data: messages }] = await Promise.all([
    admin.from('marketing_lead_events').select('*').eq('lead_id', id).order('occurred_at', { ascending: false }),
    admin.from('marketing_messages').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
  ])
  return {
    lead: lead as MarketingLead,
    events: (events || []) as LeadEvent[],
    messages: (messages || []) as LeadMessage[],
  }
}

/** Estado de activación en vivo del lead (caballo de Troya + comportamiento). */
export async function getLeadActivation(
  admin: any,
  lead: Pick<MarketingLead, 'matched_kennel_id' | 'matched_user_id'>,
): Promise<LeadActivation> {
  let dogsTotal = 0
  let dogsImported = 0
  let dogsClaimed = 0
  let claimed = false
  let registeredAt: string | null = null
  let plan: string | null = null
  let lastSeenAt: string | null = null

  if (lead.matched_kennel_id) {
    const [{ count: total }, { count: imported }] = await Promise.all([
      admin.from('dogs').select('id', { count: 'exact', head: true }).eq('kennel_id', lead.matched_kennel_id),
      admin
        .from('dogs')
        .select('id', { count: 'exact', head: true })
        .eq('kennel_id', lead.matched_kennel_id)
        .not('imported_from', 'is', null),
    ])
    dogsTotal = total || 0
    dogsImported = imported || 0
  }

  if (lead.matched_user_id) {
    claimed = true
    const { data: prof } = await admin
      .from('profiles')
      .select('created_at, plan, last_sign_in_at')
      .eq('id', lead.matched_user_id)
      .single()
    if (prof) {
      registeredAt = prof.created_at ?? null
      plan = prof.plan ?? null
      lastSeenAt = prof.last_sign_in_at ?? null
    }
    const { count: owned } = await admin
      .from('dogs')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', lead.matched_user_id)
    dogsClaimed = owned || 0
  }

  return { claimed, registeredAt, plan, lastSeenAt, dogsTotal, dogsImported, dogsClaimed }
}

export interface TroyaCandidate {
  kennel_id: string
  kennel_name: string | null
  slug: string | null
  website: string | null
  dog_count: number
  imported_count: number
  created_at: string
}

export async function troyaCandidates(
  admin: any,
  opts: { minDogs: number; onlyWebsite: boolean },
): Promise<TroyaCandidate[]> {
  const { data } = await admin.rpc('marketing_troya_candidates', {
    min_dogs: opts.minDogs,
    only_website: opts.onlyWebsite,
  })
  return (data || []) as TroyaCandidate[]
}
