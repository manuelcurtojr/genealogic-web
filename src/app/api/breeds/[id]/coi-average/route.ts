/**
 * GET /api/breeds/[id]/coi-average
 *
 * Devuelve la media de COI de la raza (calculada sobre una muestra de perros
 * con ambos padres), para la "Comparativa COI vs media de la raza".
 *
 * Cache perezosa en breed_coi_stats: si el valor existe y tiene < 7 días, se
 * devuelve directo. Si falta o caduca, se recalcula muestreando perros de la
 * raza, calculando su COI con el algoritmo de Wright (mismo que el cliente) y
 * promediando. El resultado se persiste.
 *
 * Respuesta: { avgCoi: number, sampleSize: number, computedAt: string } | { avgCoi: null }
 */
import { NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { calculateCOI } from '@/components/pedigree/coi-calculator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SAMPLE_SIZE = 80
const MAX_GEN = 6
const STALE_DAYS = 7

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: breedId } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // 1) Cache fresca?
  const { data: cached } = await admin
    .from('breed_coi_stats')
    .select('avg_coi, sample_size, computed_at')
    .eq('breed_id', breedId)
    .maybeSingle()

  if (cached?.computed_at) {
    const ageMs = Date.now() - new Date(cached.computed_at).getTime()
    if (ageMs < STALE_DAYS * 86400000 && (cached.sample_size ?? 0) > 0) {
      return NextResponse.json({
        avgCoi: Number(cached.avg_coi),
        sampleSize: cached.sample_size,
        computedAt: cached.computed_at,
        cached: true,
      })
    }
  }

  // 2) Muestrear perros de la raza con ambos padres
  const { data: sample } = await admin
    .from('dogs')
    .select('id')
    .eq('breed_id', breedId)
    .not('father_id', 'is', null)
    .not('mother_id', 'is', null)
    .limit(SAMPLE_SIZE)

  const ids: string[] = (sample || []).map((d: { id: string }) => d.id)
  if (ids.length === 0) {
    return NextResponse.json({ avgCoi: null, sampleSize: 0 })
  }

  // 3) Calcular COI de cada uno (en lotes para no saturar)
  const cois: number[] = []
  const CHUNK = 10
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = ids.slice(i, i + CHUNK)
    const results = await Promise.all(
      batch.map(async (dogId) => {
        const { data: ped } = await admin.rpc('get_pedigree', { dog_uuid: dogId, max_gen: MAX_GEN })
        if (!ped) return null
        return calculateCOI(dogId, ped, MAX_GEN)
      }),
    )
    for (const c of results) if (typeof c === 'number') cois.push(c)
  }

  if (cois.length === 0) {
    return NextResponse.json({ avgCoi: null, sampleSize: 0 })
  }

  const avg = Math.round((cois.reduce((s, c) => s + c, 0) / cois.length) * 100) / 100
  const computedAt = new Date().toISOString()

  // 4) Persistir cache
  await admin.from('breed_coi_stats').upsert({
    breed_id: breedId,
    avg_coi: avg,
    sample_size: cois.length,
    computed_at: computedAt,
  })

  return NextResponse.json({ avgCoi: avg, sampleSize: cois.length, computedAt })
}
