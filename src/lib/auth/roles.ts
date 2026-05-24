/**
 * Roles efectivos de un usuario en Genealogic.
 *
 * Un mismo auth.users puede acumular múltiples roles según los datos:
 *   - BREEDER:  tiene al menos un kennel donde owner_id = me
 *   - CLIENT:   tiene reservas vinculadas (puppy_reservations.client_user_id = me)
 *               OR perros entregados (dogs.owner_id = me sin ser kennel owner)
 *   - ADMIN:    profiles.role = 'admin'
 *
 * Una llamada server-side resuelve los 3 con 3 queries paralelas cacheadas
 * por request (React cache). Usable desde Server Components.
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'

export type EffectiveRoles = {
  userId: string
  isBreeder: boolean
  isClient: boolean
  isAdmin: boolean
  /** kennels donde soy owner (criador) */
  kennelIdsAsBreeder: string[]
  /** kennel slugs donde tengo reservas activas (cliente) */
  clientOfKennelSlugs: string[]
  /** ¿tiene reservas activas? */
  hasActiveReservations: boolean
  /** ¿tiene perros transferidos (delivered_from_reservation_id IS NOT NULL)? */
  hasOwnedDogs: boolean
}

export const getEffectiveRoles = cache(async (userId: string): Promise<EffectiveRoles> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const [kennelsRes, reservationsRes, dogsRes, profileRes] = await Promise.all([
    admin.from('kennels').select('id, slug').eq('owner_id', userId),
    admin
      .from('puppy_reservations')
      .select('id, status, kennel:kennels(slug)')
      .eq('client_user_id', userId),
    admin
      .from('dogs')
      .select('id')
      .eq('owner_id', userId)
      .not('delivered_from_reservation_id', 'is', null)
      .limit(1),
    admin.from('profiles').select('role').eq('id', userId).maybeSingle(),
  ])

  const kennels = (kennelsRes.data ?? []) as { id: string; slug: string }[]
  const reservations = (reservationsRes.data ?? []) as Array<{
    id: string
    status: string
    kennel: { slug: string } | null
  }>
  const dogs = (dogsRes.data ?? []) as { id: string }[]
  const role = (profileRes.data as { role?: string } | null)?.role ?? null

  const activeReservations = reservations.filter(
    (r) => r.status !== 'delivered' && r.status !== 'cancelled',
  )

  return {
    userId,
    isBreeder: kennels.length > 0,
    isClient: reservations.length > 0 || dogs.length > 0,
    isAdmin: role === 'admin',
    kennelIdsAsBreeder: kennels.map((k) => k.id),
    clientOfKennelSlugs: Array.from(
      new Set(reservations.map((r) => r.kennel?.slug).filter(Boolean) as string[]),
    ),
    hasActiveReservations: activeReservations.length > 0,
    hasOwnedDogs: dogs.length > 0,
  }
})
