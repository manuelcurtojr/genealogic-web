'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dna, AlertTriangle, Loader2, Eye, Microscope, Info } from 'lucide-react'
import Link from 'next/link'
import { crossAllLoci, type Genotype, type CrossResult } from '@/lib/genetics/punnett'
import { inferGenotype, inferredToGenotypes, type ColorObservation } from '@/lib/genetics/inference'
import { LOCI } from '@/lib/genetics/loci'

interface Props {
  sireId: string
  damId: string
}

type DataSource = 'dna' | 'inferred' | 'none'

interface ParentData {
  dnaGenotypes: Genotype[]
  inferredGenotypes: Genotype[]
  observation: ColorObservation | null
  colorName: string | null
}

export default function GeneticsForecast({ sireId, damId }: Props) {
  const [loading, setLoading] = useState(true)
  const [sire, setSire] = useState<ParentData | null>(null)
  const [dam, setDam] = useState<ParentData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sireId || !damId) return

    async function load() {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        const loadParent = async (dogId: string): Promise<ParentData> => {
          const [dnaRes, obsRes] = await Promise.all([
            supabase.from('dog_genotypes').select('locus, allele_1, allele_2').eq('dog_id', dogId),
            supabase
              .from('dog_color_observations')
              .select('color_id, coat_length, white_pattern, has_merle, has_mask, has_tan_points, has_brindle, is_diluted')
              .eq('dog_id', dogId)
              .maybeSingle(),
          ])

          const dnaGenotypes: Genotype[] = (dnaRes.data || []).map((r: any) => ({
            locus: r.locus,
            allele1: r.allele_1,
            allele2: r.allele_2,
          }))

          let observation: ColorObservation | null = null
          let colorName: string | null = null
          let inferredGenotypes: Genotype[] = []

          if (obsRes.data) {
            // Resolver color_name desde colors table si hay color_id
            let resolvedColorName: string | null = null
            if (obsRes.data.color_id) {
              const { data: c } = await supabase
                .from('colors')
                .select('name')
                .eq('id', obsRes.data.color_id)
                .maybeSingle()
              resolvedColorName = c?.name || null
            }
            colorName = resolvedColorName
            observation = {
              color_name: resolvedColorName,
              coat_length: obsRes.data.coat_length,
              white_pattern: obsRes.data.white_pattern,
              has_merle: obsRes.data.has_merle,
              has_mask: obsRes.data.has_mask,
              has_tan_points: obsRes.data.has_tan_points,
              has_brindle: obsRes.data.has_brindle,
              is_diluted: obsRes.data.is_diluted,
            }
            inferredGenotypes = inferredToGenotypes(inferGenotype(observation))
          }

          return { dnaGenotypes, inferredGenotypes, observation, colorName }
        }

        const [sireData, damData] = await Promise.all([loadParent(sireId), loadParent(damId)])
        setSire(sireData)
        setDam(damData)
      } catch (err: any) {
        setError(err.message || 'Error cargando datos genéticos')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [sireId, damId])

  if (loading) {
    return (
      <div className="rounded-xl border border-hairline bg-canvas px-5 py-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
        <p className="mt-2 text-[12.5px] text-muted">Calculando predicción genética...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[color:var(--error)]/10 px-5 py-4 text-[13px] text-[color:var(--error)]">
        Error: {error}
      </div>
    )
  }

  if (!sire || !dam) return null

  const sireSource: DataSource = sire.dnaGenotypes.length > 0
    ? 'dna'
    : sire.inferredGenotypes.length > 0
      ? 'inferred'
      : 'none'
  const damSource: DataSource = dam.dnaGenotypes.length > 0
    ? 'dna'
    : dam.inferredGenotypes.length > 0
      ? 'inferred'
      : 'none'

  if (sireSource === 'none' && damSource === 'none') {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-5 py-8 text-center">
        <Dna className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-2 text-[13.5px] text-body">
          Ninguno de los padres tiene datos de color ni genotipo.
        </p>
        <p className="mt-1 text-[12px] text-muted">
          Empieza registrando el color visible — solo te llevará un minuto.
        </p>
        <Link
          href="/genetica"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90"
        >
          Ir a Genética
        </Link>
      </div>
    )
  }

  // Combinar: DNA tiene prioridad. Si falta, usar inferido.
  // Para cada locus, si hay DNA usar DNA, sino inferido (si existe).
  const combineGenotypes = (parent: ParentData): Genotype[] => {
    const lociWithDna = new Set(parent.dnaGenotypes.map((g) => g.locus))
    const combined = [...parent.dnaGenotypes]
    for (const inf of parent.inferredGenotypes) {
      if (!lociWithDna.has(inf.locus)) combined.push(inf)
    }
    return combined
  }
  const sireFinal = combineGenotypes(sire)
  const damFinal = combineGenotypes(dam)

  const results = crossAllLoci(sireFinal, damFinal)

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-5 py-6 text-center text-[13px] text-muted">
        Datos insuficientes para predecir el cruce.
        <br />
        <Link href="/genetica" className="mt-2 inline-block text-ink underline">
          Editar genética →
        </Link>
      </div>
    )
  }

  const warnings = results.filter((r) => r.warning).map((r) => r.warning!)

  // Para mostrar fuente por locus: DNA o inferida
  const sireDnaLoci = new Set(sire.dnaGenotypes.map((g) => g.locus))
  const damDnaLoci = new Set(dam.dnaGenotypes.map((g) => g.locus))

  return (
    <div className="space-y-3">
      {/* Resumen de fuentes */}
      <div className="grid gap-2 sm:grid-cols-2">
        <SourceBadge label="Padre" source={sireSource} colorName={sire.colorName} />
        <SourceBadge label="Madre" source={damSource} colorName={dam.colorName} />
      </div>

      {/* Warnings críticos */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-[color:var(--error)]/30 bg-[color:var(--error)]/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--error)]" />
            <div className="space-y-1.5">
              {warnings.map((w, i) => (
                <p key={i} className="text-[13px] font-medium text-[color:var(--error)]">
                  {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aviso de incertidumbre cuando hay inferencia */}
      {(sireSource === 'inferred' || damSource === 'inferred') && (
        <div className="rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-[12.5px] text-amber-900">
              Algunos loci se han inferido a partir del color visible (no DNA). Los porcentajes son
              estimaciones razonables pero pueden ser imprecisos. Para precisión total, haz tests
              DNA (Embark / Wisdom Panel) en ambos padres.
            </p>
          </div>
        </div>
      )}

      {/* Resultados por locus */}
      <div className="grid gap-3 md:grid-cols-2">
        {results.map((res) => {
          const sireFromDna = sireDnaLoci.has(res.locus.code)
          const damFromDna = damDnaLoci.has(res.locus.code)
          const allDna = sireFromDna && damFromDna
          return (
            <LocusCard
              key={res.locus.code}
              result={res}
              confidence={allDna ? 'high' : 'estimated'}
            />
          )
        })}
      </div>

      {results.length < LOCI.length && (
        <p className="text-[11.5px] text-muted">
          Mostrando {results.length} de {LOCI.length} loci.{' '}
          <Link href="/genetica" className="text-ink underline">
            Completar datos →
          </Link>
        </p>
      )}
    </div>
  )
}

function SourceBadge({
  label,
  source,
  colorName,
}: {
  label: string
  source: DataSource
  colorName: string | null
}) {
  if (source === 'none') {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-surface-soft px-3 py-2 text-[12px] text-muted">
        {label}: <span className="font-medium">Sin datos genéticos</span>
      </div>
    )
  }
  if (source === 'dna') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900">
        <Microscope className="h-3.5 w-3.5" />
        <span>
          {label}: <span className="font-medium">Genotipo DNA confirmado</span>
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] text-blue-900">
      <Eye className="h-3.5 w-3.5" />
      <span>
        {label}: <span className="font-medium">Color visible</span>
        {colorName && <span className="text-blue-700"> · {colorName}</span>}
      </span>
    </div>
  )
}

