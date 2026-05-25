/**
 * Notifica por email a la lista de espera de un criadero cuando hay
 * una camada nueva (planned, mated, born).
 *
 * "Lista de espera" = `puppy_reservations` del mismo kennel con status
 * 'interested' o 'in_waitlist', y (si litter.breed_id está, opcionalmente)
 * preferencia compatible.
 *
 * Best-effort: si algún email falla, se loggea en email_log y continuamos
 * con los demás. Nunca throws.
 */
import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from './send'

export async function notifyWaitlistOfNewLitter(litterId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Cargar litter + kennel del owner
  const { data: litter } = await admin
    .from('litters')
    .select(`
      id, status, birth_date, mating_date, expected_birth_date, puppy_count,
      breed:breeds(id, name),
      owner_id, breed_id,
      father:dogs!litters_father_id_fkey(name),
      mother:dogs!litters_mother_id_fkey(name)
    `)
    .eq('id', litterId)
    .single()
  if (!litter) return

  const { data: kennel } = await admin
    .from('kennels')
    .select('id, name')
    .eq('owner_id', litter.owner_id)
    .maybeSingle()
  if (!kennel) return

  // Resolver lista de espera del kennel
  const { data: reservations } = await admin
    .from('puppy_reservations')
    .select(`
      id, applicant_name, applicant_email, client_user_id, preference_breed_id
    `)
    .eq('kennel_id', kennel.id)
    .in('status', ['interested', 'in_waitlist'])

  if (!reservations || reservations.length === 0) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const breed: any = litter.breed
  const breedName: string | null = breed?.name || null
  const breedId: string | null = litter.breed_id || breed?.id || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const father: any = litter.father
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mother: any = litter.mother
  const fatherName = (Array.isArray(father) ? father[0] : father)?.name || null
  const motherName = (Array.isArray(mother) ? mother[0] : mother)?.name || null

  for (const r of reservations as Array<{
    id: string
    applicant_name: string | null
    applicant_email: string | null
    client_user_id: string | null
    preference_breed_id: string | null
  }>) {
    if (!r.applicant_email) continue
    // Si el reservista pidió raza específica y no coincide, skip
    if (r.preference_breed_id && breedId && r.preference_breed_id !== breedId) continue

    await sendTransactionalEmail(
      r.applicant_email,
      {
        template: 'litter_new',
        props: {
          recipientName: r.applicant_name || null,
          kennelName: kennel.name,
          litterId: litter.id,
          breedName,
          expectedDate: litter.expected_birth_date || litter.mating_date || null,
          birthDate: litter.birth_date || null,
          puppyCount: litter.puppy_count || null,
          status: litter.status as 'planned' | 'mated' | 'born' | 'delivered',
          fatherName,
          motherName,
        },
      },
      {
        userId: r.client_user_id || undefined,
        // Dedupe por (reservation + litter) — el mismo reservista no recibe
        // el mismo aviso de la misma camada 2 veces aunque cambie status
        dedupeKey: `litter_new:${r.id}:${litter.id}`,
      },
    )
  }
}
