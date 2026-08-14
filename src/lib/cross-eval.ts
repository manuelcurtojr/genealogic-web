import 'server-only'
import { chat } from '@/lib/ai/client'
import { NUMERIC_SECTIONS, QUALITATIVE_FIELDS } from '@/lib/measurements-fields'
import { sexStandardFor, indicesFor } from '@/lib/breed-sex-standards'

/**
 * Motor compartido del "juez de conformación" con IA. Lo usan por igual:
 *  - /api/cross-rating  (evalúa un CRUCE: proyección por sexo de la camada)
 *  - /api/dog-rating    (evalúa UN PERRO: sus medidas reales vs el rango de su sexo)
 *
 * Ambos comparten el mismo juez (rigor, 3 niveles de falta con gate, ponderación
 * derivada del estándar, escala cinológica 0-10, honestidad con datos faltantes,
 * relevancia por sección) y el mismo esquema de respuesta. Solo cambia el bloque
 * de datos que se le pasa. Aquí vive todo lo común para no duplicar/desincronizar.
 */

export type StandardSection = { key?: string; title?: string; content?: string }

export type EvalSection = {
  titulo: string
  nota: number | null // 0-10 de ESA característica sola (null = no valorable / sin dato)
  relevancia: 'esencial' | 'secundario' | 'menor'
  estado: 'bien' | 'atencion' | 'desvia' | 'sin_datos'
  comentario: string
}
export type EvalResult = {
  score: number
  calificacion: string
  resumen: string
  gate: { motivo: string } | null
  secciones: EvalSection[]
  fortalezas: string[]
  mejoras: string[]
}

// ── Helpers de datos (compartidos por ambos endpoints) ──────────────────────
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
export function qual(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}
export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** breeds.genealogic_standard (JSONB con sections[]) → texto plano para el prompt. */
export function standardTextFrom(genealogicStandard: unknown): string {
  const raw = genealogicStandard as { sections?: StandardSection[] }
  const sections = Array.isArray(raw?.sections) ? raw.sections : []
  return sections
    .map((s) => `### ${s.title ?? s.key ?? ''}\n${(s.content ?? '').trim()}`)
    .join('\n\n')
    .trim()
}

// ── Bloques de prompt compartidos ───────────────────────────────────────────
/** Reglas del juez comunes a cruce y perro (la línea de "cómo interpretar los
 *  datos" es específica de cada modo y se antepone a estas). */
export const JUDGE_RULES: string[] = [
  '- NO todo pesa igual. Pondera cada aspecto según la importancia que le dé ESTE estándar: lo que define el TIPO racial (apariencia general, proporciones importantes, cabeza cuando es el sello de la raza, talla y sustancia) manda; los detalles (longitud de cola, un premolar ausente…) apenas mueven la nota. La ponderación la deduces del propio estándar, no de una regla fija.',
  '- Jerarquía de faltas: distingue faltas menores, faltas graves y faltas DESCALIFICANTES/eliminatorias. Un factor descalificante (p. ej. talla claramente fuera de rango, mordida descalificante) TOPA la nota por muy bueno que sea el resto: no se promedia. Cuando eso ocurra, márcalo en "gate".',
  '- Sé honesto y no infles. Si una medida se sale del rango del estándar, dilo y explica hacia dónde se desvía. Si NO puedes valorar un aspecto porque faltan medidas, dilo ("sin_datos") en vez de inventar una nota. Distingue "se desvía" de "no lo puedo evaluar".',
  '- Usa solo cifras del estándar que te doy; no inventes rangos que no aparezcan en el texto.',
  '- Si te doy ÍNDICES morfológicos (proporciones, p. ej. perímetro torácico sobre alzada), júzgalos por su OBJETIVO indicado, NO en cifras absolutas: una proporción define el tipo mejor que una medida suelta. Donde diga "más es mejor" (tórax amplio = sustancia), premia el exceso en vez de penalizarlo.',
  '- Puntúa CADA característica/área por separado con su propia nota 0-10 (esa característica sola, con la misma escala). La nota GLOBAL no es la media de esas notas: es el conjunto ponderado por la importancia de cada área en el estándar (un fallo en algo esencial baja mucho; en algo menor, poco).',
]

/**
 * Criterios de cría del propietario (Presa Canario), que se aplican ADEMÁS del
 * estándar (no en su contra). Hoy la feature es exclusiva de Irema; si se abre a
 * más criaderos, habría que hacerlos configurables por criadero/raza.
 */
