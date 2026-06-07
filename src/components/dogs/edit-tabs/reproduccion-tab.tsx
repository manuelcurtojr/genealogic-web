'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Heart, Baby, CheckCircle2, XCircle, Pencil, CalendarHeart, CalendarClock, Sparkles, Moon } from 'lucide-react'
import Link from 'next/link'
import HeatCycleForm from '@/components/reproduccion/heat-cycle-form'
import HeatCycleCalendar from '@/components/reproduccion/heat-cycle-calendar'
import {
  computeReproInfo, parseDate, addDays, fmtDate, daysBetween, todayLocal, birthWindowText,
  HEAT_DURATION_DAYS, CONFIRM_PREGNANCY_DAYS,
  type HeatCycleLike, type LitterLike, type ReproState,
} from '@/lib/repro/cycle'
import { useT } from '@/components/i18n/locale-provider'

interface Props {
  dogId: string
  userId: string
}

// Config visual del estado reproductivo, alineada con el lenguaje de Salud
// (tile de icono + color semántico). El brand naranja se reserva para acentos
// neutros; cada estado conserva su color semántico con significado.
const STATE_CONFIG: Record<ReproState, { color: string; icon: any }> = {
  in_heat: { color: '#017DFA', icon: Heart },        // azul — en celo
  mated_pending: { color: '#f59e0b', icon: Heart },  // ámbar — pendiente confirmar
  pregnant: { color: '#e84393', icon: Baby },        // rosa — gestante
  idle: { color: '#6b7280', icon: Moon },            // neutro — en reposo
}

/**
 * Tab "Reproducción" del edit panel de perro — solo aplica a hembras.
 * Estado reproductivo, predicción del próximo celo, confirmación de preñez y
 * camadas. El alta/edición de celos usa el mismo panel HeatCycleForm que el
 * gantt (con lista dinámica de montas). La lógica vive en @/lib/repro/cycle.
 */
