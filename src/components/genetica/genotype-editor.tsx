'use client'

import { useState } from 'react'
import { Img } from '@/components/ui/img'
import { createClient } from '@/lib/supabase/client'
import { Dna, Save, Loader2, Check, Palette, Microscope, AlertCircle } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { LOCI } from '@/lib/genetics/loci'
import ColorObservationForm from './color-observation-form'

// Color del chip de categoría de cada locus (color / pattern / coat). Mantiene
// el código de color con significado, en línea con los tipos de Salud.
const CATEGORY_TONE: Record<string, string> = {
  color: '#9b59b6',   // violeta — pigmento base
  pattern: '#f39c12', // ámbar — patrón
  coat: '#3498db',    // azul — pelo
}

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
    <div className="space-y-5">
      {/* Header del perro */}
      <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-canvas px-4 py-3.5">
        {dog.thumbnail_url ? (
          <Img w={120} src={dog.thumbnail_url} alt={dog.name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--brand-soft)' }}>
            <Dna className="h-5 w-5" style={{ color: 'var(--brand)' }} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-semibold tracking-[-0.02em] text-ink">{dog.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-surface-card px-2 py-0.5 text-[10.5px] font-medium text-body">
              {dog.sex === 'male' ? t('Macho') : dog.sex === 'female' ? t('Hembra') : t('Sexo no definido')}
            </span>
            {hasColorData && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-600">
                <Palette className="h-2.5 w-2.5" /> {t('Color registrado')}
              </span>
            )}
            {hasDnaData && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-600">
                <Microscope className="h-2.5 w-2.5" /> {initialGenotypes.length} {t('loci DNA')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — segmented control on-brand */}
      <div className="flex gap-1 rounded-xl border border-hairline bg-surface-soft p-1">
        <button
          onClick={() => setActiveTab('color')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
            activeTab === 'color' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          {t('Color visible')}
          {hasColorData && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        </button>
        <button
          onClick={() => setActiveTab('dna')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
            activeTab === 'dna' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Microscope className="h-3.5 w-3.5" />
          {t('Genotipo DNA (avanzado)')}
          {hasDnaData && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
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

  const filledCount = LOCI.filter((l) => {
    const c = genotypes.get(l.code)
    return !!c?.allele1 && !!c?.allele2
  }).length

  return (
    <div className="space-y-4">
      {/* Cabecera de sección (estilo Salud: tile de icono + título) */}
      <div className="rounded-2xl border border-hairline bg-surface-soft p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--brand-soft)' }}>
              <Microscope className="h-4.5 w-4.5" style={{ color: 'var(--brand)' }} />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">{t('Genotipo confirmado por DNA')}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted">
                {t('Rellena solo si tienes resultados de Embark, Wisdom Panel u otro test genético.')}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50"
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
        {filledCount > 0 && (
          <p className="mt-3 text-[11px] font-medium text-muted tabular-nums">
            {filledCount} / {LOCI.length} {t('loci con datos')}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-2.5 text-[13px] text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2.5">
        {LOCI.map((locus) => {
          const current = genotypes.get(locus.code)
          const a1 = current?.allele1 || ''
          const a2 = current?.allele2 || ''
          const hasData = !!a1 && !!a2
          const tone = CATEGORY_TONE[locus.category] || 'var(--brand)'
          const isCritical = !!locus.notes && locus.notes.includes('⚠️')

          return (
            <div
              key={locus.code}
              className={`rounded-2xl border p-3.5 transition ${
                hasData ? 'border-hairline bg-canvas' : 'border-hairline-soft bg-surface-soft/60'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-semibold leading-tight text-ink">{locus.name}</h3>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: tone + '1a', color: tone }}
                    >
                      {locus.category}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-snug text-body">{locus.description}</p>
                  {locus.notes && (
                    <p className={`mt-1.5 text-[11.5px] leading-snug ${isCritical ? 'font-medium text-red-600' : 'italic text-muted'}`}>{locus.notes}</p>
                  )}
                </div>

                {/* Selectores de alelos — par a1/a2 en una tarjetita compacta */}
                <div className="flex items-center gap-1.5">
                  <div className={`flex items-center gap-1 rounded-xl border px-1.5 py-1 ${hasData ? 'border-hairline bg-surface-soft' : 'border-hairline-soft bg-canvas'}`}>
                    <select
                      value={a1}
                      onChange={(e) => handleChange(locus.code, 1, e.target.value)}
                      className="rounded-lg border-0 bg-transparent px-1.5 py-1 text-[13px] font-medium text-ink focus:outline-none focus:ring-0"
                    >
                      <option value="">—</option>
                      {locus.alleles.map((al) => (
                        <option key={al.code} value={al.code}>
                          {al.code}
                        </option>
                      ))}
                    </select>
                    <span className="text-[12px] text-muted">/</span>
                    <select
                      value={a2}
                      onChange={(e) => handleChange(locus.code, 2, e.target.value)}
                      className="rounded-lg border-0 bg-transparent px-1.5 py-1 text-[13px] font-medium text-ink focus:outline-none focus:ring-0"
                    >
                      <option value="">—</option>
                      {locus.alleles.map((al) => (
                        <option key={al.code} value={al.code}>
                          {al.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  {hasData && (
                    <button
                      onClick={() => handleClear(locus.code)}
                      className="text-[11px] text-muted transition hover:text-ink"
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

      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft/40 px-4 py-3 text-[12px] leading-snug text-muted">
        💡 {t('Los datos DNA tienen prioridad sobre la observación visual en el cálculo del forecast.')}
      </div>
    </div>
  )
}
