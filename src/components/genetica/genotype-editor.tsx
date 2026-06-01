'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dna, Save, Loader2, Check, Palette, Microscope } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { LOCI } from '@/lib/genetics/loci'
import ColorObservationForm from './color-observation-form'

interface Dog {
  id: string
  name: string
  slug: string | null
  sex: string
  thumbnail_url: string | null
  breed_id?: string | null
  color_id?: string | null
  breed?: { name: string } | null
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

interface Color {
  id: string
  name: string
}

interface ColorObs {
  id?: string
  color_id?: string | null
  coat_length?: 'short' | 'medium' | 'long' | 'wire'
  white_pattern?: 'none' | 'small' | 'parti' | 'piebald'
  has_merle?: boolean
  has_mask?: boolean
  has_tan_points?: boolean
  has_brindle?: boolean
  is_diluted?: boolean
  notes?: string | null
}

interface Props {
  dog: Dog
  initialGenotypes: Genotype[]
  breedColors: Color[]
  allColors: Color[]
  initialObservation: ColorObs | null
}

type Tab = 'color' | 'dna'

export default function GenotypeEditor({ dog, initialGenotypes, breedColors, allColors, initialObservation }: Props) {
  const t = useT()
  const [activeTab, setActiveTab] = useState<Tab>(initialGenotypes.length > 0 ? 'dna' : 'color')

  const hasColorData = !!initialObservation
  const hasDnaData = initialGenotypes.length > 0

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
              {dog.sex === 'male' ? t('Macho') : dog.sex === 'female' ? t('Hembra') : t('Sexo no definido')}
              {hasColorData && ` · ${t('Color registrado')}`}
              {hasDnaData && ` · ${initialGenotypes.length} ${t('loci DNA')}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-soft p-0.5">
        <button
          onClick={() => setActiveTab('color')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
            activeTab === 'color' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          {t('Color visible')}
          {hasColorData && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </button>
        <button
          onClick={() => setActiveTab('dna')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
            activeTab === 'dna' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Microscope className="h-3.5 w-3.5" />
          {t('Genotipo DNA (avanzado)')}
          {hasDnaData && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'color' ? (
        <ColorObservationForm
          dogId={dog.id}
          breedColors={breedColors}
          allColors={allColors}
          breedName={dog.breed?.name || null}
          defaultColorId={dog.color_id || null}
          initial={initialObservation}
        />
      ) : (
        <DnaEditor dogId={dog.id} initialGenotypes={initialGenotypes} />
      )}
    </div>
  )
}

/**
 * Editor de genotipo DNA (loci avanzados). Para usuarios con test DNA.
 */
function DnaEditor({ dogId, initialGenotypes }: { dogId: string; initialGenotypes: Genotype[] }) {
  const t = useT()
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
      const toUpsert: any[] = []
      const presentLoci: string[] = []
      for (const [locus, { allele1, allele2 }] of genotypes.entries()) {
        if (allele1 && allele2) {
          toUpsert.push({
            dog_id: dogId,
            locus,
            allele_1: allele1,
            allele_2: allele2,
            source: 'declared',
            confidence: 'high',
          })
          presentLoci.push(locus)
        }
      }

      const initialLoci = initialGenotypes.map((g) => g.locus)
      const toDelete = initialLoci.filter((l) => !presentLoci.includes(l))
      if (toDelete.length > 0) {
        const { error: delErr } = await supabase
          .from('dog_genotypes')
          .delete()
          .eq('dog_id', dogId)
          .in('locus', toDelete)
        if (delErr) throw delErr
      }

      if (toUpsert.length > 0) {
        const { error: upsertErr } = await supabase
          .from('dog_genotypes')
          .upsert(toUpsert, { onConflict: 'dog_id,locus' })
        if (upsertErr) throw upsertErr
      }

      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    } catch (err: any) {
      setError(err.message || t('Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-5 py-3">
        <div>
          <p className="text-[13px] font-medium text-ink">{t('Genotipo confirmado por DNA')}</p>
          <p className="text-[11.5px] text-muted">
            {t('Rellena solo si tienes resultados de Embark, Wisdom Panel u otro test genético.')}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : savedFlash ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {savedFlash ? t('Guardado') : t('Guardar')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-[color:var(--error)]/10 px-4 py-2 text-[13px] text-[color:var(--error)]">
          {error}
        </div>
      )}

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
                      {t('Borrar')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-dashed border-hairline bg-surface-soft px-4 py-3 text-[12.5px] text-muted">
        💡 {t('Los datos DNA tienen prioridad sobre la observación visual en el cálculo del forecast.')}
      </div>
    </div>
  )
}
