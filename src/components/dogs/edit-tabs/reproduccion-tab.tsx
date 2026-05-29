'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Heart, Calendar, Baby, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import {
  computeReproInfo, parseDate, addDays, fmtDate, daysBetween, todayLocal, birthWindowText,
  HEAT_DURATION_DAYS, GESTATION_DAYS, CONFIRM_PREGNANCY_DAYS,
  type HeatCycleLike, type LitterLike,
} from '@/lib/repro/cycle'

interface Props {
  dogId: string
  userId: string
}

/**
 * Tab "Reproducción" del edit panel de perro — solo aplica a hembras.
 * Estado reproductivo (celo / montada / gestante / reposo), predicción del
 * próximo celo, confirmación de preñez y camadas resultantes.
 * La lógica vive en @/lib/repro/cycle (compartida con el gantt y el cron).
 */
export default function ReproduccionTab({ dogId, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<HeatCycleLike[]>([])
  const [litters, setLitters] = useState<LitterLike[]>([])
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  // Estado del form (registrar celo)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [wasMated, setWasMated] = useState(false)
  const [matingDate, setMatingDate] = useState('')
  const [matingEndDate, setMatingEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Edición de fechas de monta del celo montado actual (tarjeta de confirmación)
  const [editMatingStart, setEditMatingStart] = useState('')
  const [editMatingEnd, setEditMatingEnd] = useState('')
  const [matingEdited, setMatingEdited] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const [cyclesRes, littersRes] = await Promise.all([
        supabase
          .from('heat_cycles')
          .select('id, dog_id, start_date, end_date, was_mated, mating_date, mating_end_date, pregnancy_status, resulted_in_litter_id, notes')
          .eq('dog_id', dogId)
          .order('start_date', { ascending: false }),
        supabase
          .from('litters')
          .select('id, status, mating_date, birth_date, mother_id, puppy_count')
          .eq('mother_id', dogId)
          .order('mating_date', { ascending: false }),
      ])
      setCycles((cyclesRes.data as HeatCycleLike[]) || [])
      setLitters((littersRes.data as LitterLike[]) || [])
    } catch (err: any) {
      setError(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: insertErr } = await supabase.from('heat_cycles').insert({
      owner_id: userId,
      dog_id: dogId,
      start_date: startDate,
      end_date: endDate || null,
      was_mated: wasMated,
      // Si hubo monta guardamos la(s) fecha(s) de monta y marcamos "pendiente
      // de confirmar". La monta NO es el inicio del celo (fechas distintas).
      mating_date: wasMated ? (matingDate || startDate) : null,
      mating_end_date: wasMated && matingEndDate ? matingEndDate : null,
      pregnancy_status: wasMated ? 'suspected' : 'none',
      notes: notes.trim() || null,
    })
    setSaving(false)
    if (insertErr) {
      setError(insertErr.message)
      return
    }
    setShowForm(false)
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setWasMated(false)
    setMatingDate('')
    setMatingEndDate('')
    setNotes('')
    load()
  }

  // Confirmar/descartar preñez sobre el celo montado
  const setPregnancyStatus = async (cycleId: string, status: 'confirmed' | 'failed') => {
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('heat_cycles')
      .update({ pregnancy_status: status })
      .eq('id', cycleId)
    setBusy(false)
    if (err) { setError(err.message); return }
    load()
  }

  // Guardar/corregir las fechas de monta del celo montado (recalcula el parto).
  const saveMatingDates = async (cycleId: string) => {
    if (!editMatingStart) { setError('Indica la fecha de la primera monta.'); return }
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('heat_cycles')
      .update({
        was_mated: true,
        mating_date: editMatingStart,
        mating_end_date: editMatingEnd || null,
      })
      .eq('id', cycleId)
    setBusy(false)
    if (err) { setError(err.message); return }
    setMatingEdited(true)
    load()
  }

  const today = todayLocal()
  const info = computeReproInfo(dogId, cycles, litters, today)

  // Sincroniza los inputs de edición de monta con el celo montado actual.
  const dcId = info.drivingCycle?.id
  const dcMating = info.drivingCycle?.mating_date || ''
  const dcMatingEnd = info.drivingCycle?.mating_end_date || ''
  useEffect(() => {
    if (info.state === 'mated_pending') {
      setEditMatingStart(dcMating)
      setEditMatingEnd(dcMatingEnd)
      setMatingEdited(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dcId, dcMating, dcMatingEnd, info.state])

  const stateColor =
    info.state === 'in_heat' ? 'text-blue-600'
      : info.state === 'mated_pending' ? 'text-amber-600'
        : info.state === 'pregnant' ? 'text-pink-600'
          : 'text-muted'
  const StateIcon = info.state === 'pregnant' ? Baby : Heart

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">
          {error}
        </div>
      )}

      {/* Estado actual + próximo celo */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Estado actual</p>
          <p className={`mt-2 flex items-center gap-2 text-[14px] font-semibold ${stateColor}`}>
            {info.state !== 'idle' && <StateIcon className="h-4 w-4" />} {info.stateLabel}
          </p>
          {info.expectedBirth && (
            <p className="mt-1 text-[12px] text-muted">
              Parto previsto: <strong className="text-ink">{birthWindowText(info)}</strong>
              {(() => { const d = daysBetween(today, info.expectedBirth!); return d >= 0 ? ` · en ${d} día${d === 1 ? '' : 's'}` : ` · hace ${-d} día${d === -1 ? '' : 's'}` })()}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Próximo celo previsto</p>
          {info.nextHeatForecast ? (
            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-ink">
              <Calendar className="h-4 w-4 text-muted" /> {fmtDate(info.nextHeatForecast)}
              <span className="text-[11.5px] font-normal text-muted">({info.avgIntervalDays}d)</span>
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-muted">
              Registra al menos 2 celos para calcular predicción.
            </p>
          )}
        </div>
      </div>

      {/* Montada · pendiente de confirmar — fechas de monta EDITABLES + confirmar */}
      {info.state === 'mated_pending' && info.drivingCycle && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-3">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold text-amber-900">
            <Heart className="h-4 w-4 flex-shrink-0 text-amber-600" /> Montada · pendiente de confirmar preñez
          </p>

          {/* Fechas de monta (la monta NO es el inicio del celo) */}
          <div className="rounded-lg border border-amber-200 bg-white/60 p-3">
            <p className="mb-2 text-[11.5px] text-amber-900">
              Pon los días en que el macho (o la inseminación) cubrió a la perra. El parto se calcula desde aquí, no desde el celo.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.06em] text-amber-800">Primera monta *</label>
                <input
                  type="date"
                  value={editMatingStart}
                  onChange={(e) => setEditMatingStart(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[13px] text-ink focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.06em] text-amber-800">Última monta (opcional)</label>
                <input
                  type="date"
                  value={editMatingEnd}
                  min={editMatingStart || undefined}
                  onChange={(e) => setEditMatingEnd(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[13px] text-ink focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[12px] text-amber-900">
                {info.expectedBirth ? <>Parto previsto: <strong>{birthWindowText(info)}</strong></> : 'Indica la fecha de monta'}
              </p>
              {(editMatingStart !== (info.drivingCycle.mating_date || '') || editMatingEnd !== (info.drivingCycle.mating_end_date || '')) && (
                <button
                  onClick={() => saveMatingDates(info.drivingCycle!.id)}
                  disabled={busy}
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[12px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar fechas
                </button>
              )}
            </div>
            {matingEdited && <p className="mt-1 text-[11px] text-emerald-700">Fechas de monta actualizadas ✓</p>}
          </div>

          <p className="text-[12px] text-amber-800">
            {info.confirmDueDate && daysBetween(today, info.confirmDueDate) > 0
              ? `Podrás confirmar por ecografía hacia el ${fmtDate(info.confirmDueDate)} (día ${CONFIRM_PREGNANCY_DAYS} desde la monta).`
              : `Ya puedes confirmar (ecografía a partir del día ${CONFIRM_PREGNANCY_DAYS}). ¿Quedó preñada?`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPregnancyStatus(info.drivingCycle!.id, 'confirmed')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Sí, está preñada
            </button>
            <button
              onClick={() => setPregnancyStatus(info.drivingCycle!.id, 'failed')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-body transition hover:text-ink disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> No quedó preñada
            </button>
          </div>
        </div>
      )}

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-ink">Historial de celos</h3>
        {!showForm && (
          <button
            onClick={() => { setMatingDate(startDate); setShowForm(true) }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar celo
          </button>
        )}
      </div>

      {/* Form inline */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-surface-soft p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                Inicio del celo *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); if (!matingDate) setMatingDate(e.target.value) }}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[13.5px] text-ink focus:border-ink focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                Fin (opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[13.5px] text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink">
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
                <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                  Primera monta *
                </label>
                <input
                  type="date"
                  value={matingDate}
                  onChange={(e) => setMatingDate(e.target.value)}
                  className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[13.5px] text-ink focus:border-ink focus:outline-none"
                  required={wasMated}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.06em] text-muted">
                  Última monta (opcional)
                </label>
                <input
                  type="date"
                  value={matingEndDate}
                  min={matingDate || undefined}
                  onChange={(e) => setMatingEndDate(e.target.value)}
                  className="w-full rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[13.5px] text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <p className="col-span-2 -mt-1 text-[11px] text-muted">
                La monta NO es el inicio del celo. Con estas fechas calculamos la confirmación de preñez (~{CONFIRM_PREGNANCY_DAYS} días) y el parto previsto (~{GESTATION_DAYS} días).
              </p>
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notas: semental, progesterona, observaciones..."
            className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13.5px] text-ink focus:border-ink focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-body hover:bg-surface-card"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Lista de celos */}
      {cycles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-10 text-center">
          <Heart className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-2 text-[13px] text-body">Aún no hay celos registrados.</p>
          <p className="mt-1 text-[11.5px] text-muted">
            Empieza registrando el más reciente para activar la predicción.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline-soft overflow-hidden rounded-xl border border-hairline bg-canvas">
          {cycles.map((c) => {
            const start = parseDate(c.start_date)
            const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
            const preg = c.pregnancy_status ?? 'none'
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Heart className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink">
                    {fmtDate(start)} → {fmtDate(end)}
                    {!c.end_date && <span className="ml-1 text-[11px] text-muted">(estimado)</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                    {c.was_mated && (
                      <span className="font-medium text-pink-600">
                        Monta{c.mating_date ? ` ${fmtDate(parseDate(c.mating_date))}` : ''}
                      </span>
                    )}
                    {preg === 'suspected' && <span className="text-amber-600">· pendiente confirmar</span>}
                    {preg === 'confirmed' && <span className="text-pink-600">· preñez confirmada</span>}
                    {preg === 'failed' && <span>· no preñada</span>}
                    {c.notes && <span className="truncate">· {c.notes}</span>}
                  </div>
                </div>
                {c.resulted_in_litter_id && (
                  <Link
                    href={`/litters/${c.resulted_in_litter_id}`}
                    className="text-[12px] font-medium text-body hover:text-ink"
                  >
                    Ver camada →
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Camadas resultantes (resumen) */}
      {litters.length > 0 && (
        <div className="rounded-xl border border-hairline bg-canvas p-4">
          <h4 className="mb-2 text-[13px] font-semibold text-ink">Camadas como madre</h4>
          <ul className="divide-y divide-hairline-soft">
            {litters.slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <Baby className="h-3.5 w-3.5 text-muted" />
                  <span className="text-[13px] text-ink">
                    {l.status === 'born' && l.birth_date
                      ? `Nacida ${fmtDate(parseDate(l.birth_date))}`
                      : l.status === 'mated' && l.mating_date
                        ? `Gestación desde ${fmtDate(parseDate(l.mating_date))}`
                        : 'Planificada'}
                  </span>
                  {l.puppy_count != null && (
                    <span className="text-[11.5px] text-muted">· {l.puppy_count} cachorros</span>
                  )}
                </div>
                <Link href={`/litters/${l.id}`} className="text-[12px] font-medium text-body hover:text-ink">
                  Ver →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Link al planificador global */}
      <p className="text-[11.5px] text-muted">
        💡 Para ver todas tus hembras en un calendario único, ve a{' '}
        <Link href="/reproduccion" className="text-ink underline">
          Calendario reproductivo
        </Link>
        .
      </p>
    </div>
  )
}
