/**
 * Tokens (y patrones) que CUALQUIER versión de un contrato debe contener
 * para ser válido legalmente. Pensado para validar el "modo avanzado"
 * markdown donde el criador edita libre — si borra algo crítico (como
 * {{clientName}} o {{legalName}}), el contrato queda inservible.
 *
 * Cada token tiene:
 *   - `token`: la clave que debe aparecer (se busca como `{{token}}`)
 *   - `label`: nombre humano para la UI
 *   - `appliesTo`: ['reservation', 'delivery'] — solo en algunos kinds
 *
 * Diseño: minimal y conservador. Solo lo IMPRESCINDIBLE para que el
 * contrato identifique las dos partes + fecha + objeto del contrato.
 */

import type { ContractKind } from './templates'

export interface RequiredToken {
  token: string
  label: string
  appliesTo: ContractKind[]
}

export const REQUIRED_TOKENS: RequiredToken[] = [
  // ─── Identidad del criador ───
  { token: 'legalName', label: 'Razón social del criadero', appliesTo: ['reservation', 'delivery'] },
  // ─── Identidad del cliente ───
  { token: 'clientName', label: 'Nombre del cliente', appliesTo: ['reservation', 'delivery'] },
  // ─── Fecha ───
  { token: 'todayDate', label: 'Fecha de firma', appliesTo: ['reservation', 'delivery'] },
  // ─── Económico ───
  { token: 'totalPrice', label: 'Precio total', appliesTo: ['reservation', 'delivery'] },
  { token: 'depositAmount', label: 'Importe de la señal', appliesTo: ['reservation', 'delivery'] },
  // ─── Identificación del cachorro (solo delivery, en reserva puede ser
  //     abstracto si aún no hay perro asignado) ───
  { token: 'dogName', label: 'Nombre del cachorro', appliesTo: ['delivery'] },
  { token: 'microchip', label: 'Microchip del cachorro', appliesTo: ['delivery'] },
]

export interface ValidationResult {
  ok: boolean
  missing: RequiredToken[]
  present: RequiredToken[]
}

/**
 * Valida que el body markdown contenga TODOS los tokens requeridos para
 * el kind dado. Devuelve qué tokens están presentes y cuáles faltan.
 *
 * Busca tanto la forma `{{token}}` como `{{ token }}` (con espacios).
 * No valida que los tokens tengan valor — solo que aparezcan en el
 * markdown, asumiendo que el render los rellena con datos reales.
 */
export function validateContractBody(body: string, kind: ContractKind): ValidationResult {
  const applicable = REQUIRED_TOKENS.filter((r) => r.appliesTo.includes(kind))
  const present: RequiredToken[] = []
  const missing: RequiredToken[] = []
  for (const r of applicable) {
    const re = new RegExp(`\\{\\{\\s*${r.token}\\s*\\}\\}`)
    if (re.test(body)) present.push(r)
    else missing.push(r)
  }
  return { ok: missing.length === 0, missing, present }
}
