'use client'

import { useMemo, useState } from 'react'
import { Plus, ZoomIn, ZoomOut, Filter, Heart, Baby, Sparkles } from 'lucide-react'
import Link from 'next/link'
import HeatCycleForm from './heat-cycle-form'

interface Female {
  id: string
  name: string
  slug: string | null
  thumbnail_url: string | null
  birth_date: string | null
}

interface HeatCycle {
  id: string
  dog_id: string
  start_date: string
  end_date: string | null
  was_mated: boolean
  resulted_in_litter_id: string | null
  notes: string | null
}

interface Litter {
  id: string
  status: string // 'planned' | 'mated' | 'born'
  mating_date: string | null
  birth_date: string | null
  mother_id: string | null
  puppy_count: number | null
}

interface Props {
  females: Female[]
  cycles: HeatCycle[]
  litters: Litter[]
}

type ZoomLevel = 3 | 6 | 12
type FilterMode = 'all' | 'in_heat' | 'pregnant'

const HEAT_DURATION_DAYS = 21 // duración media estimada de un celo
const GESTATION_DAYS = 63 // duración estándar de gestación canina
const DEFAULT_CYCLE_INTERVAL_DAYS = 180 // intervalo entre celos (típico 5-7 meses)

// Convierte fecha YYYY-MM-DD a Date al mediodía local (evita problemas TZ)
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
}

