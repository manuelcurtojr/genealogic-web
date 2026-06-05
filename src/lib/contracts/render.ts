/**
 * Motor de relleno de contratos (compartido por criador y cliente).
 *  - buildContractVars: extrae las variables de la reserva según el tipo.
 *  - generateContractBody: genera el markdown final desde la plantilla base
 *    (por kind) o desde una plantilla propia del criador (con {{tokens}}).
 *
 * Se usa al crear el contrato Y al regenerarlo cuando el cliente rellena sus
 * datos (DNI/domicilio) en el paso de firma.
 */
import 'server-only'
import { CONTRACT_TEMPLATES, type ContractKind, type ContractTemplateVars } from './templates'

const sexLabel = (s: string | null | undefined) =>
  s === 'male' ? 'Macho' : s === 'female' ? 'Hembra' : s === 'any' ? 'Indistinto' : undefined

export function buildContractVars(
  reservation: Record<string, unknown>,
  kind: ContractKind,
): ContractTemplateVars {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = reservation as any
  const k = r.kennel || {}
  const dog = r.puppy || r.dog // el cachorro asignado (puppy_dog_id) tiene prioridad
  const isDelivery = kind === 'delivery'
  const extra = r.applicant_extra_data && typeof r.applicant_extra_data === 'object' ? r.applicant_extra_data : {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prefBreed = (extra.preference_breed as any)?.value || extra.preference_breed || undefined
  const fmtPrice = (cents: number | null | undefined, currency = 'EUR') =>
    cents != null ? `${(cents / 100).toFixed(2)} ${currency}` : undefined
  const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('es-ES') : undefined)
  const cur = r.currency || 'EUR'
  return {
    legalName: k.legal_name || k.name || '',
    legalId: k.legal_id || undefined,
    legalAddress: k.legal_address || [k.city, k.country].filter(Boolean).join(', ') || undefined,
    representative: k.legal_representative || undefined,
    representativeId: k.legal_representative_id || undefined,
    signCity: k.sign_city || k.city || undefined,
    jurisdiction: k.jurisdiction || undefined,
    clientName: r.applicant_name || '',
    clientEmail: r.applicant_email || '',
    clientId: r.applicant_id_doc_number || undefined,
    clientAddress:
      [r.applicant_address, r.applicant_postal_code, r.applicant_city].filter(Boolean).join(', ') || undefined,
    breed: isDelivery ? dog?.breed?.name || undefined : dog?.breed?.name || prefBreed || undefined,
    sex: isDelivery ? sexLabel(dog?.sex) : sexLabel(r.preference_sex),
    color: isDelivery ? dog?.color?.name || undefined : r.preference_color || dog?.color?.name || undefined,
    purpose: r.applicant_purpose || undefined,
    preferences: r.preference_notes || r.applicant_message || undefined,
    dogName: dog?.name || undefined,
    birthDate: fmtDate(dog?.birth_date),
    microchip: dog?.microchip || undefined,
    registration: dog?.registration || undefined,
    totalPrice: fmtPrice(r.total_price_cents, cur),
    depositAmount: fmtPrice(r.deposit_amount_cents, cur),
    finalAmount:
      r.total_price_cents != null && r.deposit_amount_cents != null
        ? fmtPrice(r.total_price_cents - r.deposit_amount_cents, cur)
        : undefined,
    todayDate: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    reservationDate: fmtDate(r.deposit_paid_at),
  }
}

/** Sustituye `{{var}}` por su valor; variable ausente → string vacío. */
export function interpolateUserTemplate(body: string, vars: Record<string, string | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const val = vars[key]
    return val == null ? '' : String(val)
  })
}

/**
 * Genera el markdown del contrato. Si `userTemplateBody` se pasa, usa esa
 * plantilla propia del criador (con {{tokens}}); si no, la plantilla base del kind.
 */
export function generateContractBody(
  reservation: Record<string, unknown>,
  kind: ContractKind,
  userTemplateBody?: string | null,
): string {
  const vars = buildContractVars(reservation, kind)
  if (userTemplateBody != null) {
    return interpolateUserTemplate(userTemplateBody, vars as unknown as Record<string, string | undefined>)
  }
  const tpl = CONTRACT_TEMPLATES.find((ct) => ct.kind === kind) ?? CONTRACT_TEMPLATES[0]
  return tpl.body(vars)
}

/**
 * Variante de `generateContractBody` para el fill-form:
 *   - Parte de `buildContractVars(reservation)` (datos del criadero,
 *     reserva, puppy) como base
 *   - Sobrescribe con los valores del formulario (lo que el criador editó)
 *   - Interpola la plantilla (propia o base)
 *
 * Los valores del formulario GANAN sobre los derivados de la reserva. Eso
 * permite, por ejemplo, que el criador ajuste el precio mostrado en el
 * contrato aunque la reserva tenga otro valor (caso de descuento
 * aplicado).
 *
 * Excepción: los datos legales del criadero (`legalName`, `legalId`, etc.)
 * SIEMPRE vienen de BBDD vía buildContractVars y NO se sobrescriben — la
 * UI los muestra como info, no como campos editables.
 */
export function generateContractBodyFromValues(
  reservation: Record<string, unknown>,
  kind: ContractKind,
  formValues: Record<string, string | null | undefined>,
  userTemplateBody?: string | null,
): string {
  const baseVars = buildContractVars(reservation, kind) as unknown as Record<string, string | undefined>
  // Limpia los valores vacíos del form para que el fallback de baseVars
  // funcione (un campo vacío en el form no debería borrar el dato de BBDD).
  const cleanFormValues: Record<string, string> = {}
  for (const [k, v] of Object.entries(formValues || {})) {
    if (v != null && String(v).trim() !== '') cleanFormValues[k] = String(v)
  }
  // Los legalName/legalId/etc. SIEMPRE vienen de BBDD — no se aceptan del form.
  for (const k of [
    'legalName', 'legalId', 'legalAddress',
    'representative', 'representativeId',
    'signCity', 'jurisdiction',
  ]) {
    delete cleanFormValues[k]
  }
  const merged: Record<string, string | undefined> = { ...baseVars, ...cleanFormValues }
  if (userTemplateBody != null) {
    return interpolateUserTemplate(userTemplateBody, merged)
  }
  const tpl = CONTRACT_TEMPLATES.find((ct) => ct.kind === kind) ?? CONTRACT_TEMPLATES[0]
  return tpl.body(merged as unknown as Parameters<typeof tpl.body>[0])
}
