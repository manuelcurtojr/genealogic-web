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

// Campos base que SIEMPRE existen
const KENNEL_FIELDS_BASE =
  'id, slug, name, description, logo_url, country, city, social_facebook, social_instagram, social_tiktok, social_youtube, whatsapp_phone, whatsapp_enabled, custom_domain, affix_format, owner_id, contact_form_config'

// Con el sistema de temas (requiere migración 20260530_kennel_theme.sql aplicada)
const KENNEL_FIELDS_WITH_THEME = `${KENNEL_FIELDS_BASE}, theme_id, theme_overrides`

/**
 * Detecta una sola vez por proceso si las columnas de tema existen. Si la
 * primera query con theme_* falla (columna inexistente porque la migración
 * no se ha aplicado), pasamos a usar solo los campos base. Evita 500s.
 */
let themeColumnsAvailable: boolean | null = null

async function selectKennel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  filter: { column: 'slug' | 'owner_id'; value: string },
): Promise<KennelContext | null> {
  const apply = (q: ReturnType<typeof supabase.from>) =>
    filter.column === 'slug'
      ? q.eq('slug', filter.value).maybeSingle()
      : q.eq('owner_id', filter.value).limit(1).maybeSingle()

  if (themeColumnsAvailable !== false) {
    const { data, error } = await apply(supabase.from('kennels').select(KENNEL_FIELDS_WITH_THEME))
    if (!error) {
      themeColumnsAvailable = true
      return (data as KennelContext | null) ?? null
    }
    // Columna inexistente → fallback. Cualquier otro error se silencia y
    // también cae al fallback (no queremos romper la web por esto).
    themeColumnsAvailable = false
  }
  const { data } = await apply(supabase.from('kennels').select(KENNEL_FIELDS_BASE))
  return (data as KennelContext | null) ?? null
}

/** Resuelve un kennel por su slug. Se cachea por la duración del request. */
export const getKennelBySlug = cache(async (slug: string): Promise<KennelContext | null> => {
  const supabase = await createClient()
  return selectKennel(supabase, { column: 'slug', value: slug })
})

/** Resuelve el kennel del usuario autenticado (para el admin). Lanza si no hay. */
export async function getMyKennel(): Promise<KennelContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const data = await selectKennel(supabase, { column: 'owner_id', value: user.id })
  if (!data) throw new Error('El usuario no tiene kennel')
  return data
}
