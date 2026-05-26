/**
 * Sistema de "Web Pro" del kennel (multi-página).
 *
 * Mientras Free/Kennel ven UNA landing en /kennels/[slug], Kennel Pro ve
 * una web completa con chrome propio (header con menú) y páginas reales:
 *
 *   /kennels/[slug]              → home (landing con hero, highlights, FAQ)
 *   /kennels/[slug]/perros       → catálogo (las 4 tabs actuales)
 *   /kennels/[slug]/sobre        → Sobre nosotros (about_md)
 *   /kennels/[slug]/instalaciones→ Galería de instalaciones (kennel_photos)
 *   /kennels/[slug]/galeria      → Galería general (kennel_photos)
 *   /kennels/[slug]/blog         → Blog (kennel_posts)
 *   /kennels/[slug]/blog/[post]  → Post individual
 *   /kennels/[slug]/contacto     → Form grande dedicado
 *
 * Reglas:
 *  - home, perros, contacto son SIEMPRE on
 *  - sobre, instalaciones, galeria, blog son TOGGLEABLES (enabled_pages)
 *  - una página solo aparece pública si está enabled Y tiene contenido
 *  - el chrome Pro solo se aplica si el dueño del kennel es Kennel Pro
 *    (o enterprise como Irema)
 */
import { isKennelPro, isEnterpriseUser, normalizePlan } from '@/lib/permissions'

export type ExtraPageId = 'sobre' | 'instalaciones' | 'galeria' | 'blog'

export const EXTRA_PAGES: ExtraPageId[] = ['sobre', 'instalaciones', 'galeria', 'blog']

export const PAGE_NAV_LABEL: Record<ExtraPageId | 'home' | 'perros' | 'contacto', string> = {
  home: 'Inicio',
  perros: 'Nuestros perros',
  sobre: 'Sobre nosotros',
  instalaciones: 'Instalaciones',
  galeria: 'Galería',
  blog: 'Blog',
  contacto: 'Contacto',
}

export const PAGE_NAV_HREF: Record<'home' | 'perros' | ExtraPageId | 'contacto', string> = {
  home: '',
  perros: 'perros',
  sobre: 'sobre',
  instalaciones: 'instalaciones',
  galeria: 'galeria',
  blog: 'blog',
  contacto: 'contacto',
}

export function isExtraPageEnabled(
  enabledPages: Record<string, unknown> | null | undefined,
  id: ExtraPageId,
): boolean {
  if (!enabledPages) return false
  return enabledPages[id] === true
}

/**
 * Determina si el kennel debería renderizarse con chrome Pro (multi-página).
 * Recibe el plan del DUEÑO del kennel + su user_id (para enterprise check).
 */
export function isKennelOnProPlan(args: {
  ownerPlan: string | null | undefined
  ownerUserId: string | null | undefined
}): boolean {
  if (args.ownerUserId && isEnterpriseUser(args.ownerUserId)) return true
  return isKennelPro(normalizePlan(args.ownerPlan))
}

/**
 * Para una página extra, decide si debe servirse pública dado el contenido
 * disponible. Si está toggle on PERO la tabla detrás está vacía, NO se
 * muestra al público (404 / hidden del menú) — pero el admin sí la ve para
 * llenarla.
 */
export function hasPublishableContent(args: {
  page: ExtraPageId
  // about
  aboutMd?: string | null
  // galeria / instalaciones
  galleryCount?: number
  facilitiesCount?: number
  // blog
  publishedPostsCount?: number
}): boolean {
  switch (args.page) {
    case 'sobre':
      return !!(args.aboutMd && args.aboutMd.trim().length >= 50)
    case 'instalaciones':
      return (args.facilitiesCount || 0) >= 3
    case 'galeria':
      return (args.galleryCount || 0) >= 3
    case 'blog':
      return (args.publishedPostsCount || 0) >= 1
    default:
      return false
  }
}
