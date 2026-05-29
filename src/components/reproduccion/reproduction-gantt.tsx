'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Plus, Filter, Heart, Baby, Sparkles, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import HeatCycleForm from './heat-cycle-form'
import ReproduccionTab from '@/components/dogs/edit-tabs/reproduccion-tab'
import { Portal } from '@/components/ui/portal'
import {
  HEAT_DURATION_DAYS, GESTATION_DAYS, DEFAULT_CYCLE_INTERVAL_DAYS,
  parseDate, addDays, daysBetween, avgHeatInterval, computeReproInfo,
  type HeatCycleLike, type LitterLike, type ReproState,
} from '@/lib/repro/cycle'

interface Female {
  id: string
  name: string
  slug: string | null
  thumbnail_url: string | null
  birth_date: string | null
}

interface Props {
  females: Female[]
  cycles: HeatCycleLike[]
  litters: LitterLike[]
  userId: string
}

type ZoomLevel = 3 | 6 | 12
type FilterMode = 'all' | ReproState

// Densidad horizontal CONSTANTE (px por día) → los meses siempre se leen,
// y el zoom solo cambia cuánto futuro se muestra (la línea de tiempo scrollea).
// Antes el eje metía 12 meses en ~180px y los rótulos se solapaban ("chuchurrío").
const PX_PER_DAY = 3.6      // ~110px por mes
const NAME_W = 140          // ancho de la columna de nombre (sticky)
const PAST_DAYS = 45        // días de pasado visibles

function fmtShort(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}
function fmtMonth(d: Date): string {
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
}

