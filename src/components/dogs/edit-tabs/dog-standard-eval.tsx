'use client'

/**
 * DogStandardEval — evaluación con IA de UN PERRO frente al estándar racial.
 *
 * Selector de raza (por defecto la del perro) + botón. Llama a /api/dog-rating
 * (medidas reales del perro vs el rango de su sexo) y muestra el resultado con la
 * vista compartida StandardEvalResult. Exclusiva de Irema (misma feature-flag que
 * las medidas); el endpoint además valida propiedad.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Loader2 } from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { useT } from '@/components/i18n/locale-provider'
import StandardEvalResult, { type EvalResult } from '@/components/planner/standard-eval-result'

export default function DogStandardEval({ dogId }: { dogId: string }) {
  const t = useT()
  const [breeds, setBreeds] = useState<{ value: string; label: string }[]>([])
  const [breedId, setBreedId] = useState('')
  const [loadingBreeds, setLoadingBreeds] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvalResult | null>(null)

  useEffect(() => {
    if (!dogId) return
    let cancel = false

    async function load() {
      setLoadingBreeds(true)
      setResult(null)
      setError(null)
      const supabase = createClient()

      const [breedsRes, dogRes] = await Promise.all([
        supabase
          .from('breeds')
          .select('id, name')
          .not('genealogic_standard', 'is', null)
          .order('name'),
        supabase.from('dogs').select('breed_id').eq('id', dogId).maybeSingle(),
      ])
      if (cancel) return

      const list = (breedsRes.data || []).map((b: any) => ({ value: b.id, label: b.name }))
      setBreeds(list)

      // Por defecto: la raza del perro si tiene estándar; si no, Presa Canario; si
      // no, la primera de la lista.
      const dogBreed = dogRes.data?.breed_id as string | undefined
      const inList = (id?: string) => !!id && list.some((o) => o.value === id)
      let def = ''
      if (inList(dogBreed)) def = dogBreed!
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
  }, [dogId])

  async function evaluate() {
    if (!breedId) return
    setEvaluating(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/dog-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, breedId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || data?.error || t('No se pudo evaluar el perro.'))
        return
      }
      setResult(data)
    } catch (e: any) {
      setError(e?.message || t('Error de red al evaluar el perro.'))
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          <Sparkles className="h-4 w-4 text-[color:var(--brand)]" />
          {t('Evaluación del perro vs estándar (IA)')}
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          {t('Compara las medidas reales del perro (su última tanda) con el estándar de la raza que elijas y le da una nota del 0 al 10. Es una valoración orientativa generada por IA, no un dictamen oficial.')}
        </p>
      </div>

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

      {error && (
        <div className="rounded-xl bg-[color:var(--error)]/10 px-5 py-4 text-[13px] text-[color:var(--error)]">
          {error}
        </div>
      )}

      {evaluating && !result && (
        <div className="rounded-xl border border-hairline bg-canvas px-5 py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
          <p className="mt-2 text-[12.5px] text-muted">
            {t('La IA está comparando el perro con el estándar...')}
          </p>
        </div>
      )}

      {result && <StandardEvalResult result={result} />}
    </div>
  )
}
