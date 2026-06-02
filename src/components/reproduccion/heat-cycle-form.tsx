'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, Heart, CalendarDays, Baby, Trash2 } from 'lucide-react'
import { useT } from '@/components/i18n/locale-provider'
import { Portal } from '@/components/ui/portal'
import MatingDatesInput, { cleanMatingDates } from './mating-dates-input'
import { parseDate, addDays, fmtDate, GESTATION_DAYS, type HeatCycleLike } from '@/lib/repro/cycle'

interface Female {
  id: string
  name: string
}

interface Props {
  open: boolean
  females: Female[]
  defaultFemaleId?: string
  /** Si se pasa, el panel edita ese celo (UPDATE) en vez de crear uno nuevo. */
  editCycle?: HeatCycleLike | null
  onClose: () => void
  onSaved: () => void
}

const today = () => new Date().toISOString().split('T')[0]

/**
 * Panel lateral para registrar O editar un celo. Slide-from-right responsive
 * (Portal + safe-area). Captura los días exactos de monta (lista dinámica) y
 * calcula la ventana de parto.
 */
export default function HeatCycleForm({ open, females, defaultFemaleId, editCycle, onClose, onSaved }: Props) {
  const t = useT()
  const isEdit = !!editCycle
  const [dogId, setDogId] = useState(defaultFemaleId || females[0]?.id || '')
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState('')
  const [wasMated, setWasMated] = useState(false)
  const [matingDates, setMatingDates] = useState<string[]>([''])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefill al abrir (edición) o reset (creación)
  useEffect(() => {
    if (!open) return
    if (editCycle) {
      setDogId(editCycle.dog_id)
      setStartDate(editCycle.start_date)
      setEndDate(editCycle.end_date || '')
      setWasMated(editCycle.was_mated)
      const fromArray = editCycle.mating_dates && editCycle.mating_dates.length ? editCycle.mating_dates : null
      const fromLegacy = [editCycle.mating_date, editCycle.mating_end_date].filter(Boolean) as string[]
      setMatingDates(fromArray || (fromLegacy.length ? fromLegacy : ['']))
      setNotes(editCycle.notes || '')
    } else {
      setDogId(defaultFemaleId || females[0]?.id || '')
      setStartDate(today())
      setEndDate('')
      setWasMated(false)
      setMatingDates([today()])
      setNotes('')
    }
    setError(null)
    setConfirmingDelete(false)
  }, [open, editCycle, defaultFemaleId, females])

  // ESC para cerrar
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Vista previa de la ventana de parto
  const cleaned = cleanMatingDates(matingDates)
  const birthFrom = cleaned.length ? fmtDate(addDays(parseDate(cleaned[0]), GESTATION_DAYS)) : null
  const birthTo = cleaned.length ? fmtDate(addDays(parseDate(cleaned[cleaned.length - 1]), GESTATION_DAYS)) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!dogId) { setError(t('Selecciona una hembra.')); return }
    if (wasMated && cleaned.length === 0) { setError(t('Añade al menos un día de monta.')); return }
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError(t('No se pudo identificar al usuario.')); setSaving(false); return }

    // pregnancy_status: si hay monta, 'suspected' (salvo que ya estuviera
    // confirmada/descartada en edición, en cuyo caso lo respetamos).
    const prevStatus = editCycle?.pregnancy_status
    const pregnancy_status = !wasMated
      ? 'none'
      : (prevStatus === 'confirmed' || prevStatus === 'failed' ? prevStatus : 'suspected')

    const payload = {
      start_date: startDate,
      end_date: endDate || null,
      was_mated: wasMated,
      mating_dates: wasMated && cleaned.length ? cleaned : null,
      mating_date: wasMated && cleaned.length ? cleaned[0] : null,
      mating_end_date: wasMated && cleaned.length > 1 ? cleaned[cleaned.length - 1] : null,
      pregnancy_status,
      notes: notes.trim() || null,
    }

    const { error: dbErr } = isEdit
      ? await supabase.from('heat_cycles').update(payload).eq('id', editCycle!.id)
      : await supabase.from('heat_cycles').insert({ ...payload, owner_id: user.id, dog_id: dogId })

    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    onSaved()
  }

  // Eliminar el celo (solo en edición). Lo dispara el usuario, con confirmación.
  const handleDelete = async () => {
    if (!editCycle) return
    setDeleting(true)
    setError(null)
    const supabase = createClient()
    const { error: delErr } = await supabase.from('heat_cycles').delete().eq('id', editCycle.id)
    setDeleting(false)
    if (delErr) { setError(delErr.message); return }
    onSaved()
  }

  return (
    <Portal>
      <>
        <div
          className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
        />
        <div
          className={`fixed top-0 right-0 h-dvh w-full sm:max-w-md z-[70] bg-canvas border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col overflow-x-hidden ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
          style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-hairline flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <Heart className="h-4.5 w-4.5 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-semibold tracking-[-0.01em] text-ink">
                  {isEdit ? t('Editar celo') : t('Registrar celo')}
                </h2>
                <p className="text-[11.5px] text-muted">{t('Celo, monta y predicción de parto')}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition hover:bg-surface-soft hover:text-ink flex-shrink-0" aria-label={t('Cerrar')}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable form */}
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0">
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[12.5px] text-red-500">{error}</div>
              )}

              {/* Hembra */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Hembra')}</label>
                <select
                  value={dogId}
                  onChange={(e) => setDogId(e.target.value)}
                  disabled={isEdit}
                  className="w-full appearance-none rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-[14px] text-ink focus:border-ink focus:outline-none disabled:opacity-60"
                >
                  {females.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              {/* Celo */}
              <div className="rounded-2xl border border-hairline bg-surface-soft/50 p-3.5">
                <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <CalendarDays className="h-3.5 w-3.5 text-muted" /> {t('Celo')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted">{t('Inicio *')}</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                      className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-[14px] text-ink focus:border-ink focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted">{t('Fin (opcional)')}</label>
                    <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-[14px] text-ink focus:border-ink focus:outline-none" />
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted">{t('Si dejas el fin en blanco, se estima 21 días tras el inicio.')}</p>
              </div>

              {/* Monta */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input type="checkbox" checked={wasMated}
                    onChange={(e) => { const v = e.target.checked; setWasMated(v); if (v && cleanMatingDates(matingDates).length === 0) setMatingDates([today()]) }}
                    className="h-4 w-4 rounded border-rose-300 text-rose-600" />
                  <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink">
                    <Heart className="h-3.5 w-3.5 text-rose-500" /> {t('Hubo cruce / monta')}
                  </span>
                </label>

                {wasMated && (
                  <div className="mt-3 space-y-3">
                    <MatingDatesInput value={matingDates} onChange={setMatingDates} />
                    {birthFrom && (
                      <div className="flex items-center gap-2 rounded-xl bg-pink-100/70 px-3 py-2 text-[12.5px] text-pink-900">
                        <Baby className="h-4 w-4 flex-shrink-0 text-pink-600" />
                        <span>
                          {t('Parto previsto:')}{' '}
                          <strong>{birthFrom === birthTo ? birthFrom : `${birthFrom} – ${birthTo}`}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Notas')}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  placeholder={t('Semental, progesterona, observaciones...')}
                  className="w-full resize-none rounded-xl border border-hairline bg-canvas px-3 py-2.5 text-base sm:text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-hairline px-4 sm:px-6 py-3.5 flex-shrink-0">
              {/* Eliminar (solo edición) — con confirmación de 2 pasos */}
              {isEdit && (
                confirmingDelete ? (
                  <div className="mr-auto flex items-center gap-2">
                    <span className="text-[12px] text-red-600">{t('¿Eliminar?')}</span>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
                      {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {t('Sí, eliminar')}
                    </button>
                    <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded-lg px-2 py-2 text-[12.5px] text-body hover:text-ink">{t('No')}</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmingDelete(true)}
                    className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] text-red-500 transition hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" /> {t('Eliminar')}
                  </button>
                )
              )}
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-[13.5px] text-body transition hover:bg-surface-card hover:text-ink">{t('Cancelar')}</button>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? t('Guardar cambios') : t('Guardar celo')}
              </button>
            </div>
          </form>
        </div>
      </>
    </Portal>
  )
}
