/**
 * Resuelve el "kennel context" para el web builder público (/c/[slug]/...).
 *
 * En Pawdoq el tenant viene del middleware (header injection por dominio).
 * En Genealogic todo es single-tenant pero multi-kennel: cada kennel tiene su
 * web pública en /c/[slug]. Custom domains se rewritean a /c/[slug] desde el
 * middleware antes de llegar aquí.
 *
 * Por tanto el "kennel actual" se resuelve del path param `slug` que pasamos
 * a estas funciones explícitamente, NO de un header global.
 */
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export type KennelContext = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  country: string | null
  city: string | null
  social_facebook: string | null
  social_instagram: string | null
  social_tiktok: string | null
  social_youtube: string | null
  whatsapp_phone: string | null
  whatsapp_enabled: boolean
  custom_domain: string | null
  affix_format: string | null
  owner_id: string
  contact_form_config?: unknown
  theme_id?: string | null
  theme_overrides?: { primary?: string; accent?: string; canvas?: string; ink?: string } | null
}

const KENNEL_FIELDS =
  'id, slug, name, description, logo_url, country, city, social_facebook, social_instagram, social_tiktok, social_youtube, whatsapp_phone, whatsapp_enabled, custom_domain, affix_format, owner_id, contact_form_config, theme_id, theme_overrides'

/** Resuelve un kennel por su slug. Se cachea por la duración del request. */
export const getKennelBySlug = cache(async (slug: string): Promise<KennelContext | null> => {
  const supabase = await createClient()
  const { data } = await supabase.from('kennels').select(KENNEL_FIELDS).eq('slug', slug).maybeSingle()
  return (data as KennelContext | null) ?? null
})

/** Resuelve el kennel del usuario autenticado (para el admin). Lanza si no hay. */
export async function getMyKennel(): Promise<KennelContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data } = await supabase
    .from('kennels')
    .select(KENNEL_FIELDS)
    .eq('owner_id', user.id)
    .limit(1)
    .maybeSingle()
  if (!data) throw new Error('El usuario no tiene kennel')
  return data as KennelContext
}