export default function ReproduccionTab({ dogId, userId }: Props) {
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<HeatCycleLike[]>([])
  const [litters, setLitters] = useState<LitterLike[]>([])
  const [dogName, setDogName] = useState<string>(t('Esta hembra'))
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
      setError(err.message || t('Error cargando datos'))
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

  const stateConf = STATE_CONFIG[info.state]
  const StateIcon = stateConf.icon

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted"><Loader2 className="h-5 w-5 animate-spin" /></div>
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-600">{error}</div>
      )}

      {/* ── Estado reproductivo: estado actual + próximo celo ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <CalendarHeart className="h-3.5 w-3.5" /> {t('Estado reproductivo')}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* Estado actual */}
          <div className="rounded-2xl border border-hairline bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Estado actual')}</p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: stateConf.color + '1a' }}>
                <StateIcon className="h-4.5 w-4.5" style={{ color: stateConf.color }} />
              </span>
              <p className="text-[15px] font-semibold leading-tight" style={{ color: stateConf.color }}>{info.stateLabel}</p>
            </div>
            {info.expectedBirth && (
              <p className="mt-2.5 text-[12px] text-muted">
                {t('Parto previsto:')} <strong className="text-ink">{birthWindowText(info)}</strong>
                {(() => { const d = daysBetween(today, info.expectedBirth!); return d >= 0 ? ` · ${t('en')} ${d} ${d === 1 ? t('día') : t('días')}` : ` · ${-d} ${(-d) === 1 ? t('día') : t('días')} ${t('atrás')}` })()}
              </p>
            )}
          </div>
          {/* Próximo celo previsto */}
          <div className="rounded-2xl border border-hairline bg-canvas p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Próximo celo previsto')}</p>
            {info.nextHeatForecast ? (
              <>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-card">
                    <CalendarClock className="h-4.5 w-4.5 text-muted" />
                  </span>
                  <p className="text-[15px] font-semibold leading-tight text-ink">{fmtDate(info.nextHeatForecast)}</p>
                </div>
                <p className="mt-2.5 text-[12px] text-muted">{t('Intervalo medio')}: <strong className="text-ink tabular-nums">{info.avgIntervalDays} {t('días')}</strong></p>
              </>
            ) : (
              <div className="mt-2 flex items-center gap-2.5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-card">
                  <CalendarClock className="h-4.5 w-4.5 text-muted" />
                </span>
                <p className="text-[12.5px] leading-snug text-muted">{t('Registra al menos 2 celos para calcular predicción.')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Calendario detallado del celo más reciente (fases proestro/estro/diestro) */}
        {cycles.length > 0 && (
          <HeatCycleCalendar
            startDate={cycles[0].start_date}
            endDate={cycles[0].end_date}
            matingDates={(cycles[0].mating_dates && cycles[0].mating_dates.length)
              ? cycles[0].mating_dates
              : ([cycles[0].mating_date, cycles[0].mating_end_date].filter(Boolean) as string[])}
            dogName={dogName}
          />
        )}
      </div>

      {/* ── Montada · pendiente de confirmar (acción destacada) ── */}
      {info.state === 'mated_pending' && info.drivingCycle && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <Heart className="h-3.5 w-3.5 text-amber-600" />
            </span>
            <p className="text-[13.5px] font-semibold text-amber-900">{t('Montada · pendiente de confirmar preñez')}</p>
          </div>
          <p className="text-[12px] leading-relaxed text-amber-800">
            {t('Monta:')} <strong>{info.matingDate ? fmtDate(info.matingDate) : '—'}</strong>
            {info.matingEndDate && info.matingEndDate.getTime() !== info.matingDate?.getTime() && <> → {fmtDate(info.matingEndDate)}</>}
            {' · '}{t('Parto previsto:')} <strong>{birthWindowText(info)}</strong>.{' '}
            <button onClick={() => openEdit(info.drivingCycle!)} className="font-medium underline underline-offset-2">{t('Editar fechas de monta')}</button>
          </p>
          <p className="text-[12px] leading-relaxed text-amber-800">
            {info.confirmDueDate && daysBetween(today, info.confirmDueDate) > 0
              ? `${t('Podrás confirmar por ecografía hacia el')} ${fmtDate(info.confirmDueDate)} (${t('día')} ${CONFIRM_PREGNANCY_DAYS} ${t('desde la monta).')}`
              : `${t('Ya puedes confirmar (ecografía a partir del día')} ${CONFIRM_PREGNANCY_DAYS}). ${t('¿Quedó preñada?')}`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPregnancyStatus(info.drivingCycle!.id, 'confirmed')} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {t('Sí, está preñada')}
            </button>
            <button onClick={() => setPregnancyStatus(info.drivingCycle!.id, 'failed')} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3.5 py-2 text-[12.5px] font-medium text-body transition hover:text-ink disabled:opacity-50">
              <XCircle className="h-3.5 w-3.5" /> {t('No quedó preñada')}
            </button>
          </div>
        </div>
      )}

      {/* ── Historial de celos (timeline) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Heart className="h-3.5 w-3.5" /> {t('Historial de celos')}{cycles.length > 0 ? ` (${cycles.length})` : ''}
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-on-primary transition hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> {t('Registrar celo')}
          </button>
        </div>

        {cycles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline bg-surface-soft/40 px-5 py-9 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-card">
              <Heart className="h-6 w-6 text-muted" />
            </span>
            <p className="text-[14.5px] font-semibold text-ink">{t('Aún no hay celos registrados.')}</p>
            <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-snug text-muted">{t('Empieza registrando el más reciente para activar la predicción.')}</p>
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90">
              <Plus className="h-4 w-4" /> {t('Registrar celo')}
            </button>
          </div>
        ) : (
          /* Línea de tiempo vertical (mismo patrón que la cartilla de Salud) */
          <div className="relative space-y-2.5 pl-5 before:absolute before:left-[7px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-hairline">
            {cycles.map((c) => {
              const start = parseDate(c.start_date)
              const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
              const preg = c.pregnancy_status ?? 'none'
              const matings = (c.mating_dates && c.mating_dates.length) ? c.mating_dates : [c.mating_date, c.mating_end_date].filter(Boolean) as string[]
              // Color del nodo + chip según el resultado del celo.
              const dot = preg === 'confirmed' ? '#e84393' : preg === 'suspected' ? '#f59e0b' : c.was_mated ? '#017DFA' : '#9ca3af'
              return (
                <div key={c.id} className="group relative">
                  <span className="absolute -left-5 top-3.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-canvas" style={{ backgroundColor: dot }} />
                  <button onClick={() => openEdit(c)} className="block w-full rounded-2xl border border-hairline bg-canvas p-3.5 text-left transition hover:border-ink/20">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: dot + '1a' }}>
                        <Heart className="h-4.5 w-4.5" style={{ color: dot }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-[14px] font-medium leading-tight text-ink">
                            {fmtDate(start)} → {fmtDate(end)}
                          </p>
                          {!c.end_date && <span className="text-[11px] text-muted">{t('(estimado)')}</span>}
                          {/* Chip de resultado */}
                          {preg === 'confirmed' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-1.5 py-0.5 text-[10px] font-semibold text-pink-600"><Baby className="h-2.5 w-2.5" /> {t('preñez confirmada')}</span>
                          )}
                          {preg === 'suspected' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"><CalendarClock className="h-2.5 w-2.5" /> {t('pendiente confirmar')}</span>
                          )}
                          {preg === 'failed' && (
                            <span className="rounded-full bg-surface-card px-1.5 py-0.5 text-[10px] font-medium text-muted">{t('no preñada')}</span>
                          )}
                        </div>
                        {c.was_mated && (
                          <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-pink-600">
                            <Heart className="h-3 w-3" />
                            {matings.length > 1 ? `${matings.length} ${t('montas')}` : t('Monta')}{matings[0] ? ` · ${fmtDate(parseDate(matings[0]))}` : ''}{matings.length > 1 ? ` → ${fmtDate(parseDate(matings[matings.length - 1]))}` : ''}
                          </p>
                        )}
                        {c.notes && <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-body">{c.notes}</p>}
                      </div>
                      {/* Acción a la derecha: ver camada o editar */}
                      <div className="flex-shrink-0 self-center">
                        {c.resulted_in_litter_id ? (
                          <Link href={`/litters/${c.resulted_in_litter_id}`} onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-lg bg-surface-card px-2.5 py-1.5 text-[12px] font-medium text-body transition hover:text-ink">
                            {t('Ver camada →')}
                          </Link>
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition group-hover:bg-surface-card group-hover:text-ink">
                            <Pencil className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Camadas como madre ── */}
      {litters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Baby className="h-3.5 w-3.5" /> {t('Camadas como madre')} ({litters.length})
          </div>
          <div className="space-y-1.5">
            {litters.slice(0, 5).map((l) => {
              const tone = l.status === 'born' ? '#e84393' : l.status === 'mated' ? '#f59e0b' : '#6b7280'
              return (
                <div key={l.id} className="flex items-center gap-2.5 rounded-xl border border-hairline bg-canvas p-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tone + '1a' }}>
                    <Baby className="h-4 w-4" style={{ color: tone }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">
                      {l.status === 'born' && l.birth_date
                        ? `${t('Nacida')} ${fmtDate(parseDate(l.birth_date))}`
                        : l.status === 'mated' && l.mating_date
                          ? `${t('Gestación desde')} ${fmtDate(parseDate(l.mating_date))}`
                          : t('Planificada')}
                    </p>
                    {l.puppy_count != null && <p className="text-[11.5px] text-muted">{l.puppy_count} {t('cachorros')}</p>}
                  </div>
                  <Link href={`/litters/${l.id}`} className="flex-shrink-0 rounded-lg bg-surface-card px-2.5 py-1.5 text-[12px] font-medium text-body transition hover:text-ink">{t('Ver →')}</Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pista al calendario global ── */}
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-hairline bg-surface-soft/40 px-3.5 py-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted" />
        <p className="text-[11.5px] leading-snug text-muted">
          {t('Para ver todas tus hembras en un calendario único, ve a')}{' '}
          <Link href="/reproduccion" className="font-medium text-ink underline underline-offset-2">{t('Calendario reproductivo')}</Link>.
        </p>
      </div>

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