export default function ReproductionGantt({ females, cycles, litters, userId }: Props) {
  const [zoom, setZoom] = useState<ZoomLevel>(6)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [showForm, setShowForm] = useState(false)
  const [formFemaleId, setFormFemaleId] = useState<string>('')
  const [managing, setManaging] = useState<Female | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = useMemo(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0)
  }, [])

  const { rangeStart, rangeEnd, totalDays, timelineW } = useMemo(() => {
    const start = addDays(today, -PAST_DAYS)
    const end = addDays(today, zoom * 30 - PAST_DAYS)
    const days = daysBetween(start, end)
    return { rangeStart: start, rangeEnd: end, totalDays: days, timelineW: Math.round(days * PX_PER_DAY) }
  }, [today, zoom])

  // px desde el inicio del rango para una fecha
  const dateToX = (d: Date): number => Math.round(daysBetween(rangeStart, d) * PX_PER_DAY)

  // Auto-scroll para dejar "hoy" a la vista al cargar / cambiar zoom
  useEffect(() => {
    if (scrollRef.current) {
      const x = dateToX(today)
      scrollRef.current.scrollLeft = Math.max(0, x - 80)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom])

  const monthMarkers = useMemo(() => {
    const markers: { label: string; x: number }[] = []
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1, 12, 0, 0)
    while (cursor <= rangeEnd) {
      markers.push({ label: fmtMonth(cursor), x: dateToX(new Date(cursor)) })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return markers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, timelineW])

  // Forecast: hasta 3 celos futuros por hembra
  const forecastCycles = useMemo(() => {
    const out: { dog_id: string; start: Date }[] = []
    for (const female of females) {
      const starts = cycles
        .filter((c) => c.dog_id === female.id)
        .map((c) => parseDate(c.start_date))
        .sort((a, b) => a.getTime() - b.getTime())
      if (starts.length === 0) continue
      const avg = avgHeatInterval(starts)
      const last = starts[starts.length - 1]
      for (let i = 1; i <= 3; i++) {
        const projected = addDays(last, avg * i)
        if (projected > today && projected <= rangeEnd) out.push({ dog_id: female.id, start: projected })
      }
    }
    return out
  }, [females, cycles, today, rangeEnd])

  // Estado de cada hembra (lib compartida)
  const statusMap = useMemo(() => {
    const m = new Map<string, ReproState>()
    for (const f of females) m.set(f.id, computeReproInfo(f.id, cycles, litters, today).state)
    return m
  }, [females, cycles, litters, today])

  const visibleFemales = useMemo(
    () => (filter === 'all' ? females : females.filter((f) => statusMap.get(f.id) === filter)),
    [females, filter, statusMap],
  )

  const counts = useMemo(() => {
    const vals = Array.from(statusMap.values())
    return {
      in_heat: vals.filter((s) => s === 'in_heat').length,
      mated_pending: vals.filter((s) => s === 'mated_pending').length,
      pregnant: vals.filter((s) => s === 'pregnant').length,
    }
  }, [statusMap])

  const FILTERS: { key: FilterMode; label: string; n?: number }[] = [
    { key: 'all', label: 'Todas', n: females.length },
    { key: 'in_heat', label: 'En celo', n: counts.in_heat },
    { key: 'mated_pending', label: 'Montadas', n: counts.mated_pending },
    { key: 'pregnant', label: 'Gestantes', n: counts.pregnant },
  ]

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-canvas px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="h-3.5 w-3.5 flex-shrink-0 text-muted" />
          <div className="flex gap-1 rounded-lg bg-surface-soft p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
                  filter === f.key ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {f.label} <span className="ml-0.5 tabular-nums opacity-60">{f.n}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-surface-soft p-0.5">
            {([3, 6, 12] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
                  zoom === z ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {z}M
              </button>
            ))}
          </div>
          <button
            onClick={() => { setFormFemaleId(''); setShowForm(true) }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Registrar celo</span><span className="sm:hidden">Celo</span>
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-blue-500" /> Celo</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded border border-dashed border-blue-500 bg-blue-500/20" /> Celo previsto</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded border border-dashed border-amber-500 bg-amber-400/30" /> Montada (sin confirmar)</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-pink-500" /> Gestación</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-emerald-500" /> Camada nacida</span>
      </div>

      {/* Gantt — scroll horizontal con columna de nombre sticky */}
      <div ref={scrollRef} className="overflow-x-auto rounded-xl border border-hairline bg-canvas">
        <div style={{ width: NAME_W + timelineW, minWidth: '100%' }}>
          {/* Header eje X */}
          <div className="flex border-b border-hairline">
            <div
              className="sticky left-0 z-20 flex-shrink-0 border-r border-hairline bg-surface-soft px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted"
              style={{ width: NAME_W }}
            >
              Hembra
            </div>
            <div className="relative flex-shrink-0 bg-surface-soft" style={{ width: timelineW, height: 36 }}>
              {monthMarkers.map((m, i) => (
                <div key={i} className="absolute top-0 h-full border-l border-hairline-soft pl-1.5 pt-2 text-[10.5px] text-muted" style={{ left: m.x }}>
                  {m.label}
                </div>
              ))}
              <div className="absolute top-0 z-10 h-full w-px bg-ink" style={{ left: dateToX(today) }}>
                <span className="absolute left-1 top-0 rounded-br bg-ink px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-on-primary">Hoy</span>
              </div>
            </div>
          </div>

          {/* Filas por hembra */}
          {visibleFemales.length === 0 ? (
            <div className="px-6 py-16 text-center text-[13.5px] text-muted">No hay hembras que coincidan con el filtro.</div>
          ) : (
            <ul className="divide-y divide-hairline-soft">
              {visibleFemales.map((female) => {
                const info = computeReproInfo(female.id, cycles, litters, today)
                const statusColor =
                  info.state === 'in_heat' ? 'text-blue-600'
                    : info.state === 'mated_pending' ? 'text-amber-600'
                      : info.state === 'pregnant' ? 'text-pink-600'
                        : 'text-muted'

                const myCycles = cycles.filter((c) => c.dog_id === female.id)
                const myForecast = forecastCycles.filter((c) => c.dog_id === female.id)
                const myLitters = litters.filter((l) => l.mother_id === female.id)
                // Gestaciones desde la monta (modelo nuevo): celos montados no fallidos
                const matedCycles = myCycles.filter(
                  (c) => c.was_mated && c.mating_date && (c.pregnancy_status ?? 'none') !== 'failed',
                )

                return (
                  <li key={female.id} className="flex hover:bg-surface-soft/50">
                    {/* Columna nombre (sticky) */}
                    <div className="sticky left-0 z-10 flex flex-shrink-0 items-center gap-2 border-r border-hairline bg-canvas px-3 py-3" style={{ width: NAME_W }}>
                      {female.thumbnail_url ? (
                        <img src={female.thumbnail_url} alt={female.name} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-pink-100">
                          <Heart className="h-3.5 w-3.5 text-pink-500" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setManaging(female)}
                        className="group/name min-w-0 flex-1 text-left"
                        title="Gestionar celo, monta y preñez"
                      >
                        <span className="flex items-center gap-0.5 truncate text-[13px] font-medium text-ink">
                          <span className="truncate group-hover/name:underline">{female.name}</span>
                          <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted" />
                        </span>
                        <span className={`block truncate text-[10.5px] ${statusColor}`}>{info.stateLabel}</span>
                      </button>
                    </div>

                    {/* Timeline */}
                    <div className="relative flex-shrink-0" style={{ width: timelineW, height: 64 }}>
                      <div className="absolute top-0 h-full w-px bg-ink/25" style={{ left: dateToX(today) }} />

                      {/* Celos reales */}
                      {myCycles.map((c) => {
                        const start = parseDate(c.start_date)
                        const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
                        if (end < rangeStart || start > rangeEnd) return null
                        const x = dateToX(start)
                        const w = Math.max(dateToX(end) - x, 5)
                        return (
                          <div key={c.id} className="absolute top-2 h-3 rounded bg-blue-500" style={{ left: x, width: w }}
                            title={`Celo: ${fmtShort(start)} → ${fmtShort(end)}${c.was_mated ? ' (con monta)' : ''}`} />
                        )
                      })}

                      {/* Celos previstos */}
                      {myForecast.map((c, i) => {
                        const end = addDays(c.start, HEAT_DURATION_DAYS)
                        if (end < rangeStart || c.start > rangeEnd) return null
                        const x = dateToX(c.start)
                        const w = Math.max(dateToX(end) - x, 5)
                        return (
                          <div key={`fc-${i}`} className="absolute top-2 h-3 rounded border border-dashed border-blue-500 bg-blue-500/20" style={{ left: x, width: w }}
                            title={`Celo previsto: ${fmtShort(c.start)} (estimado)`} />
                        )
                      })}

                      {/* Gestaciones (desde la monta → ventana de parto) */}
                      {matedCycles.map((c) => {
                        const start = parseDate(c.mating_date!)
                        // Fin = última monta + 63 si hay rango; si no, primera + 63.
                        const end = addDays(parseDate(c.mating_end_date || c.mating_date!), GESTATION_DAYS)
                        if (end < rangeStart || start > rangeEnd) return null
                        const x = dateToX(start)
                        const w = Math.max(dateToX(end) - x, 5)
                        const confirmed = c.pregnancy_status === 'confirmed'
                        return (
                          <div
                            key={`g-${c.id}`}
                            className={`absolute top-7 h-3 rounded ${confirmed ? 'bg-pink-500' : 'border border-dashed border-amber-500 bg-amber-400/30'}`}
                            style={{ left: x, width: w }}
                            title={`${confirmed ? 'Gestación' : 'Montada (sin confirmar)'}: monta ${fmtShort(start)} → parto previsto ${fmtShort(end)}`}
                          />
                        )
                      })}

                      {/* Camadas nacidas */}
                      {myLitters.filter((l) => l.status === 'born' && l.birth_date).map((l) => {
                        const date = parseDate(l.birth_date!)
                        if (date < rangeStart || date > rangeEnd) return null
                        return (
                          <Link key={l.id} href={`/litters/${l.id}`}
                            className="absolute top-7 flex h-3 items-center justify-center rounded bg-emerald-500 px-1.5 transition-opacity hover:opacity-80"
                            style={{ left: dateToX(date) - 8 }}
                            title={`Camada nacida ${fmtShort(date)}${l.puppy_count ? ` (${l.puppy_count} cachorros)` : ''}`}>
                            <Baby className="h-2.5 w-2.5 text-white" />
                          </Link>
                        )
                      })}

                      {myLitters.filter((l) => l.status === 'planned').length > 0 && (
                        <div className="absolute right-2 top-1.5 inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                          <Sparkles className="h-2.5 w-2.5" /> Planificada
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {forecastCycles.length === 0 && cycles.length === 0 && (
        <div className="rounded-lg border border-dashed border-hairline bg-surface-soft px-4 py-3 text-[12.5px] text-muted">
          💡 Registra los celos pasados de tus hembras para que el calendario pueda predecir los próximos automáticamente.
        </div>
      )}

      <HeatCycleForm
        open={showForm}
        females={females}
        defaultFemaleId={formFemaleId}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); window.location.reload() }}
      />

      {/* Panel de gestión de una hembra — reutiliza la pestaña Reproducción
          (estado, confirmar/descartar preñez, registrar celo+monta, historial).
          Aquí es donde la criadora confirma el embarazo, sin tener que ir a la
          ficha del perro. Slide-from-right, mismo patrón que el resto. */}
      <Portal>
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${managing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => { setManaging(null); window.location.reload() }}
          />
          <div
            className={`fixed top-0 right-0 h-full w-full sm:max-w-xl z-[70] bg-white border-l border-hairline shadow-[-12px_0_32px_rgba(0,0,0,0.12)] transition-transform duration-300 flex flex-col overflow-x-hidden ${managing ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
            style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'var(--safe-area-bottom)' }}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-hairline flex-shrink-0">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Reproducción</p>
                <h2 className="truncate text-base sm:text-lg font-semibold">{managing?.name}</h2>
              </div>
              <button
                onClick={() => { setManaging(null); window.location.reload() }}
                className="text-muted hover:text-ink transition p-1 flex-shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
              {managing && <ReproduccionTab dogId={managing.id} userId={userId} />}
            </div>
          </div>
        </>
      </Portal>
    </>
  )
}