export const BREEDER_CRITERIA: string[] = [
  'CRITERIOS DEL CRIADOR (aplícalos ADEMÁS del estándar, nunca en su contra):',
  '- Talla: el criador busca la parte ALTA del rango (talla máxima del estándar), en AMBOS sexos, porque es lo más típico y lo que más valor tiene en esta raza. Por tanto: la SUBTALLA (por debajo del mínimo) es una falta real, no la minimices; dentro del rango, cuanto más cerca del máximo mejor, y considera "pequeño"/mejorable lo que caiga en la parte baja del rango aunque sea válido; NO premies lo pequeño. Rebasar el máximo de alzada NO descalifica si el perro mantiene la proporción correcta entre extremidades y volumen de tronco; solo penaliza si pierde esa proporción.',
  '- Peso: el estándar da una "media", no un tope rígido. La masa y la sustancia por encima de esa media, si son proporcionadas, son DESEABLES (no una falta): en un molosón de presa se busca perro macizo y potente.',
  '- Dimorfismo sexual NO simétrico: un MACHO afeminado (poca sustancia, hueso ligero, cabeza pobre) es falta; una HEMBRA sustanciosa, potente y de buen hueso NO es una falta, es DESEABLE — nunca la penalices por "masculina" ni por tener sustancia. La falta en la hembra es lo contrario: débil, fina, sin sustancia ni hueso.',
  '- Sustancia (hueso, potencia, masa, cabeza acorde) se valora ALTO en ambos sexos: es sello de tipo, no un extra.',
  '- No dejes que la talla eclipse el resto: cabeza, tipo racial, proporciones y sustancia pesan tanto o más que la talla, aunque solo los puedas juzgar por el texto del estándar y los rasgos cualitativos, no con un número.',
]

/** Escala 0-10 anclada a las calificaciones cinológicas. */
export const SCALE_LINES: string[] = [
  'Escala 0-10 anclada a las calificaciones cinológicas:',
  '- 9-10 Excelente: ejemplar de cría, muy cerca del ideal del estándar.',
  '- 7-8.9 Muy Bueno: buen ejemplar, típico, con fallos menores.',
  '- 5-6.9 Bueno: correcto y mejorable; fallos que no comprometen el tipo. Un 6-7 NO es un mal resultado.',
  '- 3.5-4.9 Suficiente: aceptable pero con defectos claros.',
  '- 0-3.4 Insuficiente: se aleja del estándar o hay un factor descalificante.',
]

/** Instrucciones del JSON de salida (idénticas para cruce y perro). */
export const SCHEMA_LINES: string[] = [
  'Cada sección lleva su propia nota 0-10 de ESA característica. La nota GLOBAL "score" NO es la media aritmética de las secciones: es el conjunto ponderado por la importancia de cada área en el estándar.',
  'Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después y sin markdown, con esta forma exacta:',
  '{',
  '  "score": number,                    // 0 a 10, un decimal, GLOBAL ponderado (no la media de secciones)',
  '  "calificacion": string,             // "Excelente" | "Muy Bueno" | "Bueno" | "Suficiente" | "Insuficiente"',
  '  "resumen": string,                  // veredicto en 1-2 frases',
  '  "gate": null,                       // { "motivo": string } SOLO si un factor descalificante topa la nota; si no, null',
  '  "secciones": [                      // una entrada por área relevante del estándar',
  '    {',
  '      "titulo": string,',
  '      "nota": number,                                          // 0-10 de ESTA característica sola (un decimal, misma escala); null si no valorable',
  '      "relevancia": "esencial" | "secundario" | "menor",       // peso que le da ESTE estándar',
  '      "estado": "bien" | "atencion" | "desvia" | "sin_datos",  // sin_datos = no valorable por falta de datos',
  '      "comentario": string',
  '    }',
  '  ],',
  '  "fortalezas": string[],             // 2-4 puntos fuertes respecto al estándar',
  '  "mejoras": string[]                 // 2-4 aspectos a vigilar o que se desvían',
  '}',
]

// ── Parseo del JSON del modelo ──────────────────────────────────────────────
function normEstado(v: unknown): EvalSection['estado'] {
  const s = String(v ?? '').toLowerCase()
  if (s.startsWith('sin') || s.includes('sin_datos') || s === 'nodata' || s === 'n/a') return 'sin_datos'
  if (s.startsWith('desv') || s === 'mal' || s === 'off') return 'desvia'
  if (s.startsWith('aten') || s === 'warn' || s === 'regular') return 'atencion'
  return 'bien'
}
function normRelevancia(v: unknown): EvalSection['relevancia'] {
  const s = String(v ?? '').toLowerCase()
  if (s.startsWith('esenc') || s === 'alta' || s === 'alto' || s === 'high') return 'esencial'
  if (s.startsWith('men') || s === 'baja' || s === 'bajo' || s === 'low') return 'menor'
  return 'secundario'
}
/** Palabra de calificación cinológica según la nota (fallback si el modelo no la da). */
function gradeFor(s: number): string {
  if (s >= 9) return 'Excelente'
  if (s >= 7) return 'Muy Bueno'
  if (s >= 5) return 'Bueno'
  if (s >= 3.5) return 'Suficiente'
  return 'Insuficiente'
}
/** Nota 0-10 (un decimal) o null si no es un número válido. Para notas por sección/aspecto. */
function clampScore(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n * 10) / 10)) : null
}
/** Extrae el primer objeto JSON de la respuesta del modelo (tolera fences/texto extra). */
function extractJsonObject(text: string): any | null {
  if (!text) return null
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(t.slice(start, end + 1))
  } catch {
    return null
  }
}

