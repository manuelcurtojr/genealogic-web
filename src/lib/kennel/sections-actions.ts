/**
 * Server actions para gestionar enabled_sections del kennel.
 *
 * Reglas:
 *  - Solo el owner del kennel puede modificar sus secciones
 *  - Las secciones marcadas como Pro requieren plan Kennel Pro
 *    (o enterprise override en permissions.ts)
 *  - Las secciones base (hero/about/dogs/contact) no viven aquí —
 *    son siempre on, no son configurables
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isKennelPro, isEnterpriseUser, normalizePlan } from '@/lib/permissions'
import { SECTION_META, type SectionId, ALL_SECTION_IDS } from './sections'

export async function toggleKennelSectionAction(input: {
  kennelId: string
  section: SectionId
  enabled: boolean
}): Promise<{ ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  // Owner check (también lo cubriría RLS, pero verificamos aquí para
  // poder dar mensajes de error claros antes del UPDATE).
  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, owner_id, enabled_sections')
    .eq('id', input.kennelId)
    .single()
  if (!kennel) throw new Error('kennel_not_found')
  if (kennel.owner_id !== user.id) throw new Error('forbidden')

  const meta = SECTION_META[input.section]
  if (!meta) throw new Error('invalid_section')

  // Pro gate: si la sección es Pro y el user no es enterprise ni kennel_pro, no permitimos
  if (meta.isPro && input.enabled) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    const userIsEnterprise = isEnterpriseUser(user.id)
    const userPlan = normalizePlan(profile?.plan)
    if (!userIsEnterprise && !isKennelPro(userPlan)) {
      throw new Error('requires_kennel_pro')
    }
  }

  const current = (kennel.enabled_sections || {}) as Record<string, unknown>
  const next: Record<string, boolean> = {}
  // Preservamos solo claves canónicas conocidas — descartamos keys raras
  // por defensa. Claves desconocidas se pierden, que es OK al ser un map de UI.
  for (const id of ALL_SECTION_IDS) {
    next[id] = id === input.section ? input.enabled : current[id] === true
  }

  const { error } = await supabase
    .from('kennels')
    .update({ enabled_sections: next })
    .eq('id', input.kennelId)
  if (error) throw new Error(error.message)

  revalidatePath('/kennel')
  if (kennel.id) revalidatePath(`/kennels/${kennel.id}`)
  return { ok: true }
}
