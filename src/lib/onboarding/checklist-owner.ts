/**
 * Cálculo del estado de onboarding de un PROPIETARIO (no criador).
 *
 * Diferente de `checklist.ts` (criador), aquí los pasos giran alrededor
 * de los perros propios y las reservas con criaderos:
 *   - first_dog          : registró al menos 1 perro
 *   - dog_with_photo     : subió al menos 1 foto
 *   - dog_complete       : completó datos básicos (raza, fecha nacimiento)
 *   - vet_baseline       : creó al menos 1 registro vet (vacuna, visita...)
 *   - link_reservation   : tiene reserva vinculada (solo se considera done
 *                          si ya tiene reservas; si no, ni se sugiere)
 *
 * Igual que en breeder, "required" son los que abren la card. Si no hay
 * ningún paso "required" pendiente, la card desaparece.
 */
import 'server-only'
import { createKennelAdminClient } from '@/lib/supabase/server'
import type { OnboardingStep, OnboardingStatus } from './types'

export async function getOwnerOnboardingStatus(args: {
  userId: string
  hasReservations: boolean
}): Promise<OnboardingStatus> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const [
    dogsCountRes,
    dogsPhotoCountRes,
    dogsCompleteCountRes,
    vetCountRes,
  ] = await Promise.all([
    admin.from('dogs').select('id', { count: 'exact', head: true })
      .eq('owner_id', args.userId),
    admin.from('dogs').select('id', { count: 'exact', head: true })
      .eq('owner_id', args.userId).not('thumbnail_url', 'is', null),
    admin.from('dogs').select('id', { count: 'exact', head: true })
      .eq('owner_id', args.userId)
      .not('breed_id', 'is', null)
      .not('birth_date', 'is', null),
    admin.from('vet_records').select('id', { count: 'exact', head: true })
      .eq('owner_id', args.userId),
  ])

  const dogsCount = dogsCountRes.count || 0
  const dogsWithPhoto = dogsPhotoCountRes.count || 0
  const dogsComplete = dogsCompleteCountRes.count || 0
  const vetCount = vetCountRes.count || 0

  const steps: OnboardingStep[] = [
    {
      id: 'first_dog',
      label: 'Añade tu primer perro',
      description: 'Crea la ficha con foto, raza y fecha de nacimiento. Empieza por uno — luego añades el resto.',
      done: dogsCount > 0,
      href: '/dogs?new=1',
      ctaLabel: 'Añadir perro',
      icon: 'Dog',
      importance: 'required',
    },
    {
      id: 'dog_with_photo',
      label: 'Sube una foto',
      description: 'Las fichas con foto son las que vas a querer enseñar a otros owners y al vet.',
      done: dogsWithPhoto > 0,
      href: '/dogs',
      ctaLabel: 'Añadir foto',
      icon: 'Image',
      importance: 'required',
    },
    {
      id: 'dog_complete',
      label: 'Completa la ficha',
      description: 'Raza y fecha de nacimiento. Con eso ya puedes enlazar genealogía y activar recordatorios vet.',
      done: dogsComplete > 0,
      href: '/dogs',
      ctaLabel: 'Editar ficha',
      icon: 'FileText',
      importance: 'recommended',
    },
    {
      id: 'vet_baseline',
      label: 'Registra una visita al vet',
      description: 'Apunta la última vacuna o revisión. Sirve para arrancar el calendario y los recordatorios.',
      done: vetCount > 0,
      href: '/vet',
      ctaLabel: 'Añadir registro',
      icon: 'Stethoscope',
      importance: 'recommended',
    },
  ]

  // Si tiene reservas, añadir el paso de revisarlas como "required"
  if (args.hasReservations) {
    steps.unshift({
      id: 'check_reservations',
      label: 'Revisa tus reservas',
      description: 'Tienes reservas vinculadas en criaderos. Echa un vistazo al estado, mensajes y papeles.',
      done: false, // se considera done cuando el user las visita — opcional implementar tracking
      href: '/mis-reservas',
      ctaLabel: 'Ir a Mis reservas',
      icon: 'Calendar',
      importance: 'required',
    })
  }

  const considered = steps.filter((s) => s.importance !== 'optional')
  const consideredDone = considered.filter((s) => s.done).length
  const progressPct = considered.length === 0
    ? 100
    : Math.round((consideredDone / considered.length) * 100)
  const requiredComplete = steps
    .filter((s) => s.importance === 'required')
    .every((s) => s.done)
  const allComplete = steps.every((s) => s.done)

  return {
    steps,
    completedCount: consideredDone,
    totalCount: considered.length,
    progressPct,
    requiredComplete,
    allComplete,
  }
}
