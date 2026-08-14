import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUseMeasurements } from '@/lib/permissions'
import {
  standardTextFrom, dogMeasurementsText, runCompareEval,
  JUDGE_RULES, BREEDER_CRITERIA, SCALE_LINES, COMPARE_SCHEMA_LINES,
} from '@/lib/cross-eval'

export const maxDuration = 60

/**
 * POST /api/compare-rating — compara DOS perros entre sí y frente al estándar de
 * una raza, con sus medidas reales (última tanda de cada uno). Devuelve nota de
 * cada perro + en qué se diferencian + veredicto. Juez compartido (@/lib/cross-eval).
 *
 * Body: { dogAId, dogBId, breedId }. Gate: Irema (canUseMeasurements) + dueño de ambos.
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
        { error: 'Espera unos segundos antes de volver a comparar.' },
        { status: 429 },
      )
    }
    lastCall.set(user.id, now)

    const body = await request.json().catch(() => null)
    const dogAId: string | undefined = body?.dogAId
    const dogBId: string | undefined = body?.dogBId
    const breedId: string | undefined = body?.breedId
    if (!dogAId || !dogBId || !breedId) {
      return NextResponse.json({ error: 'Faltan parámetros (dogAId, dogBId, breedId).' }, { status: 400 })
    }
    if (dogAId === dogBId) {
      return NextResponse.json({ error: 'Elige dos perros distintos.' }, { status: 400 })
    }

    const loadDog = async (dogId: string) => {
      const [measRes, dogRes] = await Promise.all([
        supabase
          .from('dog_measurements')
          .select('*')
          .eq('dog_id', dogId)
          .order('measured_at', { ascending: false })
          .limit(1),
        supabase.from('dogs').select('name, sex, owner_id').eq('id', dogId).maybeSingle(),
      ])
      return {
        dog: dogRes.data,
        batch: measRes.data && measRes.data.length > 0 ? measRes.data[0] : null,
      }
    }
    const [a, b] = await Promise.all([loadDog(dogAId), loadDog(dogBId)])

    // Propiedad: solo el dueño de AMBOS perros puede compararlos.
    if (!a.dog || !b.dog || (a.dog.owner_id as string) !== user.id || (b.dog.owner_id as string) !== user.id) {
      return NextResponse.json({ error: 'No eres el propietario de estos perros.' }, { status: 403 })
    }
    if (!a.batch || !b.batch) {
      return NextResponse.json(
        {
          error: 'measurements_missing',
          message: 'Faltan medidas de uno o ambos perros. Añádelas en su pestaña Medidas.',
        },
        { status: 422 },
      )
    }

    const { data: breed } = await supabase
      .from('breeds')
      .select('name, genealogic_standard')
      .eq('id', breedId)
      .maybeSingle()
    if (!breed?.genealogic_standard) {
      return NextResponse.json({ error: 'La raza seleccionada no tiene estándar cargado.' }, { status: 404 })
    }

    const standardText = standardTextFrom(breed.genealogic_standard)
    const nameA = (a.dog.name as string) || 'Perro A'
    const nameB = (b.dog.name as string) || 'Perro B'
    const sexWordA = a.dog.sex === 'female' ? 'hembra' : 'macho'
    const sexWordB = b.dog.sex === 'female' ? 'hembra' : 'macho'

    const system = [
      `Eres un juez internacional de conformación canina, especialista en la raza ${breed.name}, y también seleccionador de cría. COMPARAS dos perros entre sí y frente al estándar racial.`,
      '',
      'Cómo trabajas:',
      '- ESTO ES UNA COMPARACIÓN de dos ejemplares, NO un cruce. Los dos perros pueden ser del mismo sexo (dos hembras, dos machos). NUNCA hables de si "se complementan", "se compensan" o de aparearlos/criar: eso no aplica aquí. Juzga cada perro por separado contra el estándar y di cuál es MEJOR EJEMPLAR y en qué difieren.',
      '- Recibes las medidas REALES de cada perro (en talla y peso, con el rango de su sexo). No hay proyección: son sus medidas. Juzga a CADA uno contra el rango de SU sexo (aunque ambos sean del mismo sexo). Los rasgos cualitativos (caderas, mordida, boca…) son los de cada perro.',
      ...JUDGE_RULES,
      ...BREEDER_CRITERIA,
      '- Da a cada perro su nota global 0-10 vs el estándar y, en cada aspecto en que DIFIERAN de verdad, puntúa a CADA uno por separado (nota_a/nota_b, 0-10) y di quién se acerca más al estándar. (En el comparador no hay campo "gate": un factor descalificante se refleja en una nota baja y se explica en el resumen del perro.)',
      '',
      ...SCALE_LINES,
    ].join('\n')

    const userMsg = [
      `ESTÁNDAR RACIAL — ${breed.name}:`,
      standardText || '(sin secciones)',
      '',
      `PERRO A — ${nameA} (${sexWordA})`,
      dogMeasurementsText(a.batch, a.dog.sex as string, breedId),
      '',
      `PERRO B — ${nameB} (${sexWordB})`,
      dogMeasurementsText(b.batch, b.dog.sex as string, breedId),
      '',
      'Compara A y B entre sí y frente al estándar; puntúa cada uno con la escala cinológica descrita y explica sus diferencias reales.',
      '',
      ...COMPARE_SCHEMA_LINES,
    ].join('\n')

    const { result, raw } = await runCompareEval(system, userMsg)
    if (!result) return NextResponse.json({ breedName: breed.name, nameA, nameB, raw })
    return NextResponse.json({ breedName: breed.name, nameA, nameB, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error comparando los perros.' }, { status: 500 })
  }
}