function LocusCard({
  result,
  confidence,
}: {
  result: CrossResult
  confidence: 'high' | 'estimated'
}) {
  const hasWarning = !!result.warning

  return (
    <div
      className={`rounded-xl border p-4 ${
        hasWarning
          ? 'border-[color:var(--error)]/30 bg-[color:var(--error)]/5'
          : 'border-hairline bg-canvas'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-[13.5px] font-semibold text-ink">{result.locus.name}</h4>
          <p className="mt-0.5 text-[11.5px] text-muted">{result.locus.description}</p>
        </div>
        <span
          className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            confidence === 'high'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
          title={confidence === 'high' ? 'Predicción exacta (ambos padres con DNA)' : 'Estimación con incertidumbre'}
        >
          {confidence === 'high' ? 'Exacto' : 'Estimado'}
        </span>
      </div>

      <ul className="space-y-2">
        {result.outcomes.map((out, i) => {
          const pct = Math.round(out.probability * 100)
          if (pct === 0) return null
          return (
            <li key={i} className="flex items-center gap-3">
              <span
                className={`min-w-[60px] rounded px-2 py-1 text-center text-[12px] font-medium tabular-nums ${
                  out.isWarning
                    ? 'bg-[color:var(--error)] text-white'
                    : 'bg-surface-card text-ink'
                }`}
              >
                {out.label}
              </span>
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className={`h-full rounded-full ${
                      out.isWarning ? 'bg-[color:var(--error)]' : 'bg-ink'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="min-w-[40px] text-right text-[12.5px] font-medium tabular-nums text-body">
                {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