export default function ReproductionGantt({ females, cycles, litters }: Props) {
  const [zoom, setZoom] = useState<ZoomLevel>(12)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [showForm, setShowForm] = useState(false)
  const [formFemaleId, setFormFemaleId] = useState<string>('')

  // Hoy a mediodía local
  const today = useMemo(() => {
    const t = new Date()
    return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0)
  }, [])

  // Rango visible: 2 meses pasado + (zoom-2) futuro
  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    const start = addDays(today, -60)
    const end = addDays(today, zoom * 30 - 60)
    return {
      rangeStart: start,
      rangeEnd: end,
      totalDays: daysBetween(start, end),
    }
  }, [today, zoom])

  // Calcular % horizontal para una fecha
  const dateToPct = (d: Date): number => {
    const days = daysBetween(rangeStart, d)
    return Math.max(0, Math.min(100, (days / totalDays) * 100))
  }

  // Construir marcadores de meses (eje X)
  const monthMarkers = useMemo(() => {
    const markers: { date: Date; label: string; pct: number }[] = []
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1, 12, 0, 0)
    while (cursor <= rangeEnd) {
      markers.push({
        date: new Date(cursor),
        label: fmtMonth(cursor),
        pct: dateToPct(cursor),
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return markers
  }, [rangeStart, rangeEnd])

  // Forecast: predice próximos celos por hembra basado en historial
  const forecastCycles = useMemo(() => {
    const forecast: { dog_id: string; start_date: string; isForecast: true }[] = []
    for (const female of females) {
      const femaleCycles = cycles
        .filter((c) => c.dog_id === female.id)
        .map((c) => parseDate(c.start_date))
        .sort((a, b) => a.getTime() - b.getTime())

      if (femaleCycles.length === 0) continue

      // Calcular intervalo medio personal o usar default
      let avgInterval = DEFAULT_CYCLE_INTERVAL_DAYS
      if (femaleCycles.length >= 2) {
        const intervals: number[] = []
        for (let i = 1; i < femaleCycles.length; i++) {
          intervals.push(daysBetween(femaleCycles[i - 1], femaleCycles[i]))
        }
        avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      }

      // Proyectar 3 ciclos futuros desde el último conocido
      const lastCycle = femaleCycles[femaleCycles.length - 1]
      for (let i = 1; i <= 3; i++) {
        const projected = addDays(lastCycle, avgInterval * i)
        if (projected > today && projected <= rangeEnd) {
          forecast.push({
            dog_id: female.id,
            start_date: projected.toISOString().split('T')[0],
            isForecast: true,
          })
        }
      }
    }
    return forecast
  }, [females, cycles, today, rangeEnd])

  // Determinar estado actual de cada hembra
  const femaleStatus = useMemo(() => {
    const status = new Map<string, 'in_heat' | 'pregnant' | 'idle'>()
    for (const female of females) {
      // ¿Hay celo activo hoy?
      const activeHeat = cycles.find((c) => {
        if (c.dog_id !== female.id) return false
        const start = parseDate(c.start_date)
        const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
        return today >= start && today <= end
      })
      if (activeHeat) {
        status.set(female.id, 'in_heat')
        continue
      }
      // ¿Hay gestación activa?
      const activePregnancy = litters.find((l) => {
        if (l.mother_id !== female.id) return false
        if (l.status !== 'mated' || !l.mating_date) return false
        const mating = parseDate(l.mating_date)
        const birthExpected = addDays(mating, GESTATION_DAYS)
        return today >= mating && today <= birthExpected
      })
      if (activePregnancy) {
        status.set(female.id, 'pregnant')
        continue
      }
      status.set(female.id, 'idle')
    }
    return status
  }, [females, cycles, litters, today])

  // Filtrar hembras según filtro activo
  const visibleFemales = useMemo(() => {
    if (filter === 'all') return females
    return females.filter((f) => femaleStatus.get(f.id) === filter)
  }, [females, filter, femaleStatus])

  const inHeatCount = Array.from(femaleStatus.values()).filter((s) => s === 'in_heat').length
  const pregnantCount = Array.from(femaleStatus.values()).filter((s) => s === 'pregnant').length

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3">
        {/* Filtros */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted" />
          <div className="flex gap-1 rounded-lg bg-surface-soft p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors ${
                filter === 'all' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Todas <span className="ml-1 tabular-nums opacity-60">{females.length}</span>
            </button>
            <button
              onClick={() => setFilter('in_heat')}
              className={`rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors ${
                filter === 'in_heat' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              En celo <span className="ml-1 tabular-nums opacity-60">{inHeatCount}</span>
            </button>
            <button
              onClick={() => setFilter('pregnant')}
              className={`rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors ${
                filter === 'pregnant' ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Gestantes <span className="ml-1 tabular-nums opacity-60">{pregnantCount}</span>
            </button>
          </div>
        </div>

        {/* Zoom + Add */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-surface-soft p-0.5">
            {([3, 6, 12] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors ${
                  zoom === z ? 'bg-canvas text-ink shadow-sm' : 'text-muted hover:text-ink'
                }`}
              >
                {z}M
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setFormFemaleId('')
              setShowForm(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-colors hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> Registrar celo
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded bg-blue-500" /> Celo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded border border-dashed border-blue-500 bg-blue-500/20" /> Celo previsto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded bg-pink-500" /> Gestación
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded bg-emerald-500" /> Camada nacida
        </span>
      </div>

      {/* Gantt */}
      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
        {/* Header: eje X con meses */}
        <div className="flex border-b border-hairline">
          <div className="w-48 flex-shrink-0 border-r border-hairline bg-surface-soft px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted">
            Hembra
          </div>
          <div className="relative flex-1 overflow-hidden bg-surface-soft" style={{ minWidth: 0 }}>
            <div className="relative h-9">
              {monthMarkers.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-hairline-soft px-1 pt-2 text-[10.5px] text-muted"
                  style={{ left: `${m.pct}%` }}
                >
                  {m.label}
                </div>
              ))}
              {/* Línea de hoy */}
              <div
                className="absolute top-0 h-full w-px bg-ink"
                style={{ left: `${dateToPct(today)}%` }}
              >
                <span className="absolute -top-0 left-1 rounded-br bg-ink px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-on-primary">
                  Hoy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filas: una por hembra */}
        {visibleFemales.length === 0 ? (
          <div className="px-6 py-16 text-center text-[13.5px] text-muted">
            No hay hembras que coincidan con el filtro.
          </div>
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {visibleFemales.map((female) => {
              const status = femaleStatus.get(female.id) || 'idle'
              const statusLabel =
                status === 'in_heat' ? 'En celo' : status === 'pregnant' ? 'Gestante' : 'En reposo'
              const statusColor =
                status === 'in_heat'
                  ? 'text-blue-600'
                  : status === 'pregnant'
                    ? 'text-pink-600'
                    : 'text-muted'

              // Heat cycles reales de esta hembra
              const myCycles = cycles.filter((c) => c.dog_id === female.id)
              // Forecast cycles
              const myForecast = forecastCycles.filter((c) => c.dog_id === female.id)
              // Litters de esta hembra
              const myLitters = litters.filter((l) => l.mother_id === female.id)

              return (
                <li key={female.id} className="flex items-center hover:bg-surface-soft/50">
                  {/* Hembra label */}
                  <div className="flex w-48 flex-shrink-0 items-center gap-2.5 border-r border-hairline px-4 py-3">
                    {female.thumbnail_url ? (
                      <img
                        src={female.thumbnail_url}
                        alt={female.name}
                        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-pink-100">
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dogs/${female.slug || female.id}`}
                        className="block truncate text-[13.5px] font-medium text-ink hover:underline"
                      >
                        {female.name}
                      </Link>
                      <p className={`truncate text-[11px] ${statusColor}`}>{statusLabel}</p>
                    </div>
                  </div>

                  {/* Gantt row */}
                  <div className="relative h-16 flex-1 overflow-hidden" style={{ minWidth: 0 }}>
                    {/* Línea vertical de hoy */}
                    <div
                      className="absolute top-0 h-full w-px bg-ink/30"
                      style={{ left: `${dateToPct(today)}%` }}
                    />

                    {/* Barras de celos reales */}
                    {myCycles.map((c) => {
                      const start = parseDate(c.start_date)
                      const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
                      if (end < rangeStart || start > rangeEnd) return null
                      const leftPct = dateToPct(start)
                      const widthPct = dateToPct(end) - leftPct
                      return (
                        <div
                          key={c.id}
                          className="absolute top-2 h-3 rounded bg-blue-500"
                          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%` }}
                          title={`Celo: ${fmtDate(start)} → ${fmtDate(end)}${c.was_mated ? ' (cruzada)' : ''}`}
                        />
                      )
                    })}

                    {/* Barras de celos previstos (forecast) */}
                    {myForecast.map((c, i) => {
                      const start = parseDate(c.start_date)
                      const end = addDays(start, HEAT_DURATION_DAYS)
                      if (end < rangeStart || start > rangeEnd) return null
                      const leftPct = dateToPct(start)
                      const widthPct = dateToPct(end) - leftPct
                      return (
                        <div
                          key={`fc-${i}`}
                          className="absolute top-2 h-3 rounded border border-dashed border-blue-500 bg-blue-500/20"
                          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%` }}
                          title={`Celo previsto: ${fmtDate(start)} (estimado)`}
                        />
                      )
                    })}

                    {/* Barras de gestaciones (litters status='mated') */}
                    {myLitters
                      .filter((l) => l.status === 'mated' && l.mating_date)
                      .map((l) => {
                        const start = parseDate(l.mating_date!)
                        const end = l.birth_date ? parseDate(l.birth_date) : addDays(start, GESTATION_DAYS)
                        if (end < rangeStart || start > rangeEnd) return null
                        const leftPct = dateToPct(start)
                        const widthPct = dateToPct(end) - leftPct
                        return (
                          <Link
                            key={l.id}
                            href={`/litters/${l.id}`}
                            className="absolute top-7 h-3 rounded bg-pink-500 transition-opacity hover:opacity-80"
                            style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%` }}
                            title={`Gestación: cruce ${fmtDate(start)} → parto previsto ${fmtDate(end)}`}
                          />
                        )
                      })}

                    {/* Marcadores de camadas nacidas */}
                    {myLitters
                      .filter((l) => l.status === 'born' && l.birth_date)
                      .map((l) => {
                        const date = parseDate(l.birth_date!)
                        if (date < rangeStart || date > rangeEnd) return null
                        const leftPct = dateToPct(date)
                        return (
                          <Link
                            key={l.id}
                            href={`/litters/${l.id}`}
                            className="absolute top-7 flex h-3 items-center justify-center rounded bg-emerald-500 px-1.5 transition-opacity hover:opacity-80"
                            style={{ left: `calc(${leftPct}% - 10px)` }}
                            title={`Camada nacida ${fmtDate(date)}${l.puppy_count ? ` (${l.puppy_count} cachorros)` : ''}`}
                          >
                            <Baby className="h-2.5 w-2.5 text-white" />
                          </Link>
                        )
                      })}

                    {/* Planned litters (sin date pero status planned) */}
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

      {/* Hint forecast */}
      {forecastCycles.length === 0 && cycles.length === 0 && (
        <div className="rounded-lg border border-dashed border-hairline bg-surface-soft px-4 py-3 text-[12.5px] text-muted">
          💡 Registra los celos pasados de tus hembras para que el calendario pueda predecir los próximos automáticamente.
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <HeatCycleForm
          females={females}
          defaultFemaleId={formFemaleId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            window.location.reload() // reload server data
          }}
        />
      )}
    </>
  )
}
