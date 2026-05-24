import 'server-only'
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'

export type Section = {
  id: string
  type: string
  variant?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>
}

export type PageRow = {
  id: string
  slug: string
  enabled: boolean
  nav_label: string | null
  nav_order: number
  sections: Section[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections_i18n: Record<string, Section[]> | null
  meta_title: string | null
  meta_description: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta_i18n: Record<string, { title?: string; description?: string }> | null
}

const PAGE_FIELDS =
  'id, slug, enabled, nav_label, nav_order, sections, sections_i18n, meta_title, meta_description, meta_i18n'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Devuelve una página del kennel (publicada). null si no existe o deshabilitada. */
export const getPage = cache(async (kennelId: string, slug: string): Promise<PageRow | null> => {
  const { data } = await admin()
    .from('kennel_pages')
    .select(PAGE_FIELDS)
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
    .eq('enabled', true)
    .maybeSingle()
  return (data as PageRow | null) ?? null
})

/** Igual que getPage pero ignora enabled y prioriza draft_sections. Solo para el admin. */
export const getPageDraft = cache(async (kennelId: string, slug: string): Promise<PageRow | null> => {
  const { data } = await admin()
    .from('kennel_pages')
    .select(PAGE_FIELDS + ', draft_sections')
    .eq('kennel_id', kennelId)
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  const row = data as unknown as PageRow & { draft_sections?: Section[] | null }
  if (row.draft_sections && Array.isArray(row.draft_sections)) {
    return { ...row, sections: row.draft_sections }
  }
  return row
})

export const getEnabledPages = cache(async (kennelId: string): Promise<PageRow[]> => {
  const { data } = await admin()
    .from('kennel_pages')
    .select(PAGE_FIELDS)
    .eq('kennel_id', kennelId)
    .eq('enabled', true)
    .order('nav_order', { ascending: true })
  return (data as PageRow[] | null) ?? []
})

export const DEFAULT_NAV_LABELS: Record<string, string> = {
  home: 'Inicio',
  perros: 'Nuestros perros',
  razas: 'Sobre la raza',
  historia: 'Nuestra historia',
  servicios: 'Servicios',
  instalaciones: 'Instalaciones',
  galeria: 'Galería',
  blog: 'Blog',
  contacto: 'Contacto',
}

/** URL pública de una página dado kennel slug + page slug. */
export function pageHref(kennelSlug: string, pageSlug: string): string {
  if (pageSlug === 'home') return `/c/${kennelSlug}`
  if (pageSlug === 'razas') return `/c/${kennelSlug}/raza`
  return `/c/${kennelSlug}/${pageSlug}`
}

/**
 * Versión "para el cliente" del href. Si estamos viendo la web a través del
 * custom_domain (e.g. iremacurto.com), los enlaces internos deben ser
 * RELATIVOS al root del dominio (`/perros`) y NO incluir el prefijo
 * `/c/<slug>/`. Si los incluyésemos, el middleware haría rewrite doble
 * → /c/<slug>/c/<slug>/perros → 404.
 *
 * Cuando NO estamos en custom domain, devolvemos el path absoluto normal.
 */
export function pageHrefForHost(args: {
  kennelSlug: string
  pageSlug: string
  host?: string | null
  customDomain?: string | null
}): string {
  const onCustomDomain =
    !!args.customDomain && !!args.host && args.host.toLowerCase() === args.customDomain.toLowerCase()
  if (onCustomDomain) {
    if (args.pageSlug === 'home') return '/'
    if (args.pageSlug === 'razas') return '/raza'
    return `/${args.pageSlug}`
  }
  return pageHref(args.kennelSlug, args.pageSlug)
}

/**
 * URL pública desde el dashboard "Ver web pública" — respeta el custom_domain
 * si existe (e.g. https://iremacurto.com/perros en lugar de
 * /c/irema-curto/perros) y añade `?owner=1` para que el OwnerFloatingNav
 * se active en el custom domain (donde no hay cookie de Supabase).
 *
 * Cuando NO hay custom_domain, devolvemos pageHref relativo (sin ?owner=1
 * porque la propia cookie en .genealogic.io ya identifica al owner).
 */
export function publicUrl(args: {
  kennelSlug: string
  pageSlug: string
  customDomain?: string | null
}): string {
  const path = pageHref(args.kennelSlug, args.pageSlug)
  if (args.customDomain) {
    // Quita el prefijo /c/<slug> y deja solo la ruta de la página
    const rel = path.replace(`/c/${args.kennelSlug}`, '') || '/'
    return `https://${args.customDomain}${rel}?owner=1`
  }
  return path
}

export const PAGE_SLUGS = ['home', 'perros', 'razas', 'historia', 'servicios', 'instalaciones', 'galeria', 'blog', 'contacto'] as const
export type PageSlug = typeof PAGE_SLUGS[number]
