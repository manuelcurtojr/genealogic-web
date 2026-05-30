'use server'

/**
 * Server action para que el criador elija qué perro suyo es la "cara"
 * de cada raza en su web Pro. Lo usa src/components/kennel/breed-hero-picker.tsx.
 *
 * Seguridad:
 *  · Solo el dueño del kennel puede modificar (verificación por auth + ownership).
 *  · El perro elegido debe ser realmente del kennel y de esa raza
 *    (validado dentro de setKennelBreedHero).
 */
import { createClient } from '@/lib/supabase/server'
import { setKennelBreedHero } from '@/lib/kennel/breeds'
import { revalidatePath } from 'next/cache'

export async function saveBreedHero(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const breedId = String(formData.get('breed_id') || '')
  const dogIdRaw = String(formData.get('dog_id') || '')
  const dogId = dogIdRaw && dogIdRaw !== 'auto' ? dogIdRaw : null

  if (!breedId) return { ok: false, error: 'breed_id requerido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: kennel } = await supabase
    .from('kennels')
    .select('id, slug')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (!kennel) return { ok: false, error: 'No tienes kennel' }

  const result = await setKennelBreedHero(kennel.id, breedId, dogId)
  if (!result.ok) return result

  // Invalida la web pública para que el cambio se vea ya
  if (kennel.slug) {
    revalidatePath(`/kennels/${kennel.slug}/razas`)
    revalidatePath(`/kennels/${kennel.slug}/razas/[breedSlug]`, 'page')
  }
  revalidatePath('/kennel/contenido/razas')
  return { ok: true }
}
