/**
 * Resolución de audiencias para campañas del newsletter.
 *
 * Audiencias soportadas:
 *  - all        : todos los newsletter_subscribers activos del kennel
 *  - customers  : subscribers con al menos una puppy_reservation en este kennel
 *                 (cualquier status excepto cancelled/lost)
 *  - leads      : subscribers SIN reservas (interesados puros)
 *  - delivered  : subscribers con al menos una reservation en status 'delivered'
 *                 (gente que ya recibió cachorro — buenos para repeat sales /
 *                 referrals)
 *  - custom     : futuro (audience_filter jsonb)
 *
 * Siempre filtramos por is_active=true (opt-in vigente).
 */
import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { AudienceType } from './audiences-shared'

export type { AudienceType }
export { AUDIENCE_LABELS, AUDIENCE_HINTS } from './audiences-shared'

export type SubscriberAudience = {
  id: string
  email: string
  full_name: string | null
  unsubscribe_token: string
}

export async function resolveAudience(
  kennelId: string,
  audienceType: AudienceType,
): Promise<SubscriberAudience[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // 1) Subscribers activos del kennel
  const { data: subs } = await admin
    .from('newsletter_subscribers')
    .select('id, email, full_name, unsubscribe_token')
    .eq('kennel_id', kennelId)
    .eq('is_active', true)
    .not('email', 'is', null)
    .not('unsubscribe_token', 'is', null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscribers: any[] = subs ?? []
  if (subscribers.length === 0 || audienceType === 'all') {
    return subscribers.map((s) => ({
      id: s.id, email: s.email,
      full_name: s.full_name, unsubscribe_token: s.unsubscribe_token,
    }))
  }

  // 2) Filtrar según audience type
  const emailsLower = subscribers.map((s) => (s.email as string).toLowerCase())

  // Trae reservas relevantes del kennel matcheando applicant_email
  const { data: reservations } = await admin
    .from('puppy_reservations')
    .select('applicant_email, status')
    .eq('kennel_id', kennelId)
    .not('applicant_email', 'is', null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resByEmail = new Map<string, { hasReservation: boolean; hasDelivered: boolean }>()
  for (const r of (reservations ?? []) as Array<{ applicant_email: string; status: string }>) {
    const k = r.applicant_email.toLowerCase()
    const cur = resByEmail.get(k) || { hasReservation: false, hasDelivered: false }
    if (!['cancelled', 'lost'].includes(r.status)) cur.hasReservation = true
    if (r.status === 'delivered') cur.hasDelivered = true
    resByEmail.set(k, cur)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = subscribers.filter((s: any) => {
    const info = resByEmail.get((s.email as string).toLowerCase())
    switch (audienceType) {
      case 'customers':
        return !!info?.hasReservation
      case 'leads':
        return !info?.hasReservation
      case 'delivered':
        return !!info?.hasDelivered
      case 'custom':
        return true // TODO: aplicar audience_filter
      default:
        return false
    }
  })

  return filtered.map((s) => ({
    id: s.id, email: s.email,
    full_name: s.full_name, unsubscribe_token: s.unsubscribe_token,
  }))
}

/**
 * Conteo simultáneo de todas las audiencias del kennel — para el dashboard
 * "a cuánta gente voy a llegar".
 */
export async function countAllAudiences(kennelId: string): Promise<Record<AudienceType, number>> {
  const [all, customers, leads, delivered] = await Promise.all([
    resolveAudience(kennelId, 'all'),
    resolveAudience(kennelId, 'customers'),
    resolveAudience(kennelId, 'leads'),
    resolveAudience(kennelId, 'delivered'),
  ])
  return {
    all: all.length,
    customers: customers.length,
    leads: leads.length,
    delivered: delivered.length,
    custom: 0,
  }
}


