'use client'

/**
 * CrossStandardEval — evaluación con IA del cruce frente al estándar racial.
 *
 * Deja elegir una raza (por defecto la de los progenitores) y llama a
 * /api/cross-rating, que promedia las medidas de ambos padres (mid-parent) y
 * pide a Claude una nota 0-10 + análisis por secciones vs el estándar cargado
 * en breeds.genealogic_standard. Feature exclusiva de Irema (gate en la ruta).
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  sireId: string
  damId: string
}

interface EvalSection {
  titulo: string
  estado: 'bien' | 'atencion' | 'desvia'
  comentario: string
}
interface EvalResult {
  breedName?: string
  score?: number
  resumen?: string
  secciones?: EvalSection[]
  fortalezas?: string[]
  mejoras?: string[]
  raw?: string
}

function scoreMeta(s: number): { pill: string; ring: string; label: string } {
  if (s >= 7.5)
    return {
      pill: 'bg-emerald-500/12 text-emerald-600',
      ring: 'border-emerald-500/40 text-emerald-600',
      label: 'Excelente',
    }
  if (s >= 5)
    return {
      pill: 'bg-amber-500/12 text-amber-600',
      ring: 'border-amber-500/40 text-amber-600',
      label: 'Correcto con reservas',
    }
  return {
    pill: 'bg-red-500/12 text-red-600',
    ring: 'border-red-500/40 text-red-600',
    label: 'Se desvía del estándar',
  }
}

const ESTADO_META: Record<
  EvalSection['estado'],
  { Icon: typeof CheckCircle2; cls: string; label: string }
> = {
  bien: { Icon: CheckCircle2, cls: 'text-emerald-600', label: 'Bien' },
  atencion: { Icon: AlertTriangle, cls: 'text-amber-600', label: 'Atención' },
  desvia: { Icon: XCircle, cls: 'text-red-600', label: 'Se desvía' },
}

export default function CrossStandardEval({ sireId, damId }: Props) {
  const t = useT()
  const [breeds, setBreeds] = useState<{ value: string; label: string }[]>([])
  const [breedId, setBreedId] = useState('')
  const [loadingBreeds, setLoadingBreeds] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvalResult | null>(null)

  // Cargar razas con estándar + raza por defecto (la del padre) al cambiar el cruce.
  useEffect(() => {
    if (!sireId || !damId) return
    let cancel = false

    async function load() {
      setLoadingBreeds(true)
      setResult(null)
      setError(null)
      const supabase = createClient()

      const [breedsRes, sireRes] = await Promise.all([
        supabase
          .from('breeds')
          .select('id, name')
          .not('genealogic_standard', 'is', null)
          .order('name'),
        supabase.from('dogs').select('breed_id').eq('id', sireId).maybeSingle(),
      ])
      if (cancel) return

      const list = (breedsRes.data || []).map((b: any) => ({ value: b.id, label: b.name }))
      setBreeds(list)

      // Por defecto: la raza del padre si tiene estándar; si no, Presa Canario;
      // si no, la primera de la lista.
      const sireBreed = sireRes.data?.breed_id as string | undefined
      const inList = (id?: string) => !!id && list.some((o) => o.value === id)
      let def = ''
      if (inList(sireBreed)) def = sireBreed!
      else {
        const presa = list.find((o) => /presa/i.test(o.label) && /canario/i.test(o.label))
        def = presa?.value || list[0]?.value || ''
      }
      setBreedId(def)
      setLoadingBreeds(false)
    }

    load()
    return () => {
      cancel = true
    }
  }, [sireId, damId])

  async function evaluate() {
    if (!breedId) return
    setEvaluating(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/cross-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sireId, damId, breedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || data?.error || t('No se pudo evaluar el cruce.'))
        return
      }
      setResult(data)
    } catch (e: any) {
      setError(e?.message || t('Error de red al evaluar el cruce.'))
    } finally {
      setEvaluating(false)
    }
  }

  const hasScore = result && typeof result.score === 'number'

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div>
        <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          <Sparkles className="h-4 w-4 text-[color:var(--brand)]" />
          {t('Evaluación del cruce vs estándar (IA)')}
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          {t('Compara las medidas proyectadas de la camada con el estándar de la raza que elijas y le da una nota del 0 al 10. Es una valoración orientativa generada por IA, no un dictamen oficial.')}
        </p>
      </div>

      {/* Selector de raza + botón */}
      <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-canvas p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
            {t('Estándar de la raza')}
          </label>
          {loadingBreeds ? (
            <div className="flex h-[42px] items-center gap-2 rounded-lg border border-hairline px-3 text-[13px] text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('Cargando razas...')}
            </div>
          ) : (
            <SearchableSelect
              options={breeds}
              value={breedId}
              onChange={setBreedId}
              placeholder={t('Seleccionar raza...')}
            />
          )}
        </div>
        <button
          onClick={evaluate}
          disabled={!breedId || evaluating || loadingBreeds}
          className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-[13.5px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {evaluating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('Evaluando...')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t('Evaluar con IA')}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-[color:var(--error)]/10 px-5 py-4 text-[13px] text-[color:var(--error)]">
          {error}
        </div>
      )}

      {/* Estado "pensando" */}
      {evaluating && !result && (
        <div className="rounded-xl border border-hairline bg-canvas px-5 py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
          <p className="mt-2 text-[12.5px] text-muted">
            {t('La IA está comparando el cruce con el estándar...')}
          </p>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="space-y-4">
          {/* Nota + resumen */}
          {hasScore && (
            <div className="rounded-xl border border-hairline bg-canvas p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${scoreMeta(result.score!).ring}`}
                >
                  <span className="text-[28px] font-bold leading-none tabular-nums">
                    {result.score!.toFixed(1)}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider opacity-70">
                    / 10
                  </span>
                </div>
                <div className="min-w-0">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${scoreMeta(result.score!).pill}`}
                  >
                    {t(scoreMeta(result.score!).label)}
                  </span>
                  {result.breedName && (
                    <p className="mt-1.5 text-[11.5px] text-muted">
                      {t('vs estándar de')}{' '}
                      <span className="font-medium text-ink">{result.breedName}</span>
                    </p>
                  )}
                  {result.resumen && (
                    <p className="mt-1 text-[13.5px] leading-relaxed text-body">{result.resumen}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Análisis por secciones */}
          {result.secciones && result.secciones.length > 0 && (
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {t('Análisis por secciones')}
              </h4>
              <div>
                {result.secciones.map((sec, i) => {
                  const meta = ESTADO_META[sec.estado]
                  const Icon = meta.Icon
                  return (
                    <div
                      key={`${sec.titulo}-${i}`}
                      className="flex gap-2.5 border-b border-hairline py-2.5 last:border-b-0"
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.cls}`} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink">{sec.titulo}</p>
                        {sec.comentario && (
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-body">
                            {sec.comentario}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Fortalezas + mejoras */}
          {((result.fortalezas && result.fortalezas.length > 0) ||
            (result.mejoras && result.mejoras.length > 0)) && (
            <div className="grid gap-3 md:grid-cols-2">
              {result.fortalezas && result.fortalezas.length > 0 && (
                <div className="rounded-xl border border-hairline bg-canvas p-4">
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                    <Plus className="h-3.5 w-3.5" />
                    {t('Fortalezas')}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.fortalezas.map((f, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-body">
                        <span className="text-emerald-600">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.mejoras && result.mejoras.length > 0 && (
                <div className="rounded-xl border border-hairline bg-canvas p-4">
                  <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                    <Minus className="h-3.5 w-3.5" />
                    {t('A vigilar')}
                  </h4>
                  <ul className="space-y-1.5">
                    {result.mejoras.map((m, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-body">
                        <span className="text-amber-600">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Fallback: respuesta sin estructurar */}
          {!hasScore && result.raw && (
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-body">
                {result.raw}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
