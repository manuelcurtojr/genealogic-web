'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, Check, Palette, Info } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { inferGenotype, type ColorObservation } from '@/lib/genetics/inference'

interface Color {
  id: string
  name: string
}

interface Observation extends ColorObservation {
  id?: string
  color_id?: string | null
  notes?: string | null
}

interface Props {
  dogId: string
  /** Colores del estándar de la raza (filtrados). Vacío si raza desconocida o sin mapping. */
  breedColors: Color[]
  /** Todos los colores del catálogo (fallback cuando el user marca "ver todos"). */
  allColors: Color[]
  /** Nombre de la raza para mostrar en la UI. */
  breedName: string | null
  /** Color del perro guardado en dogs.color_id, usado como default si no hay observation. */
  defaultColorId: string | null
  initial: Observation | null
}

export default function ColorObservationForm({
  dogId,
  breedColors,
  allColors,
  breedName,
  defaultColorId,
  initial,
}: Props) {
  const t = useT()
  // Default: observation.color_id si existe, sino dogs.color_id (pre-selección del color del perro)
  const [colorId, setColorId] = useState<string>(initial?.color_id || defaultColorId || '')
  // Si el color por defecto no está en los del estándar de raza, abrir "todos" automáticamente
  const initialColorInBreed = !defaultColorId || breedColors.some((c) => c.id === defaultColorId)
  const [showAllColors, setShowAllColors] = useState<boolean>(
    breedColors.length === 0 || !initialColorInBreed
  )
  const colorsToShow = showAllColors ? allColors : breedColors
  const [coatLength, setCoatLength] = useState<'short' | 'medium' | 'long' | 'wire'>(
    initial?.coat_length || 'short'
  )
  const [whitePattern, setWhitePattern] = useState<'none' | 'small' | 'parti' | 'piebald'>(
    initial?.white_pattern || 'none'
  )
  const [hasMerle, setHasMerle] = useState(initial?.has_merle || false)
  const [hasMask, setHasMask] = useState(initial?.has_mask || false)
  const [hasTanPoints, setHasTanPoints] = useState(initial?.has_tan_points || false)
  const [hasBrindle, setHasBrindle] = useState(initial?.has_brindle || false)
  const [isDiluted, setIsDiluted] = useState(initial?.is_diluted || false)
  const [notes, setNotes] = useState(initial?.notes || '')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcular inferencia en tiempo real para preview
  // Buscar en allColors (que es el catálogo completo) para resolver el nombre
  const colorName = allColors.find((c) => c.id === colorId)?.name || null
  const preview = inferGenotype({
    color_name: colorName,
    coat_length: coatLength,
    white_pattern: whitePattern,
    has_merle: hasMerle,
    has_mask: hasMask,
    has_tan_points: hasTanPoints,
    has_brindle: hasBrindle,
    is_diluted: isDiluted,
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const supabase = createClient()

    const payload = {
      dog_id: dogId,
      color_id: colorId || null,
      coat_length: coatLength,
      white_pattern: whitePattern,
      has_merle: hasMerle,
      has_mask: hasMask,
      has_tan_points: hasTanPoints,
      has_brindle: hasBrindle,
      is_diluted: isDiluted,
      notes: notes.trim() || null,
    }

    const { error: upsertErr } = await supabase
      .from('dog_color_observations')
      .upsert(payload, { onConflict: 'dog_id' })

    setSaving(false)

    if (upsertErr) {
      setError(upsertErr.message)
      return
    }

    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-hairline bg-canvas p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted" />
            <h3 className="text-[14.5px] font-semibold text-ink">
              {t('Color y aspecto visible')}
            </h3>
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

        <div className="space-y-4">
          {/* Color principal */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                {t('Color principal')}
                {!showAllColors && breedName && breedColors.length > 0 && (
                  <span className="ml-1.5 normal-case tracking-normal text-muted/70">
                    {t('· estándar')} {breedName}
                  </span>
                )}
              </label>
              {breedColors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllColors((v) => !v)}
                  className="text-[11.5px] font-medium text-body hover:text-ink"
                >
                  {showAllColors ? t('Ver solo estándar') : t('Ver todos los colores')}
                </button>
              )}
            </div>
            <select
              value={colorId}
              onChange={(e) => setColorId(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
            >
              <option value="">{t('— Selecciona un color —')}</option>
              {colorsToShow.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {breedColors.length === 0 ? (
              <p className="mt-1 flex items-start gap-1.5 text-[11.5px] text-muted">
                <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>
                  {t('No hay colores estándar definidos para esta raza. Mostrando catálogo completo.')}
                </span>
              </p>
            ) : showAllColors ? (
              <p className="mt-1 text-[11.5px] text-muted">
                {t('Mostrando todos los colores (incluidos los que no son del estándar de la raza).')}
              </p>
            ) : (
              <p className="mt-1 text-[11.5px] text-muted">
                {t('Solo se muestran los')} {breedColors.length} {t('colores aceptados en el estándar de')} {breedName}.
              </p>
            )}
          </div>

          {/* Longitud + manchas blancas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                {t('Longitud del pelo')}
              </label>
              <select
                value={coatLength}
                onChange={(e) => setCoatLength(e.target.value as any)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
              >
                <option value="short">{t('Corto')}</option>
                <option value="medium">{t('Medio')}</option>
                <option value="long">{t('Largo')}</option>
                <option value="wire">{t('Duro (wire)')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                {t('Manchas blancas')}
              </label>
              <select
                value={whitePattern}
                onChange={(e) => setWhitePattern(e.target.value as any)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
              >
                <option value="none">{t('Ninguna')}</option>
                <option value="small">{t('Pequeñas (pecho/patas)')}</option>
                <option value="parti">{t('Bicolor / con blanco')}</option>
                <option value="piebald">{t('Piebald / pinto extenso')}</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div>
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              {t('Características visibles')}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Toggle
                label={t('Atigrado / bardino / brindle')}
                hint={t('Rayas verticales sobre color base')}
                checked={hasBrindle}
                onChange={setHasBrindle}
              />
              <Toggle
                label={t('Merle / arlequín')}
                hint={t('⚠️ Cruce M×M peligroso')}
                checked={hasMerle}
                onChange={setHasMerle}
              />
              <Toggle
                label={t('Negro y fuego (tan points)')}
                hint={t('Marcas tan en cejas, patas, pecho')}
                checked={hasTanPoints}
                onChange={setHasTanPoints}
              />
              <Toggle
                label={t('Máscara facial negra')}
                hint={t('Hocico oscuro')}
                checked={hasMask}
                onChange={setHasMask}
              />
              <Toggle
                label={t('Color diluido (azul/isabella/lilac)')}
                hint={t('Pigmento más pálido de lo normal')}
                checked={isDiluted}
                onChange={setIsDiluted}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              {t('Notas')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
              placeholder={t('Observaciones adicionales sobre el color o aspecto del perro...')}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview de inferencia */}
      <div className="rounded-xl border border-hairline bg-surface-soft p-5">
        <h4 className="mb-3 text-[13px] font-semibold text-ink">{t('Genotipo inferido (preview)')}</h4>
        <p className="mb-4 text-[12px] text-muted">
          {t('A partir de lo que has indicado, estos son los alelos compatibles. "?" = desconocido. Si conoces el genotipo exacto desde un test DNA, edítalo en la pestaña "Genotipo DNA".')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {preview.map((p) => {
            const hasData = p.allele1.code !== '?' || p.allele2.code !== '?'
            if (!hasData) return null
            return (
              <div
                key={p.locus}
                className="rounded-lg border border-hairline bg-canvas px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-muted">{t('Locus')} {p.locus}</span>
                  <span className="font-mono text-[13.5px] font-semibold tabular-nums text-ink">
                    {p.allele1.code}/{p.allele2.code}
                  </span>
                </div>
                {p.reasoning.length > 0 && (
                  <p className="mt-1 text-[11px] italic text-muted">{p.reasoning[0]}</p>
                )}
              </div>
            )
          })}
        </div>
        {preview.every((p) => p.allele1.code === '?' && p.allele2.code === '?') && (
          <p className="text-[12.5px] text-muted">
            {t('Rellena el color principal y las características arriba para ver los alelos inferidos.')}
          </p>
        )}
      </div>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-hairline bg-canvas px-3 py-2.5 transition-colors hover:bg-surface-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-hairline"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-ink">{label}</span>
        {hint && <span className="block text-[11px] text-muted">{hint}</span>}
      </span>
    </label>
  )
}
