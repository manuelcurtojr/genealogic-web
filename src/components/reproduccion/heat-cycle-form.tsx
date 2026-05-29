'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import { Portal } from '@/components/ui/portal'

interface Female {
  id: string
  name: string
}

interface Props {
  open: boolean
  females: Female[]
  defaultFemaleId?: string
  onClose: () => void
  onSaved: () => void
}

/**
 * Panel lateral para registrar un celo. Mismo patrón visual que
 * dog-form-panel / event-form / vet-reminder-form: slide-from-right con
 * safe-area, Portal y diseño responsive (desktop y móvil).
 */
export default function HeatCycleForm({ open, females, defaultFemaleId, onClose, onSaved }: Props) {
  const [dogId, setDogId] = useState(defaultFemaleId || females[0]?.id || '')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [wasMated, setWasMated] = useState(false)
  const [matingDate, setMatingDate] = useState(new Date().toISOString().split('T')[0])
  const [matingEndDate, setMatingEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset al abrir
  useEffect(() => {
    if (!open) return
    setDogId(defaultFemaleId || females[0]?.id || '')
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setWasMated(false)
    setMatingDate(new Date().toISOString().split('T')[0])
    setMatingEndDate('')
    setNotes('')
    setError(null)
  }, [open, defaultFemaleId, females])

  // ESC para cerrar
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('No se pudo identificar al usuario.')
      setSaving(false)
      return
    }

    if (!dogId) {
      setError('Selecciona una hembra.')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase.from('heat_cycles').insert({
      owner_id: user.id,
      dog_id: dogId,
      start_date: startDate,
      end_date: endDate || null,
      was_mated: wasMated,
      mating_date: wasMated ? (matingDate || startDate) : null,
      mating_end_date: wasMated && matingEndDate ? matingEndDate : null,
      pregnancy_status: wasMated ? 'suspected' : 'none',
      notes: notes.trim() || null,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    onSaved()
  }

  return (
    <Portal>
      <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide panel — mismo patrón que dog-form-panel / genos-panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-xl z-[70] bg-white border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col overflow-x-hidden ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
        style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
      >
        {/* Fixed header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold">Registrar celo</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition p-1"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[12.5px] text-red-400">
                {error}
              </div>
            )}

            {/* Hembra */}
            <div>
              <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">
                Hembra *
              </label>
              <select
                value={dogId}
                onChange={(e) => setDogId(e.target.value)}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition appearance-none"
                required
              >
                {females.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">
                  Inicio del celo *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">
                  Fin (opcional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition"
                />
              </div>
            </div>
            <p className="-mt-2 text-[11.5px] text-muted">
              Si dejas el fin en blanco, se estimará 21 días después del inicio.
            </p>

            {/* Monta */}
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={wasMated}
                onChange={(e) => setWasMated(e.target.checked)}
                className="h-4 w-4 rounded border-hairline"
              />
              Hubo cruce/monta durante este celo
            </label>

            {wasMated && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">
                    Primera monta *
                  </label>
                  <input
                    type="date"
                    value={matingDate}
                    onChange={(e) => setMatingDate(e.target.value)}
                    className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition"
                    required={wasMated}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">
                    Última monta (opcional)
                  </label>
                  <input
                    type="date"
                    value={matingEndDate}
                    min={matingDate || undefined}
                    onChange={(e) => setMatingEndDate(e.target.value)}
                    className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition"
                  />
                </div>
                <p className="col-span-2 -mt-1 text-[11.5px] text-muted">
                  La monta no es el inicio del celo. Desde aquí calculamos la confirmación de preñez (~28 días) y el parto previsto (~63 días).
                </p>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="text-xs font-semibold text-body uppercase tracking-wider mb-1 block">
                Notas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Observaciones, semental, niveles de progesterona..."
                className="w-full bg-surface-card border border-hairline rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Fixed footer */}
          <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-hairline flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2.5 rounded-lg text-sm text-body hover:text-ink hover:bg-surface-card transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-ink text-on-primary hover:opacity-90 font-semibold px-4 sm:px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
      </>
    </Portal>
  )
}
