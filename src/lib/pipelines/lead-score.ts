/**
 * Nota de calidad del lead — heurística determinista (SIN IA: gratis,
 * instantánea, explicable).
 *
 * Calibrada con las 164 solicitudes reales de Irema Curtó: los mensajes
 * detallados y explicativos (cuentan vivienda, experiencia con perros,
 * familia, propósito razonado y preguntas concretas) sacan nota alta; los
 * secos ("Excellent", "Terreno 500m2", "Buena en terreno") sacan nota baja
 * aunque traigan teléfono y propósito del formulario.
 *
 * Devuelve score 1-5 + etiqueta + motivos (para el tooltip de la tarjeta).
 */
import type { FunnelEntry } from './types'

// Señales de que el solicitante explica su situación real (no una frase seca).
const CONTEXT_RE =
  /casa|piso|parcela|terreno|finca|jard|chalet|vivienda|espacio|azotea|experiencia|he tenido|tuve|hemos tenido|criado|familia|hijos?|niñ|camada|precio|disponib|entrega|criar|cr[ií]a|educ|adiestr|trabaj|guarda|defensa|compañ|pastor|mach[oa]|hembra|l[ií]nea|salud|test|adopt|responsab|cachorro/gi

export type LeadScore = {
  score: 1 | 2 | 3 | 4 | 5
  label: 'Baja' | 'Media' | 'Alta'
  reasons: string[]
}

export function scoreLead(
  entry: Pick<
    FunnelEntry,
    'applicant_message' | 'applicant_phone' | 'applicant_purpose'
  >,
): LeadScore {
  const msg = (entry.applicant_message || '').trim()
  const len = msg.length
  const reasons: string[] = []
  let raw = 0

  // 1) Detalle del mensaje (el mejor predictor según los datos de Irema).
  if (len >= 500) {
    raw += 3
    reasons.push('Mensaje muy detallado')
  } else if (len >= 250) {
    raw += 2
    reasons.push('Mensaje detallado')
  } else if (len >= 100) {
    raw += 1
    reasons.push('Mensaje con algo de contexto')
  } else if (len < 20) {
    raw -= 1
    reasons.push('Mensaje muy escueto')
  }

  // 2) Cuenta su situación real (vivienda, experiencia, familia, preguntas…).
  const hits = (msg.match(CONTEXT_RE) || []).length
  if (hits >= 3) {
    raw += 2
    reasons.push('Explica su situación (vivienda, experiencia, familia…)')
  } else if (hits >= 1) {
    raw += 1
  }

  // 3) Completitud del contacto.
  if (entry.applicant_phone) {
    raw += 1
    reasons.push('Deja teléfono')
  }
  if (entry.applicant_purpose) {
    raw += 1
    reasons.push('Indica el propósito')
  }

  // Mapear raw (~ -1..7) a 1-5.
  let score: LeadScore['score']
  if (raw <= 1) score = 1
  else if (raw === 2) score = 2
  else if (raw <= 4) score = 3
  else if (raw <= 6) score = 4
  else score = 5

  const label: LeadScore['label'] =
    score >= 4 ? 'Alta' : score === 3 ? 'Media' : 'Baja'
  return { score, label, reasons }
}
