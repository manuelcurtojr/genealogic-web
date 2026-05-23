'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dna, AlertTriangle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { crossAllLoci, type Genotype, type CrossResult } from '@/lib/genetics/punnett'
import { LOCI } from '@/lib/genetics/loci'

interface Props {
  sireId: string
  damId: string
}

export default function GeneticsForecast({ sireId, damId }: Props) {
  const [loading, setLoading] = useState(true)
  const [sireGenotypes, setSireGenotypes] = useState<Genotype[]>([])
  const [damGenotypes, setDamGenotypes] = useState<Genotype[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sireId || !damId) return

    async function load() {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      try {
        const [sireRes, damRes] = await Promise.all([
          supabase.from('dog_genotypes').select('locus, allele_1, allele_2').eq('dog_id', sireId),
          supabase.from('dog_genotypes').select('locus, allele_1, allele_2').eq('dog_id', damId),
        ])

        const toGenotype = (rows: any[]): Genotype[] =>
          (rows || []).map((r) => ({
            locus: r.locus,
            allele1: r.allele_1,
            allele2: r.allele_2,
          }))

        setSireGenotypes(toGenotype(sireRes.data || []))
        setDamGenotypes(toGenotype(damRes.data || []))
      } catch (err: any) {
        setError(err.message || 'Error cargando genotipos')
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

  if (sireGenotypes.length === 0 && damGenotypes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-5 py-8 text-center">
        <Dna className="mx-auto h-8 w-8 text-muted" />
        <p className="mt-2 text-[13.5px] text-body">
          Ninguno de los padres tiene genotipo registrado.
        </p>
        <p className="mt-1 text-[12px] text-muted">
          Añade datos genéticos para predecir el color y patrón de los cachorros.
        </p>
        <Link
          href="/genetica"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90"
        >
          Editar genética
        </Link>
      </div>
    )
  }

  const results = crossAllLoci(sireGenotypes, damGenotypes)

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-5 py-6 text-center text-[13px] text-muted">
        Ambos padres tienen datos genéticos, pero no hay loci en común.
        <br />
        <Link href="/genetica" className="mt-2 inline-block text-ink underline">
          Editar para añadir más loci →
        </Link>
      </div>
    )
  }

  // Warnings críticos primero
  const warnings = results.filter((r) => r.warning).map((r) => r.warning!)

  return (
    <div className="space-y-3">
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

      {/* Resultados por locus */}
      <div className="grid gap-3 md:grid-cols-2">
        {results.map((res) => (
          <LocusCard key={res.locus.code} result={res} />
        ))}
      </div>

      {/* Loci no calculados */}
      {results.length < LOCI.length && (
        <p className="text-[11.5px] text-muted">
          Mostrando {results.length} de {LOCI.length} loci. Los loci sin datos en ambos padres no
          se calculan.{' '}
          <Link href="/genetica" className="text-ink underline">
            Editar genética →
          </Link>
        </p>
      )}
    </div>
  )
}

function LocusCard({ result }: { result: CrossResult }) {
  const hasWarning = !!result.warning

  return (
    <div
      className={`rounded-xl border p-4 ${
        hasWarning
          ? 'border-[color:var(--error)]/30 bg-[color:var(--error)]/5'
          : 'border-hairline bg-canvas'
      }`}
    >
      <div className="mb-3">
        <h4 className="text-[13.5px] font-semibold text-ink">{result.locus.name}</h4>
        <p className="mt-0.5 text-[11.5px] text-muted">{result.locus.description}</p>
      </div>

      <ul className="space-y-2">
        {result.outcomes.map((out, i) => {
          const pct = Math.round(out.probability * 100)
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
