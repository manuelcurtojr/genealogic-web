'use client'

import { Heart } from 'lucide-react'
import {
  parseDate, addDays, daysBetween, todayLocal, toISODate,
  heatPhaseForDay, HEAT_PHASE_META, PROESTRO_DAYS, ESTRO_DAYS, OVULATION_DAY, HEAT_DURATION_DAYS,
  type HeatPhase,
} from '@/lib/repro/cycle'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const PHASE_CELL: Record<HeatPhase, string> = {
  proestro: 'bg-amber-100 text-amber-800',
  estro: 'bg-emerald-100 text-emerald-800',
  diestro: 'bg-violet-100 text-violet-800',
}
const PHASE_DOT: Record<HeatPhase, string> = {
  proestro: 'bg-amber-400',
  estro: 'bg-emerald-500',
  diestro: 'bg-violet-400',
}

/** Lunes-primero: índice 0=L … 6=D */
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

/**
 * Mini-calendario del ciclo de celo de una hembra. Pinta el periodo (~21 días
 * desde el inicio) por fases: Proestro (preparación), Estro (fértil, ventana
 * de monta) y Diestro. Marca el día de ovulación estimado y los días de monta.
 */
export default function HeatCycleCalendar({
  startDate,
  endDate,
  matingDates,
  dogName,
}: {
  startDate: string
  endDate?: string | null
  matingDates?: string[] | null
  dogName?: string
}) {
  const start = parseDate(startDate)
  const today = todayLocal()
  const matings = new Set((matingDates || []).filter(Boolean))

  // Rango de celdas: desde el lunes de la semana del inicio hasta el domingo
  // de la semana del fin (inicio + 21 días).
  const heatEndOffset = HEAT_DURATION_DAYS - 1
  const gridStart = addDays(start, -weekdayIndex(start))
  const lastDay = addDays(start, heatEndOffset)
  const gridEnd = addDays(lastDay, 6 - weekdayIndex(lastDay))
  const totalCells = daysBetween(gridStart, gridEnd) + 1

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const date = addDays(gridStart, i)
    const offset = daysBetween(start, date)
    const phase = heatPhaseForDay(offset)
    return {
      date,
      offset,
      phase,
      iso: toISODate(date),
      isToday: daysBetween(today, date) === 0,
      isOvulation: offset === OVULATION_DAY,
      isMating: matings.has(toISODate(date)),
    }
  })

  const estroStart = addDays(start, PROESTRO_DAYS)
  const estroEnd = addDays(start, PROESTRO_DAYS + ESTRO_DAYS - 1)
  const fmtShort = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`

  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <div className="mb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">Ciclo de celo</p>
        <p className="mt-0.5 text-[13px] text-body">
          {dogName ? <strong className="text-ink">{dogName}</strong> : 'Esta hembra'} · inicio {fmtShort(start)}.
          {' '}Ventana fértil estimada (estro): <strong className="text-emerald-700">{fmtShort(estroStart)}–{fmtShort(estroEnd)}</strong>, ovulación ~{fmtShort(addDays(start, OVULATION_DAY))}.
        </p>
      </div>

      {/* Mini-calendario */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-[10px] font-semibold uppercase text-muted">{w}</div>
        ))}
        {cells.map((c, i) => {
          const inHeat = c.phase !== null
          return (
            <div
              key={i}
              title={inHeat ? `${HEAT_PHASE_META[c.phase!].label} · ${c.date.getDate()} ${MONTHS_SHORT[c.date.getMonth()]}${c.isMating ? ' · monta' : ''}${c.isOvulation ? ' · ovulación estimada' : ''}` : undefined}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-[11.5px] font-medium ${
                inHeat ? PHASE_CELL[c.phase!] : 'text-muted/40'
              } ${c.isToday ? 'ring-2 ring-ink' : ''} ${c.isMating ? 'ring-2 ring-rose-500' : ''}`}
            >
              {c.date.getDate()}
              {c.isOvulation && !c.isMating && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600" title="Ovulación estimada" />
              )}
              {c.isMating && (
                <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-rose-500 text-rose-500" />
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted">
        {(['proestro', 'estro', 'diestro'] as HeatPhase[]).map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${PHASE_DOT[p]}`} />
            {HEAT_PHASE_META[p].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> Monta
        </span>
        {!endDate && <span className="text-muted/70">· fases estimadas (varían por perra)</span>}
      </div>
    </div>
  )
}
