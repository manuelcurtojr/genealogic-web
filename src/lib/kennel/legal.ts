/**
 * Sistema legal de las webs de criadero — meta + resolución de variables.
 *
 * Documentos legales (aviso legal, privacidad, cookies, términos) que se
 * sirven bajo el dominio del criadero. Cada doc tiene una plantilla GLOBAL
 * por defecto (editable por super-admin) y puede tener un OVERRIDE por
 * criadero. Los textos llevan placeholders {{...}} que se rellenan en runtime
 * con los datos del criadero (modelo RGPD: criadero = responsable; Genealogic
 * / Manuel Curtó SL = encargado/plataforma).
 *
 * Este módulo es PURO (sin acceso a DB): tipos, mapeos slug↔tipo y la
 * construcción de las variables. La query (override vs global) la hace la
 * página/acción con el cliente Supabase.
 */

export type LegalDocType = 'aviso_legal' | 'privacidad' | 'cookies' | 'terminos'

/** Catálogo de documentos: tipo (DB) ↔ slug (URL) ↔ etiqueta (UI). */
export const LEGAL_DOCS: { type: LegalDocType; slug: string; label: string }[] = [
  { type: 'aviso_legal', slug: 'aviso-legal', label: 'Aviso legal' },
  { type: 'privacidad',  slug: 'privacidad',  label: 'Política de privacidad' },
  { type: 'cookies',     slug: 'cookies',     label: 'Política de cookies' },
  { type: 'terminos',    slug: 'terminos',    label: 'Términos y condiciones' },
]

export const LEGAL_SLUG_TO_TYPE: Record<string, LegalDocType> = Object.fromEntries(
  LEGAL_DOCS.map(d => [d.slug, d.type]),
) as Record<string, LegalDocType>

export const LEGAL_TYPE_TO_SLUG: Record<LegalDocType, string> = Object.fromEntries(
  LEGAL_DOCS.map(d => [d.type, d.slug]),
) as Record<LegalDocType, string>

export const LEGAL_TYPE_TO_LABEL: Record<LegalDocType, string> = Object.fromEntries(
  LEGAL_DOCS.map(d => [d.type, d.label]),
) as Record<LegalDocType, string>

// ─── Datos de la plataforma (Manuel Curtó SL) — encargado del tratamiento ──
export const PLATFORM_NAME = 'Genealogic'
export const PLATFORM_LEGAL =
  'Manuel Curtó SL (CIF B56932098), Camino Guillén s/n, 38290 La Esperanza, Tenerife'
export const PLATFORM_EMAIL = 'hola@genealogic.io'

export interface KennelLegalInfo {
  name: string
  legal_name?: string | null
  legal_id?: string | null
  legal_address?: string | null
  legal_email?: string | null
  city?: string | null
  country?: string | null
  slug?: string | null
  custom_domain?: string | null
}

/**
 * Construye el mapa de variables {{clave}} → valor para renderizar un doc.
 * Los campos legales no rellenados caen a fallbacks razonables y, si no hay,
 * a un marcador [entre corchetes] para que se vea que falta completarlo.
 */
export function buildLegalVars(
  k: KennelLegalInfo,
  ownerEmailFallback?: string | null,
): Record<string, string> {
  const location = [k.city, k.country].filter(Boolean).join(', ')
  const domain = k.custom_domain
    ? k.custom_domain
    : `genealogic.io/kennels/${k.slug || ''}`
  const date = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return {
    kennel_name: k.name,
    kennel_legal_name: (k.legal_name || '').trim() || k.name,
    kennel_legal_id: (k.legal_id || '').trim() || '[NIF/CIF pendiente de completar]',
    kennel_legal_address:
      (k.legal_address || '').trim() || location || '[Domicilio pendiente de completar]',
    kennel_legal_email:
      (k.legal_email || '').trim() || ownerEmailFallback || '[Email de contacto pendiente]',
    kennel_location: location || '—',
    site_domain: domain,
    platform: PLATFORM_NAME,
    platform_legal: PLATFORM_LEGAL,
    platform_email: PLATFORM_EMAIL,
    date,
  }
}

/**
 * Sustituye los placeholders {{clave}} de un texto por sus valores. Cualquier
 * placeholder sin valor en el mapa se deja literal (no rompe el render). El
 * renderer de markdown (renderContractMarkdown) solo acepta el string ya
 * resuelto, así que la sustitución se hace aquí antes de renderizar.
 */
export function fillLegalPlaceholders(
  md: string,
  vars: Record<string, string>,
): string {
  return md.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m,
  )
}
