/**
 * Server actions para reseñas PÚBLICAS — las que dejan los usuarios
 * logueados en el perfil de un kennel.
 *
 * Flujo:
 *  1) User logueado pulsa "Dejar reseña" en /kennels/[slug]
 *  2) Escribe texto + rating, opcional cambiar su display_name
 *  3) submitPublicReviewAction inserta con is_visible=false, is_manual=false,
 *     submitted_by_user_id=auth.uid()
 *  4) El criador la ve en /kennel/contenido/resenas (con badge "Pendiente"),
 *     y puede hacerla pública con el toggle existente
 *  5) Una vez visible, se muestra en la home Pro con badge Cliente o Usuario
 *
 * El badge se calcula dinámicamente al renderizar, no se guarda en DB:
 *  - Cliente = el user tiene una reserva con status delivered/confirmed
 *    asociada a este kennel
 *  - Usuario = está logueado y registrado, pero no es cliente
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { revalidateKennelHome } from '@/lib/kennel/kennel-home-cache'

export async function submitPublicReviewAction(input: {
  kennelId: string
  body: string
  rating: number | null
  displayName?: string  // opcional, sobreescribe el del profile
}): Promise<{ ok: true; id: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthorized')

  const body = input.body.trim()
  if (body.length < 20) throw new Error('body_too_short')  // anti-spam mínimo
  if (body.length > 1500) throw new Error('body_too_long')
  if (input.rating !== null && (input.rating < 1 || input.rating > 5)) {
    throw new Error('invalid_rating')
  }

  // Coge nombre del profile + slug del kennel para revalidate
  const [{ data: profile }, { data: kennel }] = await Promise.all([
    supabase.from('profiles').select('display_name, email').eq('id', user.id).single(),
    supabase.from('kennels').select('id, slug, owner_id').eq('id', input.kennelId).single(),
  ])
  if (!kennel) throw new Error('kennel_not_found')

  // No permitimos dejarte reseña a ti mismo
  if (kennel.owner_id === user.id) throw new Error('cannot_review_own_kennel')

  // Anti-doble: si el user ya ha dejado reseña en este kennel, error claro
  // (puede editar la suya en otra iteración; por ahora 1 por user)
  const { data: existing } = await supabase
    .from('kennel_reviews')
    .select('id')
    .eq('kennel_id', input.kennelId)
    .eq('submitted_by_user_id', user.id)
    .maybeSingle()
  if (existing) throw new Error('already_reviewed')

  const authorName = input.displayName?.trim() || profile?.display_name || profile?.email?.split('@')[0] || 'Usuario'

  const { data: row, error } = await supabase
    .from('kennel_reviews')
    .insert({
      kennel_id: input.kennelId,
      author_name: authorName,
      body,
      rating: input.rating,
      submitted_by_user_id: user.id,
      is_manual: false,
      is_visible: false,  // moderación owner
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  if (kennel.slug) revalidatePath(`/kennels/${kennel.slug}`)
  revalidatePath('/kennel/contenido/resenas')
  // Invalidar el caché `unstable_cache` de la home Pro de este kennel
  // para que la nueva reseña aparezca de inmediato (no espera al TTL 120s).
  revalidateKennelHome(input.kennelId)
  return { ok: true, id: row.id }
}
