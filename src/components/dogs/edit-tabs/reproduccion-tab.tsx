'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Heart, Calendar, Baby, CheckCircle2, XCircle, Pencil } from 'lucide-react'
import Link from 'next/link'
import HeatCycleForm from '@/components/reproduccion/heat-cycle-form'
import {
  computeReproInfo, parseDate, addDays, fmtDate, daysBetween, todayLocal, birthWindowText,
  HEAT_DURATION_DAYS, CONFIRM_PREGNANCY_DAYS,
  type HeatCycleLike, type LitterLike,
} from '@/lib/repro/cycle'

interface Props {
  dogId: string
  userId: string
}

/**
 * Tab "Reproducción" del edit panel de perro — solo aplica a hembras.
 * Estado reproductivo, predicción del próximo celo, confirmación de preñez y
 * camadas. El alta/edición de celos usa el mismo panel HeatCycleForm que el
 * gantt (con lista dinámica de montas). La lógica vive en @/lib/repro/cycle.
 */
export default function ReproduccionTab({ dogId, userId }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<HeatCycleLike[]>([])
  const [litters, setLitters] = useState<LitterLike[]>([])
  const [dogName, setDogName] = useState<string>('Esta hembra')
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editCycle, setEditCycle] = useState<HeatCycleLike | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const [cyclesRes, littersRes, dogRes] = await Promise.all([
        supabase
          .from('heat_cycles')
          .select('id, dog_id, start_date, end_date, was_mated, mating_date, mating_end_date, mating_dates, pregnancy_status, resulted_in_litter_id, notes')
          .eq('dog_id', dogId)
          .order('start_date', { ascending: false }),
        supabase
          .from('litters')
          .select('id, status, mating_date, birth_date, mother_id, puppy_count')
          .eq('mother_id', dogId)
          .order('mating_date', { ascending: false }),
        supabase.from('dogs').select('name').eq('id', dogId).maybeSingle(),
      ])
      setCycles((cyclesRes.data as HeatCycleLike[]) || [])
      setLitters((littersRes.data as LitterLike[]) || [])
      if (dogRes.data?.name) setDogName(dogRes.data.name)
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

  // Confirmar/descartar preñez del celo montado
  const setPregnancyStatus = async (cycleId: string, status: 'confirmed' | 'failed') => {
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('heat_cycles').update({ pregnancy_status: status }).eq('id', cycleId)
    setBusy(false)
    if (err) { setError(err.message); return }
    load()
  }

  const openCreate = () => { setEditCycle(null); setShowForm(true) }
  const openEdit = (c: HeatCycleLike) => { setEditCycle(c); setShowForm(true) }

  const today = todayLocal()
  const info = computeReproInfo(dogId, cycles, litters, today)

  const stateColor =
    info.state === 'in_heat' ? 'text-blue-600'
      : info.state === 'mated_pending' ? 'text-amber-600'
        : info.state === 'pregnant' ? 'text-pink-600'
          : 'text-muted'
  const StateIcon = info.state === 'pregnant' ? Baby : Heart

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted"><Loader2 className="h-5 w-5 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-[color:var(--error)]/10 px-3 py-2 text-[12.5px] text-[color:var(--error)]">{error}</div>
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
            <p className="mt-2 text-[13px] text-muted">Registra al menos 2 celos para calcular predicción.</p>
          )}
        </div>
      </div>

      {/* Montada · pendiente de confirmar */}
      {info.state === 'mated_pending' && info.drivingCycle && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-3">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold text-amber-900">
            <Heart className="h-4 w-4 flex-shrink-0 text-amber-600" /> Montada · pendiente de confirmar preñez
          </p>
          <p className="text-[12px] text-amber-800">
            Monta: <strong>{info.matingDate ? fmtDate(info.matingDate) : '—'}</strong>
            {info.matingEndDate && info.matingEndDate.getTime() !== info.matingDate?.getTime() && <> → {fmtDate(info.matingEndDate)}</>}
            {' · '}Parto previsto: <strong>{birthWindowText(info)}</strong>.{' '}
            <button onClick={() => openEdit(info.drivingCycle!)} className="font-medium underline">Editar fechas de monta</button>
          </p>
          <p className="text-[12px] text-amber-800">
            {info.confirmDueDate && daysBetween(today, info.confirmDueDate) > 0
              ? `Podrás confirmar por ecografía hacia el ${fmtDate(info.confirmDueDate)} (día ${CONFIRM_PREGNANCY_DAYS} desde la monta).`
              : `Ya puedes confirmar (ecografía a partir del día ${CONFIRM_PREGNANCY_DAYS}). ¿Quedó preñada?`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPregnancyStatus(info.drivingCycle!.id, 'confirmed')} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-1.5 text-[12.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Sí, está preñada
            </button>
            <button onClick={() => setPregnancyStatus(info.drivingCycle!.id, 'failed')} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-[12.5px] font-medium text-body transition hover:text-ink disabled:opacity-50">
              <XCircle className="h-3.5 w-3.5" /> No quedó preñada
            </button>
          </div>
        </div>
      )}

      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-ink">Historial de celos</h3>
        <button onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Registrar celo
        </button>
      </div>

      {/* Lista de celos — clicables para editar */}
      {cycles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-10 text-center">
          <Heart className="mx-auto h-7 w-7 text-muted" />
          <p className="mt-2 text-[13px] text-body">Aún no hay celos registrados.</p>
          <p className="mt-1 text-[11.5px] text-muted">Empieza registrando el más reciente para activar la predicción.</p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline-soft overflow-hidden rounded-xl border border-hairline bg-canvas">
          {cycles.map((c) => {
            const start = parseDate(c.start_date)
            const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
            const preg = c.pregnancy_status ?? 'none'
            const matings = (c.mating_dates && c.mating_dates.length) ? c.mating_dates : [c.mating_date, c.mating_end_date].filter(Boolean) as string[]
            return (
              <li key={c.id}>
                <button onClick={() => openEdit(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-soft">
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
                          {matings.length > 1 ? `${matings.length} montas` : 'Monta'}{matings[0] ? ` · ${fmtDate(parseDate(matings[0]))}` : ''}{matings.length > 1 ? ` → ${fmtDate(parseDate(matings[matings.length - 1]))}` : ''}
                        </span>
                      )}
                      {preg === 'suspected' && <span className="text-amber-600">· pendiente confirmar</span>}
                      {preg === 'confirmed' && <span className="text-pink-600">· preñez confirmada</span>}
                      {preg === 'failed' && <span>· no preñada</span>}
                      {c.notes && <span className="truncate">· {c.notes}</span>}
                    </div>
                  </div>
                  {c.resulted_in_litter_id ? (
                    <Link href={`/litters/${c.resulted_in_litter_id}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0 text-[12px] font-medium text-body hover:text-ink">Ver camada →</Link>
                  ) : (
                    <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-muted" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Camadas resultantes */}
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
                  {l.puppy_count != null && <span className="text-[11.5px] text-muted">· {l.puppy_count} cachorros</span>}
                </div>
                <Link href={`/litters/${l.id}`} className="text-[12px] font-medium text-body hover:text-ink">Ver →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11.5px] text-muted">
        💡 Para ver todas tus hembras en un calendario único, ve a{' '}
        <Link href="/reproduccion" className="text-ink underline">Calendario reproductivo</Link>.
      </p>

      <HeatCycleForm
        open={showForm}
        females={[{ id: dogId, name: dogName }]}
        defaultFemaleId={dogId}
        editCycle={editCycle}
        onClose={() => { setShowForm(false); setEditCycle(null) }}
        onSaved={() => { setShowForm(false); setEditCycle(null); load() }}
      />
    </div>
  )
}
