/**
 * Sistema de secciones del perfil público de criadero (/kennels/[slug]).
 *
 * El perfil tiene SECCIONES BASE (siempre visibles, no se pueden desactivar)
 * y SECCIONES EXTRA (toggleables, gated por plan Kennel Pro / enterprise).
 *
 * Las secciones extra existen para que los criaderos Pro puedan "completar"
 * su perfil hasta que parezca una web real — sin builder, sin HTML, todo
 * autorellenado desde tablas que ya tenemos en DB.
 *
 * Para añadir una sección nueva:
 *   1) Añadir su id a SectionId
 *   2) Añadirla a SECTION_META con label + descripción
 *   3) Si depende de una tabla con datos, ponerle hasContent() que devuelva
 *      true cuando hay datos para mostrarla
 *   4) Renderizarla en /kennels/[id]/page.tsx leyendo isSectionEnabled()
 */

/** IDs canónicos de secciones extra. Las base no van aquí. */
export type SectionId =
  | 'awards'
  | 'gallery'
  | 'facilities'
  | 'blog'
  | 'faq'

export type SectionMeta = {
  id: SectionId
  label: string
  description: string
  /** ¿Está esta sección detrás de Kennel Pro? Solo enterprise/Kennel Pro
   *  pueden activarla. Hoy todas las extra lo están. */
  isPro: boolean
}

export const SECTION_META: Record<SectionId, SectionMeta> = {
  awards:     { id: 'awards',     label: 'Logros y premios',         description: 'Resalta los awards de los perros del criadero.',                   isPro: true },
  gallery:    { id: 'gallery',    label: 'Galería',                   description: 'Fotos generales del criadero, perros y eventos.',                  isPro: true },
  facilities: { id: 'facilities', label: 'Instalaciones',             description: 'Tour visual de las instalaciones donde viven los perros.',         isPro: true },
  blog:       { id: 'blog',       label: 'Blog',                      description: 'Últimos posts publicados del criadero.',                           isPro: true },
  faq:        { id: 'faq',        label: 'Preguntas frecuentes',      description: 'FAQ pública pensada para resolver dudas habituales de clientes.',  isPro: true },
}

export const ALL_SECTION_IDS: SectionId[] = (Object.keys(SECTION_META) as SectionId[])

/** Lee la sección X del jsonb enabled_sections con default false. */
export function isSectionEnabled(
  enabledSections: Record<string, unknown> | null | undefined,
  id: SectionId,
): boolean {
  if (!enabledSections) return false
  return enabledSections[id] === true
}

/**
 * Para mostrar correctamente el toggle en el panel admin:
 *  - El user enterprise (kennel_pro hardcoded) puede activar todo
 *  - El user kennel_pro real puede activar todo (cuando se abra)
 *  - El user en kennel/free ve las secciones Pro deshabilitadas con
 *    badge "Próximamente"
 */
export function canToggleSection(args: {
  section: SectionId
  isKennelPro: boolean
}): boolean {
  const meta = SECTION_META[args.section]
  if (meta.isPro && !args.isKennelPro) return false
  return true
}
