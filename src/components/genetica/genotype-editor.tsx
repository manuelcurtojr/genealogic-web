'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dna, Save, Loader2, Check } from 'lucide-react'
import { LOCI } from '@/lib/genetics/loci'

interface Dog {
  id: string
  name: string
  slug: string | null
  sex: string
  thumbnail_url: string | null
}

interface Genotype {
  id?: string
  locus: string
  allele_1: string
  allele_2: string
  source?: string
  confidence?: string
  notes?: string | null
}

interface Props {
  dog: Dog
  initialGenotypes: Genotype[]
}

export default function GenotypeEditor({ dog, initialGenotypes }: Props) {
  // Estado: mapa locus → { allele1, allele2 }. Inicializado desde DB.
  const initialMap = new Map<string, { allele1: string; allele2: string }>()
  for (const g of initialGenotypes) {
    initialMap.set(g.locus, { allele1: g.allele_1, allele2: g.allele_2 })
  }

  const [genotypes, setGenotypes] = useState<Map<string, { allele1: string; allele2: string }>>(initialMap)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (locus: string, position: 1 | 2, value: string) => {
    setGenotypes((prev) => {
      const next = new Map(prev)
      const current = next.get(locus) || { allele1: '', allele2: '' }
      if (position === 1) current.allele1 = value
      else current.allele2 = value
      next.set(locus, current)
      return next
    })
  }

  const handleClear = (locus: string) => {
    setGenotypes((prev) => {
      const next = new Map(prev)
      next.delete(locus)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      // Strategy: delete-then-upsert. Borra los que el usuario ha vaciado,
      // upsert los que tiene completos.
      const toUpsert: any[] = []
      const presentLoci: string[] = []
      for (const [locus, { allele1, allele2 }] of genotypes.entries()) {
        if (allele1 && allele2) {
          toUpsert.push({
            dog_id: dog.id,
            locus,
            allele_1: allele1,
            allele_2: allele2,
            source: 'declared',
            confidence: 'high',
          })
          presentLoci.push(locus)
        }
      }

      // Borrar los que ya no están en el form
      const initialLoci = initialGenotypes.map((g) => g.locus)
      const toDelete = initialLoci.filter((l) => !presentLoci.includes(l))
      if (toDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('dog_genotypes')
          .delete()
          .eq('dog_id', dog.id)
          .in('locus', toDelete)
        if (delErr) throw delErr
      }

      // Upsert nuevos / actualizados
      if (toUpsert.length > 0) {
        const { error: upsertErr } = await supabase
          .from('dog_genotypes')
          .upsert(toUpsert, { onConflict: 'dog_id,locus' })
        if (upsertErr) throw upsertErr
      }

      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header del perro */}
      <div className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-5 py-4">
        <div className="flex items-center gap-3">
          {dog.thumbnail_url ? (
            <img src={dog.thumbnail_url} alt={dog.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card">
              <Dna className="h-5 w-5 text-muted" />
            </div>
          )}
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{dog.name}</h2>
            <p className="text-[12px] text-muted">
              {dog.sex === 'male' ? 'Macho' : dog.sex === 'female' ? 'Hembra' : 'Sexo no definido'} ·{' '}
              {genotypes.size} loci registrados
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : savedFlash ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {savedFlash ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-[color:var(--error)]/10 px-4 py-2 text-[13px] text-[color:var(--error)]">
          {error}
        </div>
      )}

      {/* Editor por locus */}
      <div className="space-y-3">
        {LOCI.map((locus) => {
          const current = genotypes.get(locus.code)
          const a1 = current?.allele1 || ''
          const a2 = current?.allele2 || ''
          const hasData = !!a1 && !!a2

          return (
            <div
              key={locus.code}
              className={`rounded-xl border p-4 transition-colors ${
                hasData ? 'border-hairline bg-canvas' : 'border-hairline-soft bg-surface-soft'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14.5px] font-semibold text-ink">{locus.name}</h3>
                    <span className="rounded bg-surface-card px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-muted">
                      {locus.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-body">{locus.description}</p>
                  {locus.notes && (
                    <p className="mt-1.5 text-[11.5px] text-muted italic">{locus.notes}</p>
                  )}
                </div>

                {/* Selectores de alelo */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={a1}
                    onChange={(e) => handleChange(locus.code, 1, e.target.value)}
                    className="rounded-lg border border-hairline bg-canvas px-2 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">—</option>
                    {locus.alleles.map((al) => (
                      <option key={al.code} value={al.code}>
                        {al.code}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted">/</span>
                  <select
                    value={a2}
                    onChange={(e) => handleChange(locus.code, 2, e.target.value)}
                    className="rounded-lg border border-hairline bg-canvas px-2 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="">—</option>
                    {locus.alleles.map((al) => (
                      <option key={al.code} value={al.code}>
                        {al.code}
                      </option>
                    ))}
                  </select>
                  {hasData && (
                    <button
                      onClick={() => handleClear(locus.code)}
                      className="ml-1 text-[11px] text-muted hover:text-ink"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-dashed border-hairline bg-surface-soft px-4 py-3 text-[12.5px] text-muted">
        💡 Los datos genéticos pueden venir de tests Embark, Wisdom Panel, observación visual, o registros del criadero. Cuanto más completo, mejor será la predicción del cruce.
      </div>
    </div>
  )
}
