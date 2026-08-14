'use client'

/**
 * DogCompare — comparador de dos ejemplares (solo perros del propio usuario, con
 * medidas). Muestra sus medidas lado a lado con las diferencias resaltadas y, con
 * IA (/api/compare-rating), la nota de cada uno vs el estándar + sus diferencias.
 * Exclusiva de Irema.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Loader2, Scale, ArrowLeftRight } from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { useT } from '@/components/i18n/locale-provider'
import { NUMERIC_SECTIONS, QUALITATIVE_FIELDS } from '@/lib/measurements-fields'

type DogOpt = { value: string; label: string; breedId: string | null }
type MeasRow = Record<string, any> | null

interface CompareDog { score?: number; calificacion?: string; resumen?: string }
interface CompareDiff { aspecto: string; detalle: string; ventaja: 'a' | 'b' | 'igual' }
interface CompareResult {
  breedName?: string
  nameA?: string
  nameB?: string
  perroA?: CompareDog
  perroB?: CompareDog
  diferencias?: CompareDiff[]
  veredicto?: string
  raw?: string
}

const ALL_FIELDS = [
  ...NUMERIC_SECTIONS.flatMap((s) => s.fields.map((f) => ({ ...f, section: s.title }))),
  ...QUALITATIVE_FIELDS.map((f) => ({ ...f, section: 'Cualitativas' })),
]

function val(row: MeasRow, col: string): string {
  if (!row) return '—'
  const v = row[col]
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}
function scoreCls(s: number): string {
  if (s >= 7) return 'text-emerald-600'
  if (s >= 5) return 'text-sky-600'
  if (s >= 3.5) return 'text-amber-600'
  return 'text-red-600'
}

export default function DogCompare({ userId }: { userId: string }) {
  const t = useT()
  const [dogs, setDogs] = useState<DogOpt[]>([])
  const [breeds, setBreeds] = useState<{ value: string; label: string }[]>([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [dogAId, setDogAId] = useState('')
  const [dogBId, setDogBId] = useState('')
  const [breedId, setBreedId] = useState('')
  const [aMeas, setAMeas] = useState<MeasRow>(null)
  const [bMeas, setBMeas] = useState<MeasRow>(null)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompareResult | null>(null)

  // Mis perros CON medidas + razas con estándar.
  useEffect(() => {
    let cancel = false
    async function load() {
      const supabase = createClient()
      const [dogsRes, measRes, breedsRes] = await Promise.all([
        supabase.from('dogs').select('id, name, sex, breed_id').eq('owner_id', userId).order('name'),
        supabase.from('dog_measurements').select('dog_id').eq('owner_id', userId),
        supabase.from('breeds').select('id, name').not('genealogic_standard', 'is', null).order('name'),
      ])
      if (cancel) return
      const measured = new Set((measRes.data || []).map((m: any) => m.dog_id))
      const list: DogOpt[] = (dogsRes.data || [])
        .filter((d: any) => measured.has(d.id))
        .map((d: any) => ({
          value: d.id,
          label: `${d.name}${d.sex === 'female' ? ' ♀' : ' ♂'}`,
          breedId: d.breed_id ?? null,
        }))
      setDogs(list)
      setBreeds((breedsRes.data || []).map((b: any) => ({ value: b.id, label: b.name })))
      setLoadingInit(false)
    }
    load()
    return () => {
      cancel = true
    }
  }, [userId])

  // Al elegir ambos perros: cargar su última tanda + fijar raza por defecto (la de A).
  useEffect(() => {
    setResult(null)
    setError(null)
    if (!dogAId || !dogBId) {
      setAMeas(null)
      setBMeas(null)
      return
    }
    let cancel = false
    async function load() {
      const supabase = createClient()
      const [ra, rb] = await Promise.all([
        supabase.from('dog_measurements').select('*').eq('dog_id', dogAId).order('measured_at', { ascending: false }).limit(1),
        supabase.from('dog_measurements').select('*').eq('dog_id', dogBId).order('measured_at', { ascending: false }).limit(1),
      ])
      if (cancel) return
      setAMeas(ra.data && ra.data.length > 0 ? ra.data[0] : null)
      setBMeas(rb.data && rb.data.length > 0 ? rb.data[0] : null)
      // Raza por defecto: la del perro A si tiene estándar; si no, Presa; si no, la 1ª.
      const aBreed = dogs.find((d) => d.value === dogAId)?.breedId ?? undefined
      const inList = (id?: string) => !!id && breeds.some((o) => o.value === id)
      const presa = breeds.find((o) => /presa/i.test(o.label) && /canario/i.test(o.label))
      setBreedId(inList(aBreed) ? aBreed! : presa?.value || breeds[0]?.value || '')
    }
    load()
    return () => {
      cancel = true
    }
  }, [dogAId, dogBId, dogs, breeds])

  async function compare() {
    if (!dogAId || !dogBId || !breedId) return
    setComparing(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/compare-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogAId, dogBId, breedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || data?.error || t('No se pudo comparar.'))
        return
      }
      setResult(data)
    } catch (e: any) {
      setError(e?.message || t('Error de red al comparar.'))
    } finally {
      setComparing(false)
    }
  }

  const bothSelected = !!dogAId && !!dogBId && dogAId !== dogBId
  const labelA = dogs.find((d) => d.value === dogAId)?.label || t('Perro A')
  const labelB = dogs.find((d) => d.value === dogBId)?.label || t('Perro B')

  // Filas de medidas donde al menos uno tiene dato.
  const rows = bothSelected
    ? ALL_FIELDS.map((f) => ({
        label: f.label,
        a: val(aMeas, f.col),
        b: val(bMeas, f.col),
      })).filter((r) => r.a !== '—' || r.b !== '—')
    : []

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Crianza')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Comparador de ejemplares')}
        </h1>
        <p className="mt-2 text-[14px] text-body">
          {t('Elige dos de tus perros medidos para ver sus medidas lado a lado y analizar con IA sus diferencias frente a un estándar.')}
        </p>
      </div>

      {loadingInit ? (
        <div className="rounded-xl border border-hairline bg-canvas px-5 py-10 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
        </div>
      ) : dogs.length < 2 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-14 text-center">
          <Scale className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-[14px] text-body">{t('Necesitas al menos 2 perros con medidas para comparar.')}</p>
          <p className="mt-1 text-[12.5px] text-muted">{t('Añade medidas en la ficha de cada perro › pestaña Medidas.')}</p>
        </div>
      ) : (
        <>
          {/* Selectores */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-hairline bg-canvas p-5">
              <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Ejemplar A')}</h3>
              <SearchableSelect options={dogs} value={dogAId} onChange={setDogAId} placeholder={t('Seleccionar perro...')} />
            </div>
            <div className="rounded-xl border border-hairline bg-canvas p-5">
              <h3 className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Ejemplar B')}</h3>
              <SearchableSelect options={dogs} value={dogBId} onChange={setDogBId} placeholder={t('Seleccionar perro...')} />
            </div>
          </div>

          {dogAId && dogBId && dogAId === dogBId && (
            <p className="rounded-lg bg-amber-500/10 px-4 py-2.5 text-[13px] text-amber-700">
              {t('Elige dos perros distintos.')}
            </p>
          )}

          {bothSelected && (
            <>
              {/* Medidas lado a lado */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-[22px] font-semibold tracking-[-0.04em] text-ink">
                  <ArrowLeftRight className="h-5 w-5" />
                  {t('Medidas lado a lado')}
                </h2>
                <div className="overflow-x-auto rounded-xl border border-hairline bg-canvas">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-hairline text-[11px] uppercase tracking-wider text-muted">
                        <th className="px-3 py-2.5 text-left font-medium">{t('Medida')}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{labelA}</th>
                        <th className="px-3 py-2.5 text-right font-medium">{labelB}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const differ = r.a !== r.b && r.a !== '—' && r.b !== '—'
                        return (
                          <tr key={`${r.label}-${i}`} className="border-b border-hairline last:border-b-0">
                            <td className="px-3 py-2 text-body">{t(r.label)}</td>
                            <td className={`px-3 py-2 text-right tabular-nums ${differ ? 'font-semibold text-[color:var(--brand)]' : 'text-ink'}`}>{r.a}</td>
                            <td className={`px-3 py-2 text-right tabular-nums ${differ ? 'font-semibold text-[color:var(--brand)]' : 'text-ink'}`}>{r.b}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted">{t('En color, las medidas en las que difieren.')}</p>
              </section>

              {/* Análisis IA */}
              <section className="space-y-4">
                <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-canvas p-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                      {t('Estándar de la raza')}
                    </label>
                    <SearchableSelect options={breeds} value={breedId} onChange={setBreedId} placeholder={t('Seleccionar raza...')} />
                  </div>
                  <button
                    onClick={compare}
                    disabled={!breedId || comparing}
                    className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-[13.5px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    {comparing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> {t('Comparando...')}</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> {t('Analizar con IA')}</>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl bg-[color:var(--error)]/10 px-5 py-4 text-[13px] text-[color:var(--error)]">{error}</div>
                )}

                {comparing && !result && (
                  <div className="rounded-xl border border-hairline bg-canvas px-5 py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
                    <p className="mt-2 text-[12.5px] text-muted">{t('La IA está comparando ambos ejemplares con el estándar...')}</p>
                  </div>
                )}

                {result && <CompareResultView result={result} labelA={labelA} labelB={labelB} />}
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}

function CompareResultView({ result, labelA, labelB }: { result: CompareResult; labelA: string; labelB: string }) {
  const t = useT()
  const a = result.perroA
  const b = result.perroB
  const hasScores = typeof a?.score === 'number' && typeof b?.score === 'number'

  if (!hasScores && result.raw) {
    return (
      <div className="rounded-xl border border-hairline bg-canvas p-4">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-body">{result.raw}</p>
      </div>
    )
  }
  if (!hasScores) return null

  const nameA = result.nameA || labelA
  const nameB = result.nameB || labelB
  const ventajaBadge = (v: CompareDiff['ventaja']) =>
    v === 'a'
      ? { txt: nameA, cls: 'bg-[color:var(--brand)]/12 text-[color:var(--brand)]' }
      : v === 'b'
        ? { txt: nameB, cls: 'bg-sky-500/12 text-sky-600' }
        : { txt: t('Igual'), cls: 'bg-surface-card text-muted' }

  return (
    <div className="space-y-4">
      {/* Notas de cada perro */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[{ d: a!, name: nameA }, { d: b!, name: nameB }].map((x, i) => (
          <div key={i} className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border-2 ${scoreCls(x.d.score!)} border-current`}>
                <span className="text-[20px] font-bold leading-none tabular-nums">{x.d.score!.toFixed(1)}</span>
                <span className="text-[9px] font-medium uppercase opacity-70">/ 10</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink truncate">{x.name}</p>
                {x.d.calificacion && <p className={`text-[12px] font-medium ${scoreCls(x.d.score!)}`}>{x.d.calificacion}</p>}
              </div>
            </div>
            {x.d.resumen && <p className="mt-2 text-[12.5px] leading-relaxed text-body">{x.d.resumen}</p>}
          </div>
        ))}
      </div>

      {/* Veredicto */}
      {result.veredicto && (
        <div className="rounded-xl border border-[color:var(--brand)]/25 bg-[color:var(--brand)]/[0.05] p-4">
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--brand)]">{t('Veredicto')}</h4>
          <p className="text-[13.5px] leading-relaxed text-body">{result.veredicto}</p>
        </div>
      )}

      {/* Diferencias */}
      {result.diferencias && result.diferencias.length > 0 && (
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Diferencias')}</h4>
          <div>
            {result.diferencias.map((d, i) => {
              const badge = ventajaBadge(d.ventaja)
              return (
                <div key={i} className="border-b border-hairline py-2.5 last:border-b-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-[13px] font-medium text-ink">{d.aspecto}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                      {t('Ventaja')}: {badge.txt}
                    </span>
                  </div>
                  {d.detalle && <p className="mt-0.5 text-[12.5px] leading-relaxed text-body">{d.detalle}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
