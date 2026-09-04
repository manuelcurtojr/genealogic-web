/**
 * Server actions del CRM de marketing. Todas exigen rol admin (mismo patrón que
 * el resto del panel: cookie client -> profiles.role === 'admin').
 * Las mutaciones que operan sobre datos usan service_role.
 */
'use server'

import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { troyaCandidates } from './queries'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('forbidden')
  return { user }
}

/** Auto-puebla el Tier A desde los criaderos sin reclamar (caballo de Troya). */
export async function seedTroyanLeads(opts: { minDogs: number; onlyWebsite: boolean }) {
  const { user } = await requireAdmin()
  const admin = createKennelAdminClient() as any

  const candidates = await troyaCandidates(admin, opts)

  // No duplicar: kennels que ya tienen lead.
  const { data: existing } = await admin
    .from('marketing_leads')
    .select('matched_kennel_id')
    .not('matched_kennel_id', 'is', null)
  const seen = new Set<string>((existing || []).map((r: any) => r.matched_kennel_id))

  const toInsert = candidates
    .filter((c) => !seen.has(c.kennel_id))
    .map((c) => ({
      kennel_name: c.kennel_name,
      website: c.website,
      matched_kennel_id: c.kennel_id,
      source: 'db_troya',
      stage: 'nuevo',
      priority: Number(c.dog_count) || 0,
      created_by: user.id,
    }))

  let inserted = 0
  if (toInsert.length) {
    const { data: rows } = await admin.from('marketing_leads').insert(toInsert).select('id')
    inserted = rows?.length || 0
    if (rows?.length) {
      await admin.from('marketing_lead_events').insert(
        rows.map((r: any) => ({
          lead_id: r.id,
          type: 'lead_created',
          detail: 'Auto-poblado desde el Tier A (criadero ya en la DB sin reclamar)',
          created_by: user.id,
        })),
      )
    }
  }

  revalidatePath('/admin/marketing')
  return { candidates: candidates.length, inserted, skipped: candidates.length - inserted }
}

export async function moveLeadStage(leadId: string, stage: string) {
  const { user } = await requireAdmin()
  const admin = createKennelAdminClient() as any
  await admin.from('marketing_leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', leadId)
  await admin.from('marketing_lead_events').insert({
    lead_id: leadId,
    type: 'stage_changed',
    detail: stage,
    created_by: user.id,
  })
  revalidatePath('/admin/marketing')
  revalidatePath(`/admin/marketing/${leadId}`)
}

export async function updateLead(
  leadId: string,
  patch: Partial<{
    kennel_name: string
    contact_name: string
    email: string
    phone: string
    website: string
    instagram: string
    country: string
    region: string
    breed_focus: string
    source: string
    next_action_at: string | null
    internal_note: string
  }>,
) {
  await requireAdmin()
  const admin = createKennelAdminClient() as any
  const clean: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(patch)) clean[k] = v === '' ? null : v
  await admin.from('marketing_leads').update(clean).eq('id', leadId)
  revalidatePath('/admin/marketing')
  revalidatePath(`/admin/marketing/${leadId}`)
}

export async function addLeadNote(leadId: string, text: string) {
  const { user } = await requireAdmin()
  if (!text.trim()) return
  const admin = createKennelAdminClient() as any
  await admin.from('marketing_lead_events').insert({
    lead_id: leadId,
    type: 'note',
    detail: text.trim(),
    created_by: user.id,
  })
  revalidatePath(`/admin/marketing/${leadId}`)
}

export async function createLead(patch: {
  kennel_name?: string
  contact_name?: string
  email?: string
  website?: string
  instagram?: string
  breed_focus?: string
  source?: string
}) {
  const { user } = await requireAdmin()
  const admin = createKennelAdminClient() as any
  const { data: row } = await admin
    .from('marketing_leads')
    .insert({ ...patch, source: patch.source || 'manual', stage: 'nuevo', created_by: user.id })
    .select('id')
    .single()
  if (row?.id) {
    await admin.from('marketing_lead_events').insert({
      lead_id: row.id,
      type: 'lead_created',
      detail: 'Alta manual',
      created_by: user.id,
    })
  }
  revalidatePath('/admin/marketing')
  return row?.id as string | undefined
}

export async function deleteLead(leadId: string) {
  await requireAdmin()
  const admin = createKennelAdminClient() as any
  await admin.from('marketing_leads').delete().eq('id', leadId)
  revalidatePath('/admin/marketing')
}
