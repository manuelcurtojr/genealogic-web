/**
 * Helpers del panel del propietario: perros recibidos del criador.
 *
 * Un perro "mío" es aquel donde `dogs.owner_id = me` Y
 * `delivered_from_reservation_id IS NOT NULL` (entregado oficialmente vía
 * una reserva). Excluimos perros que el user pueda tener añadidos
 * manualmente sin pasar por reserva — esos son otro caso de uso futuro.
 */
import 'server-only'
import { cache } from 'react'
import { createKennelAdminClient } from '@/lib/supabase/server'

export type MyDog = {
  id: string
  slug: string
  name: string
  sex: 'male' | 'female' | null
  birth_date: string | null
  registration: string | null
  microchip: string | null
  thumbnail_url: string | null
  weight: number | null
  height: number | null
  breed: { id: string; name: string } | null
  color: { id: string; name: string } | null
  // Trazabilidad: reserva origen + criador
  delivered_from_reservation: {
    id: string
    delivered_at: string | null
    kennel: { id: string; slug: string; name: string; logo_url: string | null } | null
  } | null
}

const SELECT_COLS = `
  id, slug, name, sex, birth_date, registration, microchip, thumbnail_url,
  weight, height,
  breed:breeds(id, name), color:colors(id, name),
  delivered_from_reservation:puppy_reservations!delivered_from_reservation_id(
    id, delivered_at,
    kennel:kennels(id, slug, name, logo_url)
  )
`

/** Lista de perros recibidos por el cliente (multi-criador). */
export const getMyDogs = cache(async (userId: string): Promise<MyDog[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('dogs')
    .select(SELECT_COLS)
    .eq('owner_id', userId)
    .not('delivered_from_reservation_id', 'is', null)
    .order('birth_date', { ascending: false })
  return (data as MyDog[]) ?? []
})

/** Ficha de un perro propio. */
export const getMyDog = cache(async (userId: string, dogId: string): Promise<MyDog | null> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data } = await admin
    .from('dogs')
    .select(SELECT_COLS)
    .eq('owner_id', userId)
    .eq('id', dogId)
    .not('delivered_from_reservation_id', 'is', null)
    .maybeSingle()
  return (data as MyDog | null) ?? null
})

export function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—'
  try {
    const birth = new Date(birthDate)
    const now = new Date()
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    if (months < 12) return `${months} mes${months === 1 ? '' : 'es'}`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    if (remainingMonths === 0) return `${years} año${years === 1 ? '' : 's'}`
    return `${years} año${years === 1 ? '' : 's'} ${remainingMonths} m`
  } catch {
    return '—'
  }
}