function parseEval(text: string): EvalResult | null {
  const obj = extractJsonObject(text)
  if (!obj) return null
  const rawScore = typeof obj.score === 'number' ? obj.score : Number(obj.score)
  if (!Number.isFinite(rawScore)) return null
  const score = Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10))
  const secciones: EvalSection[] = Array.isArray(obj.secciones)
    ? obj.secciones
        .filter((s: any) => s && (s.titulo || s.comentario))
        .map((s: any) => ({
          titulo: String(s.titulo ?? ''),
          nota: clampScore(s.nota),
          relevancia: normRelevancia(s.relevancia),
          estado: normEstado(s.estado),
          comentario: String(s.comentario ?? ''),
        }))
    : []
  const toStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter((x) => x.trim() !== '') : []
  const gate =
    obj.gate && typeof obj.gate === 'object' && obj.gate.motivo
      ? { motivo: String(obj.gate.motivo) }
      : null
  return {
    score,
    calificacion: String(obj.calificacion ?? '').trim() || gradeFor(score),
    resumen: String(obj.resumen ?? ''),
    gate,
    secciones,
    fortalezas: toStrArr(obj.fortalezas),
    mejoras: toStrArr(obj.mejoras),
  }
}

/**
 * Ejecuta la evaluación: llama al modelo (Opus 4.5, coste despreciable a volumen
 * bajo; si se abre a más criaderos, bajar a 'claude-sonnet-4-5') y parsea. Si no
 * se puede estructurar, devuelve el texto crudo para no perder el análisis.
 */
export async function runStandardEval(
  system: string,
  userMsg: string,
): Promise<{ result: EvalResult | null; raw: string }> {
  const res = await chat({
    modelId: 'claude-opus-4-5',
    system,
    messages: [{ role: 'user', content: userMsg }],
    maxTokens: 2500,
    temperature: 0.4,
  })
  return { result: parseEval(res.text), raw: res.text }
}

/**
 * Formatea los índices morfológicos (proporciones del estándar) a partir de una
 * función que da el valor de cada columna: para un perro, su medida; para un
 * cruce, la media de los progenitores. Devuelve las filas o null si no hay datos.
 */
function indicesTextGeneric(getVal: (col: string) => number | null, breedId: string): string | null {
  const defs = indicesFor(breedId)
  if (!defs) return null
  const rows: string[] = []
  for (const d of defs) {
    const n = getVal(d.numCol)
    const den = getVal(d.denCol)
    if (n === null || den === null || den === 0) continue
    const v = n / den
    const tgt =
      d.max !== undefined
        ? `objetivo ${d.min}–${d.max}`
        : `objetivo ≥ ${d.min}${d.moreIsBetter ? ', más es mejor' : ''}`
    rows.push(`  - ${d.label}: ${v.toFixed(2)} (${tgt}). ${d.note}`)
  }
  return rows.length ? rows.join('\n') : null
}

/** Índices morfológicos proyectados de un cruce (media de ambos progenitores). */
export function crossIndicesText(
  sireBatch: Record<string, any>,
  damBatch: Record<string, any>,
  breedId: string,
): string | null {
  const avg = (c: string): number | null => {
    const s = num(sireBatch[c])
    const d = num(damBatch[c])
    if (s === null && d === null) return null
    if (s === null) return d
    if (d === null) return s
    return (s + d) / 2
  }
  return indicesTextGeneric(avg, breedId)
}

/**
 * Texto de las medidas de UN perro para el prompt: numéricas (en talla/peso con el
 * rango de su sexo) + índices morfológicos (proporciones) + cualitativas. Se usa
 * en /api/dog-rating y /api/compare-rating.
 */
