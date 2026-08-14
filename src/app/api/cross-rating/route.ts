import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chat } from '@/lib/ai/client'
import { canUseMeasurements } from '@/lib/permissions'
import { NUMERIC_SECTIONS, QUALITATIVE_FIELDS } from '@/lib/measurements-fields'

export const maxDuration = 60

/**
 * POST /api/cross-rating
 *
 * Evalúa con IA (Claude, vía el wrapper `chat()` que ya usa ANTHROPIC_API_KEY)
 * cómo encaja un cruce hipotético (macho × hembra) con el estándar de una raza.
 *
 * - Toma la última tanda de medidas de CADA progenitor (dog_measurements) y
 *   calcula la media proyectada (mid-parent) de cada medida numérica.
 * - Carga el estándar de la raza (breeds.genealogic_standard, 12 secciones).
 * - Pide a Claude una nota 0-10 + análisis por secciones + fortalezas/mejoras.
 *
 * Body: { sireId, damId, breedId }
 * Gate: exclusiva de Irema (misma feature-flag que las medidas). Volumen bajo.
 */

// Rate limit simple (in-memory): 1 evaluación cada ~8s por usuario. Cada eval
// es 1 sola llamada al modelo, así que no necesita el burst del importador.
const lastCall = new Map<string, number>()
const RL_MS = 8_000

type StandardSection = { key?: string; title?: string; content?: string }

