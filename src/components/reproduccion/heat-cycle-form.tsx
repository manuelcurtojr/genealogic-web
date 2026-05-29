'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'

interface Female {
  id: string
  name: string
}

interface Props {
  females: Female[]
  defaultFemaleId?: string
  onClose: () => void
  onSaved: () => void
}

export default function HeatCycleForm({ females, defaultFemaleId, onClose, onSaved }: Props) {
  const [dogId, setDogId] = useState(defaultFemaleId || females[0]?.id || '')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [wasMated, setWasMated] = useState(false)
  const [matingDate, setMatingDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-canvas shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">Registrar celo</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted transition-colors hover:bg-surface-soft hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Hembra
            </label>
            <select
              value={dogId}
              onChange={(e) => setDogId(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
              required
            >
              {females.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                Inicio del celo *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                Fin (opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>
          <p className="-mt-2 text-[11.5px] text-muted">
            Si dejas el fin en blanco, se estimará 21 días después del inicio.
          </p>

          <label className="flex items-center gap-2 text-[13.5px] text-ink">
            <input
              type="checkbox"
              checked={wasMated}
              onChange={(e) => setWasMated(e.target.checked)}
              className="h-4 w-4 rounded border-hairline"
            />
            Hubo cruce/monta durante este celo
          </label>

          {wasMated && (
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
                Fecha de la monta *
              </label>
              <input
                type="date"
                value={matingDate}
                onChange={(e) => setMatingDate(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
                required={wasMated}
              />
              <p className="mt-1 text-[11.5px] text-muted">
                A partir de aquí calculamos la confirmación de preñez (~28 días) y el parto previsto (~63 días).
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-muted">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
              placeholder="Observaciones, semental, niveles de progesterona..."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-hairline bg-canvas px-4 py-2 text-[13px] font-medium text-body hover:bg-surface-soft"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