export function dogMeasurementsText(batch: Record<string, any>, sex: string, breedId: string): string {
  const sexRef = sexStandardFor(breedId)
  const sexKey: 'm' | 'f' = sex === 'female' ? 'f' : 'm'
  const sexWord = sex === 'female' ? 'hembra' : 'macho'
  const numBlocks: string[] = []
  for (const section of NUMERIC_SECTIONS) {
    const rows: string[] = []
    for (const f of section.fields) {
      const v = num(batch[f.col])
      if (v === null) continue
      const ref = sexRef?.[f.col]
      if (ref) {
        const r = ref[sexKey]
        rows.push(`  - ${f.label}: ${fmt(v)} (rango ${sexWord}s ${fmt(r.min)}–${fmt(r.max)})`)
      } else {
        rows.push(`  - ${f.label}: ${fmt(v)}`)
      }
    }
    if (rows.length) numBlocks.push(`${section.title}:\n${rows.join('\n')}`)
  }
  const qualRows: string[] = []
  for (const f of QUALITATIVE_FIELDS) {
    const v = qual(batch[f.col])
    if (!v) continue
    qualRows.push(`  - ${f.label}: ${v}`)
  }
  const idx = indicesTextGeneric((c) => num(batch[c]), breedId)
  return [
    'Medidas (en talla y peso, con el rango de su sexo):',
    numBlocks.length ? numBlocks.join('\n') : '  (sin medidas numéricas)',
    ...(idx ? ['', 'Índices morfológicos (proporciones del estándar; júzgalos por su objetivo, no en cm absolutos):', idx] : []),
    '',
    'Rasgos cualitativos:',
    qualRows.length ? qualRows.join('\n') : '  (sin rasgos cualitativos)',
  ].join('\n')
}

// ── Comparador de dos perros vs estándar ────────────────────────────────────
export type CompareDog = { score: number; calificacion: string; resumen: string }
export type CompareDiff = {
  aspecto: string
  notaA: number | null // 0-10 del perro A en ese aspecto
  notaB: number | null // 0-10 del perro B en ese aspecto
  detalle: string
  ventaja: 'a' | 'b' | 'igual'
}
export type CompareResult = {
  perroA: CompareDog
  perroB: CompareDog
  diferencias: CompareDiff[]
  veredicto: string
}

/** Esquema JSON del comparador (nota a cada perro + diferencias + veredicto). */
export const COMPARE_SCHEMA_LINES: string[] = [
  'Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después y sin markdown, con esta forma exacta:',
  '{',
  '  "perro_a": { "score": number, "calificacion": string, "resumen": string },  // A vs estándar (0-10 y escala)',
  '  "perro_b": { "score": number, "calificacion": string, "resumen": string },  // B vs estándar',
  '  "diferencias": [                    // dónde difieren DE VERDAD (no listes lo que es prácticamente igual)',
  '    { "aspecto": string, "nota_a": number, "nota_b": number, "detalle": string, "ventaja": "a" | "b" | "igual" }  // nota_a/nota_b = 0-10 de cada perro en ese aspecto; ventaja = quién se acerca más al estándar',
  '  ],',
  '  "veredicto": string                 // 1-2 frases: cuál es MEJOR EJEMPLAR según el estándar y la diferencia clave. Es una COMPARACIÓN, no un cruce: NO hables de complementarse/compensarse ni de criar.',
  '}',
]

function normVentaja(v: unknown): CompareDiff['ventaja'] {
  const s = String(v ?? '').toLowerCase()
  if (s === 'a') return 'a'
  if (s === 'b') return 'b'
  return 'igual'
}
function parseCompareDog(o: any): CompareDog | null {
  const raw = typeof o?.score === 'number' ? o.score : Number(o?.score)
  if (!Number.isFinite(raw)) return null
  const score = Math.max(0, Math.min(10, Math.round(raw * 10) / 10))
  return { score, calificacion: String(o?.calificacion ?? '').trim() || gradeFor(score), resumen: String(o?.resumen ?? '') }
}
function parseCompareEval(text: string): CompareResult | null {
  const obj = extractJsonObject(text)
  if (!obj) return null
  const a = parseCompareDog(obj.perro_a)
  const b = parseCompareDog(obj.perro_b)
  if (!a || !b) return null
  const diferencias: CompareDiff[] = Array.isArray(obj.diferencias)
    ? obj.diferencias
        .filter((d: any) => d && (d.aspecto || d.detalle))
        .map((d: any) => ({
          aspecto: String(d.aspecto ?? ''),
          notaA: clampScore(d.nota_a),
          notaB: clampScore(d.nota_b),
          detalle: String(d.detalle ?? ''),
          ventaja: normVentaja(d.ventaja),
        }))
    : []
  return { perroA: a, perroB: b, diferencias, veredicto: String(obj.veredicto ?? '') }
}

export async function runCompareEval(
  system: string,
  userMsg: string,
): Promise<{ result: CompareResult | null; raw: string }> {
  const res = await chat({
    modelId: 'claude-opus-4-5',
    system,
    messages: [{ role: 'user', content: userMsg }],
    maxTokens: 2500,
    temperature: 0.4,
  })
  return { result: parseCompareEval(res.text), raw: res.text }
}
