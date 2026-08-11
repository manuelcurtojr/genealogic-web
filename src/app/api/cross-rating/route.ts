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

type EvalSection = { titulo: string; estado: 'bien' | 'atencion' | 'desvia'; comentario: string }
type EvalResult = {
  score: number
  resumen: string
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
  if (s.startsWith('desv') || s === 'mal' || s === 'off') return 'desvia'
  if (s.startsWith('aten') || s === 'warn' || s === 'regular') return 'atencion'
  return 'bien'
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
  const score = typeof obj.score === 'number' ? obj.score : Number(obj.score)
  if (!Number.isFinite(score)) return null
  const secciones: EvalSection[] = Array.isArray(obj.secciones)
    ? obj.secciones
        .filter((s: any) => s && (s.titulo || s.comentario))
        .map((s: any) => ({
          titulo: String(s.titulo ?? ''),
          estado: normEstado(s.estado),
          comentario: String(s.comentario ?? ''),
        }))
    : []
  const toStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter((x) => x.trim() !== '') : []
  return {
    score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)),
    resumen: String(obj.resumen ?? ''),
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
        supabase.from('dogs').select('name').eq('id', dogId).maybeSingle(),
      ])
      const batch = measRes.data && measRes.data.length > 0 ? measRes.data[0] : null
      return { name: (dogRes.data?.name as string) ?? null, batch }
    }
    const [sire, dam] = await Promise.all([loadParent(sireId), loadParent(damId)])

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
      `Eres un juez internacional de conformación canina, especialista en la raza ${breed.name}.`,
      'Evalúas cómo de bien encajaría con el estándar racial la descendencia PROYECTADA de un cruce.',
      'Trabajas con una estimación estadística: para cada medida numérica recibes la media de ambos progenitores (mid-parent value), que aproxima la media esperada de la camada, no un cachorro concreto. Los rasgos cualitativos (caderas, mordida, ojos, etc.) son los de cada progenitor y sirven para valorar salud y estructura heredables.',
      'Sé riguroso y honesto: no infles la nota. Céntrate en lo medible y estructural (tamaño y peso, proporciones, alzada, perímetros, angulaciones). Si una medida cae fuera del rango del estándar, dilo con claridad y explica hacia dónde se desvía.',
      'Cuando el estándar dé rangos (p. ej. alzada o peso por sexo), compáralos con las medias proyectadas. No inventes cifras del estándar que no aparezcan en el texto que te doy.',
    ].join(' ')

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
      'Evalúa este cruce frente al estándar y da una nota GLOBAL de 0 a 10',
      '(0 = muy alejado del estándar; 5 = correcto con reservas; 8-10 = excelente/ejemplar).',
      '',
      'Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después y sin markdown, con esta forma exacta:',
      '{',
      '  "score": number,               // 0 a 10, admite un decimal',
      '  "resumen": string,             // veredicto en 1-2 frases',
      '  "secciones": [                 // una entrada por área relevante del estándar',
      '    { "titulo": string, "estado": "bien" | "atencion" | "desvia", "comentario": string }',
      '  ],',
      '  "fortalezas": string[],        // 2-4 puntos fuertes del cruce respecto al estándar',
      '  "mejoras": string[]            // 2-4 aspectos a vigilar o que se desvían',
      '}',
    ].join('\n')

    // Opus 4.5: máxima calidad de juicio. Volumen bajísimo (solo Irema), así que
    // el coste es despreciable; si algún día se abre a más criaderos, bajar a
    // 'claude-sonnet-4-5' aquí es suficiente.
    const result = await chat({
      modelId: 'claude-opus-4-5',
      system,
      messages: [{ role: 'user', content: userMsg }],
      maxTokens: 2000,
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