type EvalSection = {
  titulo: string
  relevancia: 'esencial' | 'secundario' | 'menor'
  estado: 'bien' | 'atencion' | 'desvia' | 'sin_datos'
  comentario: string
}
type EvalResult = {
  score: number
  calificacion: string
  resumen: string
  gate: { motivo: string } | null
  secciones: EvalSection[]
  fortalezas: string[]
  mejoras: string[]
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
function qual(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === '' ? null : s
}
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

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

/** Extrae el JSON de la respuesta del modelo, tolerando fences y texto extra. */
function parseEval(text: string): EvalResult | null {
  if (!text) return null
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  let obj: any
  try {
    obj = JSON.parse(t.slice(start, end + 1))
  } catch {
    return null
  }
  const rawScore = typeof obj.score === 'number' ? obj.score : Number(obj.score)
  if (!Number.isFinite(rawScore)) return null
  const score = Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10))
  const secciones: EvalSection[] = Array.isArray(obj.secciones)
    ? obj.secciones
        .filter((s: any) => s && (s.titulo || s.comentario))
        .map((s: any) => ({
          titulo: String(s.titulo ?? ''),
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Gate: exclusiva de Irema (misma feature-flag que las medidas).
    if (!canUseMeasurements(user.id)) {
      return NextResponse.json({ error: 'Feature no disponible' }, { status: 403 })
    }

    // Rate limit por usuario.
    const now = Date.now()
    const last = lastCall.get(user.id) ?? 0
    if (now - last < RL_MS) {
      return NextResponse.json(
        { error: 'Espera unos segundos antes de volver a evaluar.' },
        { status: 429 },
      )
    }
    lastCall.set(user.id, now)

    const body = await request.json().catch(() => null)
    const sireId: string | undefined = body?.sireId
    const damId: string | undefined = body?.damId
    const breedId: string | undefined = body?.breedId
    if (!sireId || !damId || !breedId) {
      return NextResponse.json({ error: 'Faltan parámetros (sireId, damId, breedId).' }, { status: 400 })
    }

    // 1) Medidas + nombre de cada progenitor (RLS: solo del dueño).
    const loadParent = async (dogId: string) => {
      const [measRes, dogRes] = await Promise.all([
        supabase
          .from('dog_measurements')
          .select('*')
          .eq('dog_id', dogId)
          .order('measured_at', { ascending: false })
          .limit(1),
        supabase.from('dogs').select('name, owner_id').eq('id', dogId).maybeSingle(),
      ])
      const batch = measRes.data && measRes.data.length > 0 ? measRes.data[0] : null
      return {
        name: (dogRes.data?.name as string) ?? null,
        ownerId: (dogRes.data?.owner_id as string) ?? null,
        batch,
      }
    }
    const [sire, dam] = await Promise.all([loadParent(sireId), loadParent(damId)])

    // Propiedad: solo el dueño de AMBOS perros puede evaluar el cruce. Defensa en
    // profundidad, además del feature-flag (canUseMeasurements) y de la RLS de
    // dog_measurements (owner_id = auth.uid()).
    if (sire.ownerId !== user.id || dam.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'No eres el propietario de estos perros.' },
        { status: 403 },
      )
    }

    if (!sire.batch || !dam.batch) {
      return NextResponse.json(
        {
          error: 'measurements_missing',
          message:
            'Faltan medidas de uno o ambos progenitores. Añádelas en su ficha › pestaña Medidas.',
        },
        { status: 422 },
      )
    }

    // 2) Estándar de la raza.
    const { data: breed } = await supabase
      .from('breeds')
      .select('name, genealogic_standard')
      .eq('id', breedId)
      .maybeSingle()
    if (!breed?.genealogic_standard) {
      return NextResponse.json(
        { error: 'La raza seleccionada no tiene estándar cargado.' },
        { status: 404 },
      )
    }

    // 3) Datos del cruce: numéricas (mid-parent) + cualitativas (lado a lado).
    const numericBlocks: string[] = []
    for (const section of NUMERIC_SECTIONS) {
      const rows: string[] = []
      for (const f of section.fields) {
        const s = num(sire.batch[f.col])
        const d = num(dam.batch[f.col])
        if (s === null && d === null) continue
        const parts = [`padre ${s !== null ? fmt(s) : '—'}`, `madre ${d !== null ? fmt(d) : '—'}`]
        if (s !== null && d !== null) parts.push(`MEDIA proyectada ${fmt((s + d) / 2)}`)
        rows.push(`  - ${f.label}: ${parts.join(', ')}`)
      }
      if (rows.length) numericBlocks.push(`${section.title}:\n${rows.join('\n')}`)
    }
    const qualRows: string[] = []
    for (const f of QUALITATIVE_FIELDS) {
      const s = qual(sire.batch[f.col])
      const d = qual(dam.batch[f.col])
      if (!s && !d) continue
      qualRows.push(`  - ${f.label}: padre ${s ?? '—'} / madre ${d ?? '—'}`)
    }

    // 4) Estándar → texto plano.
    const rawStd = breed.genealogic_standard as { sections?: StandardSection[] }
    const sections = Array.isArray(rawStd?.sections) ? rawStd.sections : []
    const standardText = sections
      .map((s) => `### ${s.title ?? s.key ?? ''}\n${(s.content ?? '').trim()}`)
      .join('\n\n')
      .trim()

    const sireName = sire.name || 'el padre'
    const damName = dam.name || 'la madre'

    // 5) Prompt.
    const system = [
      `Eres un juez internacional de conformación canina, especialista en la raza ${breed.name}, y también seleccionador de cría. Evalúas cómo de bien encajaría con el estándar racial la descendencia PROYECTADA de un cruce.`,
      '',
      'Cómo trabajas:',
      '- Para cada medida numérica recibes la media de ambos progenitores (mid-parent), que aproxima la media esperada de la camada, no un cachorro concreto. Los rasgos cualitativos (caderas, mordida, boca…) son los de cada progenitor y valoran salud y estructura heredables.',
      '- NO todo pesa igual. Pondera cada aspecto según la importancia que le dé ESTE estándar: lo que define el TIPO racial (apariencia general, proporciones importantes, cabeza cuando es el sello de la raza, talla y sustancia) manda; los detalles (longitud de cola, un premolar ausente…) apenas mueven la nota. La ponderación la deduces del propio estándar, no de una regla fija.',
      '- Jerarquía de faltas: distingue faltas menores, faltas graves y faltas DESCALIFICANTES/eliminatorias. Un factor descalificante (p. ej. talla proyectada claramente fuera de rango, mordida descalificante) TOPA la nota por muy bueno que sea el resto: no se promedia. Cuando eso ocurra, márcalo en "gate".',
      '- Sé honesto y no infles. Si una medida se sale del rango del estándar, dilo y explica hacia dónde se desvía. Si NO puedes valorar un aspecto porque faltan medidas, dilo ("sin_datos") en vez de inventar una nota. Distingue "se desvía" de "no lo puedo evaluar".',
      '- Usa solo cifras del estándar que te doy; no inventes rangos que no aparezcan en el texto.',
      '',
      'Escala 0-10 anclada a las calificaciones cinológicas:',
      '- 9-10 Excelente: ejemplar de cría, muy cerca del ideal del estándar.',
      '- 7-8.9 Muy Bueno: buen ejemplar, típico, con fallos menores.',
      '- 5-6.9 Bueno: correcto y mejorable; fallos que no comprometen el tipo. Un 6-7 NO es un mal resultado.',
      '- 3.5-4.9 Suficiente: aceptable pero con defectos claros.',
      '- 0-3.4 Insuficiente: se aleja del estándar o hay un factor descalificante.',
    ].join('\n')

    const userMsg = [
      `ESTÁNDAR RACIAL — ${breed.name}:`,
      standardText || '(sin secciones)',
      '',
      `CRUCE A EVALUAR — ${sireName} (macho) × ${damName} (hembra)`,
      '',
      'Medidas proyectadas de la camada (media de ambos progenitores):',
      numericBlocks.length ? numericBlocks.join('\n') : '  (sin medidas numéricas comunes)',
      '',
      'Rasgos cualitativos de los progenitores (no se promedian):',
      qualRows.length ? qualRows.join('\n') : '  (sin rasgos cualitativos registrados)',
      '',
      'Evalúa este cruce frente al estándar y puntúalo con la escala cinológica descrita (Insuficiente → Excelente), ponderando cada área por su peso en ESTE estándar.',
      '',
      'Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después y sin markdown, con esta forma exacta:',
      '{',
      '  "score": number,                    // 0 a 10, un decimal, según la escala',
      '  "calificacion": string,             // "Excelente" | "Muy Bueno" | "Bueno" | "Suficiente" | "Insuficiente"',
      '  "resumen": string,                  // veredicto en 1-2 frases',
      '  "gate": null,                       // { "motivo": string } SOLO si un factor descalificante topa la nota; si no, null',
      '  "secciones": [                      // una entrada por área relevante del estándar',
      '    {',
      '      "titulo": string,',
      '      "relevancia": "esencial" | "secundario" | "menor",       // peso que le da ESTE estándar',
      '      "estado": "bien" | "atencion" | "desvia" | "sin_datos",  // sin_datos = no valorable por falta de medidas',
      '      "comentario": string',
      '    }',
      '  ],',
      '  "fortalezas": string[],             // 2-4 puntos fuertes respecto al estándar',
      '  "mejoras": string[]                 // 2-4 aspectos a vigilar o que se desvían',
      '}',
    ].join('\n')

    // Opus 4.5: máxima calidad de juicio. Volumen bajísimo (solo Irema), así que
    // el coste es despreciable; si algún día se abre a más criaderos, bajar a
    // 'claude-sonnet-4-5' aquí es suficiente.
    const result = await chat({
      modelId: 'claude-opus-4-5',
      system,
      messages: [{ role: 'user', content: userMsg }],
      maxTokens: 2500,
      temperature: 0.4,
    })

    const parsed = parseEval(result.text)
    if (!parsed) {
      // No pudimos estructurar la respuesta: devolvemos el texto crudo para no
      // perder el análisis (la UI lo muestra tal cual).
      return NextResponse.json({ breedName: breed.name, raw: result.text })
    }

    return NextResponse.json({ breedName: breed.name, ...parsed })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error evaluando el cruce.' },
      { status: 500 },
    )
  }
}
