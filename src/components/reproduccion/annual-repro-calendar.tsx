'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Baby } from 'lucide-react'
import {
  parseDate, addDays, daysBetween, toISODate, todayLocal, avgHeatInterval, heatPhaseForDay,
  HEAT_DURATION_DAYS, GESTATION_DAYS,
  type HeatCycleLike, type LitterLike, type HeatPhase,
} from '@/lib/repro/cycle'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const PHASE_BG: Record<HeatPhase, string> = {
  proestro: 'bg-amber-200 text-amber-900',
  estro: 'bg-emerald-200 text-emerald-900',
  diestro: 'bg-violet-200 text-violet-900',
}

type DayMark = { className: string; isBirth?: boolean; isLitter?: boolean; title: string } | null

function weekdayIndex(d: Date): number { return (d.getDay() + 6) % 7 }

/**
 * Calendario anual de una hembra: 12 mini-meses con sus eventos reproductivos
 * (celo por fases, monta, gestación, parto previsto, camada nacida y celos
 * previstos). Sustituye al gantt de líneas, por hembra y legible.
 */
export default function AnnualReproCalendar({
  cycles,
  litters,
}: {
  cycles: HeatCycleLike[]
  litters: LitterLike[]
}) {
  const today = todayLocal()
  const [year, setYear] = useState(today.getFullYear())

  // Celos previstos (3 próximos) a partir del historial
  const forecasts = useMemo(() => {
    const starts = cycles.map((c) => parseDate(c.start_date)).sort((a, b) => a.getTime() - b.getTime())
    if (!starts.length) return [] as Date[]
    const avg = avgHeatInterval(starts)
    const out: Date[] = []
    const last = starts[starts.length - 1]
    for (let i = 1; i <= 4; i++) {
      const p = addDays(last, avg * i)
      if (p > today) out.push(p)
    }
    return out
  }, [cycles, today])

  // Clasifica un día concreto según los eventos de la hembra.
  const classifyDay = (date: Date): DayMark => {
    const iso = toISODate(date)

    // Camada nacida (prioridad alta)
    for (const l of litters) {
      if (l.status === 'born' && l.birth_date && toISODate(parseDate(l.birth_date)) === iso) {
        return { className: 'bg-emerald-500 text-white font-semibold', isLitter: true, title: 'Camada nacida' }
      }
    }

    for (const c of cycles) {
      const start = parseDate(c.start_date)
      const heatEnd = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS - 1)
      // Monta
      const matings = (c.mating_dates && c.mating_dates.length) ? c.mating_dates : [c.mating_date].filter(Boolean) as string[]
      if (matings.includes(iso)) {
        return { className: 'bg-rose-500 text-white font-semibold ring-2 ring-rose-300', title: 'Monta' }
      }
      // Gestación / parto previsto (si montada no fallida)
      if (c.was_mated && c.mating_date && (c.pregnancy_status ?? 'none') !== 'failed') {
        const matStart = parseDate(c.mating_date)
        const matEnd = c.mating_end_date ? parseDate(c.mating_end_date) : matStart
        const birth = addDays(matEnd, GESTATION_DAYS)
        if (toISODate(birth) === iso) return { className: 'bg-pink-500 text-white font-semibold', isBirth: true, title: 'Parto previsto' }
        if (date > heatEnd && date >= matStart && date < birth) {
          return { className: 'bg-pink-100 text-pink-800', title: c.pregnancy_status === 'confirmed' ? 'Gestación' : 'Gestación (sin confirmar)' }
        }
      }
      // Celo por fases
      if (date >= start && date <= heatEnd) {
        const phase = heatPhaseForDay(daysBetween(start, date))
        if (phase) return { className: PHASE_BG[phase], title: phase === 'estro' ? 'Estro · fértil' : phase === 'proestro' ? 'Proestro' : 'Diestro' }
      }
    }

    // Celo previsto
    for (const f of forecasts) {
      if (date >= f && date <= addDays(f, HEAT_DURATION_DAYS - 1)) {
        return { className: 'border border-dashed border-blue-400 bg-blue-50 text-blue-700', title: 'Celo previsto (estimado)' }
      }
    }
    return null
  }

  const hasAnyEvent = cycles.length > 0 || litters.length > 0

  return (
    <div>
      {/* Year nav */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">Año reproductivo</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setYear((y) => y - 1)} className="rounded-lg p-1.5 text-muted hover:bg-surface-card hover:text-ink"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[56px] text-center text-[14px] font-semibold tabular-nums text-ink">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="rounded-lg p-1.5 text-muted hover:bg-surface-card hover:text-ink"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {!hasAnyEvent && (
        <p className="mb-4 rounded-lg border border-dashed border-hairline bg-surface-soft px-4 py-3 text-[12.5px] text-muted">
          Aún no hay eventos. Registra un celo para ver el año reproductivo de la hembra.
        </p>
      )}

      {/* 12 mini-meses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MONTH_NAMES.map((mName, m) => {
          const first = new Date(year, m, 1, 12)
          const gridStart = addDays(first, -weekdayIndex(first))
          const daysInMonth = new Date(year, m + 1, 0).getDate()
          const last = new Date(year, m, daysInMonth, 12)
          const gridEnd = addDays(last, 6 - weekdayIndex(last))
          const n = daysBetween(gridStart, gridEnd) + 1
          return (
            <div key={m} className="rounded-xl border border-hairline bg-canvas p-3">
              <p className="mb-2 text-[12px] font-semibold text-ink">{mName}</p>
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAYS.map((w) => <div key={w} className="pb-0.5 text-center text-[9px] font-medium uppercase text-muted">{w}</div>)}
                {Array.from({ length: n }, (_, i) => {
                  const date = addDays(gridStart, i)
                  const inMonth = date.getMonth() === m
                  const mark = inMonth ? classifyDay(date) : null
                  const isToday = daysBetween(today, date) === 0
                  return (
                    <div
                      key={i}
                      title={mark?.title}
                      className={`relative flex aspect-square items-center justify-center rounded text-[10px] ${
                        !inMonth ? 'text-transparent'
                          : mark ? mark.className
                            : 'text-muted/50'
                      } ${isToday && inMonth ? 'ring-1 ring-ink' : ''}`}
                    >
                      {mark?.isBirth || mark?.isLitter ? <Baby className="h-2.5 w-2.5" /> : date.getDate()}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-300" /> Proestro</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" /> Estro · fértil</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-300" /> Diestro</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" /> Monta</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-300" /> Gestación</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-500" /> Parto previsto</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Camada</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-blue-400 bg-blue-50" /> Celo previsto</span>
      </div>
    </div>
  )
}
