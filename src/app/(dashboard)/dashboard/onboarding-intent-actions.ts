/**
 * Server actions del paso 0 del onboarding (selección de rol).
 *
 * Cuando un user nuevo llega al dashboard sin kennel ni reservas, le
 * mostramos una pantalla para que diga si es breeder o owner. La
 * respuesta se persiste en `profiles.onboarding_intent` y se usa para
 * decidir qué pantalla welcome enseñarle.
 *
 * Si el user ya tenía un intent persistido (de un signup intent-aware
 * previo), saltamos el paso 0.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Intent = 'breeder' | 'owner'

export async function setOnboardingIntentAction(intent: Intent): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  if (intent !== 'breeder' && intent !== 'owner') {
    throw new Error('invalid_intent')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_intent: intent })
    .eq('id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}
