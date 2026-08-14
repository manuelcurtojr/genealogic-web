import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseMeasurements } from '@/lib/permissions'
import { NUMERIC_SECTIONS, QUALITATIVE_FIELDS } from '@/lib/measurements-fields'
import { sexStandardFor, projectBySex } from '@/lib/breed-sex-standards'
import {
  num, qual, fmt, standardTextFrom, runStandardEval, crossIndicesText,
  JUDGE_RULES, BREEDER_CRITERIA, SCALE_LINES, SCHEMA_LINES,
} from '@/lib/cross-eval'

export const maxDuration = 60

/**
 * POST /api/cross-rating — evalúa con IA cómo encaja un CRUCE (macho × hembra) con
 * el estándar de una raza. Talla/peso van proyectados por sexo (dimorfismo); el
 * resto como media de los progenitores. El juez es compartido (@/lib/cross-eval).
 *
 * Body: { sireId, damId, breedId }. Gate: exclusiva de Irema (canUseMeasurements).
 */

// Rate limit simple (in-memory): 1 evaluación cada ~8s por usuario.
const lastCall = new Map<string, number>()
const RL_MS = 8_000

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    if (!canUseMeasurements(user.id)) {
      return NextResponse.json({ error: 'Feature no disponible' }, { status: 403 })
    }

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

    // 1) Medidas + nombre/dueño de cada progenitor (RLS: solo del dueño).
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

    // Propiedad: solo el dueño de AMBOS perros puede evaluar el cruce.
    if (sire.ownerId !== user.id || dam.ownerId !== user.id) {
      return NextResponse.json({ error: 'No eres el propietario de estos perros.' }, { status: 403 })
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
      return NextResponse.json({ error: 'La raza seleccionada no tiene estándar cargado.' }, { status: 404 })
    }

    // 3) Datos del cruce: talla/peso proyectados POR SEXO + resto media + cualitativas.
    const sexRef = sexStandardFor(breedId)
    const sexLines: string[] = []
    const familyBlocks: string[] = []

    for (const section of NUMERIC_SECTIONS) {
      const rows: string[] = []
      for (const f of section.fields) {
        const s = num(sire.batch[f.col])
        const d = num(dam.batch[f.col])
        if (s === null && d === null) continue
        const ref = sexRef?.[f.col]
        if (ref && s !== null && d !== null) {
          const p = projectBySex(s, d, ref)
          sexLines.push(
            `  - ${f.label}: macho proyectado ${fmt(p.male)} (rango machos ${fmt(ref.m.min)}–${fmt(ref.m.max)}) · hembra proyectada ${fmt(p.female)} (rango hembras ${fmt(ref.f.min)}–${fmt(ref.f.max)})`,
          )
          continue
        }
        const parts = [`padre ${s !== null ? fmt(s) : '—'}`, `madre ${d !== null ? fmt(d) : '—'}`]
        if (s !== null && d !== null) parts.push(`media ${fmt((s + d) / 2)}`)
        rows.push(`  - ${f.label}: ${parts.join(', ')}`)
      }
      if (rows.length) familyBlocks.push(`${section.title}:\n${rows.join('\n')}`)
    }
    const qualRows: string[] = []
    for (const f of QUALITATIVE_FIELDS) {
      const s = qual(sire.batch[f.col])
      const d = qual(dam.batch[f.col])
      if (!s && !d) continue
      qualRows.push(`  - ${f.label}: padre ${s ?? '—'} / madre ${d ?? '—'}`)
    }

    const standardText = standardTextFrom(breed.genealogic_standard)
    const crossIdx = crossIndicesText(sire.batch, dam.batch, breedId)
    const sireName = sire.name || 'el padre'
    const damName = dam.name || 'la madre'

    // 4) Prompt (juez compartido + parte específica del cruce).
    const system = [
      `Eres un juez internacional de conformación canina, especialista en la raza ${breed.name}, y también seleccionador de cría. Evalúas cómo de bien encajaría con el estándar racial la descendencia PROYECTADA de un cruce.`,
      '',
      'Cómo trabajas:',
      '- Talla y peso: recibes la proyección POR SEXO (macho y hembra proyectados por separado), porque el dimorfismo sexual hace que la media simple no represente a ninguno de los dos. Resto de medidas: la media de los progenitores (mid-parent), que aproxima la media de la camada, no un cachorro concreto. Los rasgos cualitativos (caderas, mordida, boca…) son los de cada progenitor y valoran salud y estructura heredables.',
      ...JUDGE_RULES,
      '',
      ...BREEDER_CRITERIA,
      '',
      ...SCALE_LINES,
    ].join('\n')

    const userMsg = [
      `ESTÁNDAR RACIAL — ${breed.name}:`,
      standardText || '(sin secciones)',
      '',
      `CRUCE A EVALUAR — ${sireName} (macho) × ${damName} (hembra)`,
      '',
      'TALLA Y PESO — proyección POR SEXO. Por el dimorfismo sexual la media simple no representa ni a un macho ni a una hembra, así que te doy el macho proyectado y la hembra proyectada por separado (ya calculados). Juzga el macho proyectado contra el rango de machos y la hembra proyectada contra el de hembras:',
      sexLines.length ? sexLines.join('\n') : '  (sin proyección por sexo para esta raza/datos)',
      '',
      'RESTO DE MEDIDAS — media de los progenitores (NO distingue sexo; no penalices a un macho por una media que incluye a la madre, ni al revés):',
      familyBlocks.length ? familyBlocks.join('\n') : '  (sin más medidas comunes)',
      '',
      ...(crossIdx
        ? [
            'ÍNDICES MORFOLÓGICOS PROYECTADOS (proporciones del estándar, media de los progenitores) — júzgalos por su objetivo, NO en cm absolutos:',
            crossIdx,
            '',
          ]
        : []),
      'Rasgos cualitativos de los progenitores (no se promedian):',
      qualRows.length ? qualRows.join('\n') : '  (sin rasgos cualitativos registrados)',
      '',
      'Evalúa este cruce frente al estándar y puntúalo con la escala cinológica descrita (Insuficiente → Excelente), ponderando cada área por su peso en ESTE estándar.',
      '',
      ...SCHEMA_LINES,
    ].join('\n')

    const { result, raw } = await runStandardEval(system, userMsg)
    if (!result) return NextResponse.json({ breedName: breed.name, raw })
    return NextResponse.json({ breedName: breed.name, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error evaluando el cruce.' }, { status: 500 })
  }
}
