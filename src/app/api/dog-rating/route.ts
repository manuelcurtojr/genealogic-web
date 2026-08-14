import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseMeasurements } from '@/lib/permissions'
import {
  standardTextFrom, dogMeasurementsText, runStandardEval,
  JUDGE_RULES, BREEDER_CRITERIA, SCALE_LINES, SCHEMA_LINES,
} from '@/lib/cross-eval'

export const maxDuration = 60

/**
 * POST /api/dog-rating — evalúa con IA cómo encaja UN PERRO con el estándar de una
 * raza, a partir de sus medidas reales (la última tanda). Sin proyección: se
 * comparan sus medidas contra el rango de SU sexo. Juez compartido (@/lib/cross-eval).
 *
 * Body: { dogId, breedId }. Gate: exclusiva de Irema (canUseMeasurements) + dueño.
 */

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
    const dogId: string | undefined = body?.dogId
    const breedId: string | undefined = body?.breedId
    if (!dogId || !breedId) {
      return NextResponse.json({ error: 'Faltan parámetros (dogId, breedId).' }, { status: 400 })
    }

    // 1) Perro (nombre, sexo, dueño) + última tanda de medidas.
    const [measRes, dogRes] = await Promise.all([
      supabase
        .from('dog_measurements')
        .select('*')
        .eq('dog_id', dogId)
        .order('measured_at', { ascending: false })
        .limit(1),
      supabase.from('dogs').select('name, sex, owner_id').eq('id', dogId).maybeSingle(),
    ])
    const dog = dogRes.data
    const batch = measRes.data && measRes.data.length > 0 ? measRes.data[0] : null

    if (!dog || (dog.owner_id as string) !== user.id) {
      return NextResponse.json({ error: 'No eres el propietario de este perro.' }, { status: 403 })
    }
    if (!batch) {
      return NextResponse.json(
        {
          error: 'measurements_missing',
          message: 'Este perro no tiene medidas registradas. Añádelas en su pestaña Medidas.',
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

    // 3) Prompt (juez compartido + medidas del perro).
    const sexWord = dog.sex === 'female' ? 'hembra' : 'macho'
    const standardText = standardTextFrom(breed.genealogic_standard)
    const dogName = (dog.name as string) || 'el perro'

    const system = [
      `Eres un juez internacional de conformación canina, especialista en la raza ${breed.name}, y también seleccionador de cría. Evalúas cómo de bien encaja UN PERRO concreto con el estándar racial.`,
      '',
      'Cómo trabajas:',
      `- Recibes las medidas REALES del perro (las tomadas por su dueño). En talla y peso te doy además el rango de SU sexo (${sexWord}s) para compararlas directamente. No hay proyección ni estimación: son sus medidas. Los rasgos cualitativos (caderas, mordida, boca…) son los suyos y valoran salud y estructura.`,
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
      `PERRO A EVALUAR — ${dogName} (${sexWord})`,
      '',
      dogMeasurementsText(batch, dog.sex as string, breedId),
      '',
      'Evalúa este perro frente al estándar y puntúalo con la escala cinológica descrita (Insuficiente → Excelente), ponderando cada área por su peso en ESTE estándar.',
      '',
      ...SCHEMA_LINES,
    ].join('\n')

    const { result, raw } = await runStandardEval(system, userMsg)
    if (!result) return NextResponse.json({ breedName: breed.name, raw })
    return NextResponse.json({ breedName: breed.name, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error evaluando el perro.' }, { status: 500 })
  }
}
