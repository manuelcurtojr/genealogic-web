/**
 * Lógica reproductiva canina — ÚNICA fuente de verdad.
 *
 * Antes las constantes (21/63/180) y la máquina de estados estaban
 * duplicadas en reproduccion-tab.tsx y reproduction-gantt.tsx. Ahora viven
 * aquí y las consumen: la pestaña del perro, el gantt, el calendario y el
 * cron de emails.
 *
 * Máquina de estados de una hembra:
 *   En reposo  → (registra celo)        → En celo
 *   En celo    → (marca monta + fecha)  → Montada (pendiente de confirmar)
 *   Montada    → (confirma preñez ~28d) → Gestante  → (parto +63d) → camada
 *   Montada    → (marca no preñada)     → En reposo
 */

export const HEAT_DURATION_DAYS = 21        // duración media de un celo
export const GESTATION_DAYS = 63            // gestación canina estándar
export const DEFAULT_CYCLE_INTERVAL_DAYS = 180 // intervalo típico entre celos (~6 meses)
export const CONFIRM_PREGNANCY_DAYS = 28    // ecografía/confirmación de preñez
export const BIRTH_WARN_DAYS = 7            // antelación del aviso de parto
export const HEAT_WARN_DAYS = 7             // antelación del aviso de próximo celo

export type ReproState = 'in_heat' | 'mated_pending' | 'pregnant' | 'idle'

export interface HeatCycleLike {
  id: string
  dog_id: string
  start_date: string
  end_date: string | null
  was_mated: boolean
  mating_date?: string | null
  mating_end_date?: string | null
  mating_dates?: string[] | null
  pregnancy_status?: string | null
  resulted_in_litter_id?: string | null
  notes?: string | null
}

export interface LitterLike {
  id: string
  status: string
  mating_date: string | null
  birth_date: string | null
  mother_id: string | null
  puppy_count?: number | null
}

// ── Helpers de fecha (mediodía local para esquivar líos de TZ) ─────────────
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}
export function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
export function todayLocal(): Date {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0)
}

export const STATE_LABEL: Record<ReproState, string> = {
  in_heat: 'En celo',
  mated_pending: 'Montada · pendiente confirmar',
  pregnant: 'Gestante',
  idle: 'En reposo',
}

export interface ReproInfo {
  state: ReproState
  stateLabel: string
  /** El celo que conduce el estado actual (celo activo o el de la monta). */
  drivingCycle?: HeatCycleLike
  /** Primer día de monta. */
  matingDate?: Date
  /** Último día de monta (si hubo rango de cubrición). */
  matingEndDate?: Date
  /** Parto previsto (desde la primera monta) = mating_date + 63 días. */
  expectedBirth?: Date
  /** Fin de la ventana de parto (desde la última monta) = mating_end + 63. */
  expectedBirthEnd?: Date
  /** Cuándo confirmar la preñez = monta + 28 días (si montada). */
  confirmDueDate?: Date
  /** Próximo celo estimado a partir del historial. */
  nextHeatForecast?: Date
  /** Intervalo medio entre celos (días) usado para el forecast. */
  avgIntervalDays: number
}

/** Intervalo medio entre celos de una hembra (o el default si <2 celos). */
export function avgHeatInterval(cyclesAscDates: Date[]): number {
  if (cyclesAscDates.length < 2) return DEFAULT_CYCLE_INTERVAL_DAYS
  const intervals: number[] = []
  for (let i = 1; i < cyclesAscDates.length; i++) {
    intervals.push(daysBetween(cyclesAscDates[i - 1], cyclesAscDates[i]))
  }
  return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
}

/**
 * Calcula el estado reproductivo de UNA hembra a partir de sus celos y camadas.
 * `litters` es opcional (compatibilidad: una camada status='mated' también
 * cuenta como gestación para datos antiguos).
 */
export function computeReproInfo(
  femaleId: string,
  cycles: HeatCycleLike[],
  litters: LitterLike[],
  today: Date = todayLocal(),
): ReproInfo {
  const mine = cycles
    .filter((c) => c.dog_id === femaleId)
    .sort((a, b) => parseDate(a.start_date).getTime() - parseDate(b.start_date).getTime())

  const cycleStartDates = mine.map((c) => parseDate(c.start_date))
  const avgIntervalDays = avgHeatInterval(cycleStartDates)

  // Forecast del próximo celo
  let nextHeatForecast: Date | undefined
  if (cycleStartDates.length > 0) {
    const last = cycleStartDates[cycleStartDates.length - 1]
    const projected = addDays(last, avgIntervalDays)
    if (projected > today) nextHeatForecast = projected
  }

  // 1) ¿Celo activo hoy?
  const activeHeat = mine.find((c) => {
    const start = parseDate(c.start_date)
    const end = c.end_date ? parseDate(c.end_date) : addDays(start, HEAT_DURATION_DAYS)
    return today >= start && today <= end
  })

  // 2) Celo montado más reciente con fecha de monta
  const matedCycle = [...mine].reverse().find(
    (c) => c.was_mated && c.mating_date && (c.pregnancy_status ?? 'none') !== 'failed',
  )
  const matingDate = matedCycle?.mating_date ? parseDate(matedCycle.mating_date) : undefined
  const matingEndDate = matedCycle?.mating_end_date ? parseDate(matedCycle.mating_end_date) : undefined
  const expectedBirth = matingDate ? addDays(matingDate, GESTATION_DAYS) : undefined
  // Fin de ventana: desde la última monta (o la única si no hay rango).
  const expectedBirthEnd = (matingEndDate ?? matingDate)
    ? addDays((matingEndDate ?? matingDate)!, GESTATION_DAYS)
    : undefined
  const confirmDueDate = matingDate ? addDays(matingDate, CONFIRM_PREGNANCY_DAYS) : undefined

  // Gestación por camada antigua (compat)
  const matedLitter = litters.find(
    (l) => l.mother_id === femaleId && l.status === 'mated' && l.mating_date &&
      today >= parseDate(l.mating_date) && today <= addDays(parseDate(l.mating_date), GESTATION_DAYS),
  )

  const inGestationWindow = !!(matingDate && expectedBirth && today >= matingDate && today <= expectedBirth)
  const isConfirmed = matedCycle?.pregnancy_status === 'confirmed'

  let state: ReproState
  let drivingCycle: HeatCycleLike | undefined

  if (activeHeat) {
    state = 'in_heat'
    drivingCycle = activeHeat
  } else if ((isConfirmed && inGestationWindow) || matedLitter) {
    state = 'pregnant'
    drivingCycle = matedCycle
  } else if (matedCycle && inGestationWindow) {
    // Montada pero aún sin confirmar (suspected) y dentro de la ventana de gestación
    state = 'mated_pending'
    drivingCycle = matedCycle
  } else {
    state = 'idle'
  }

  const showBirth = state === 'mated_pending' || state === 'pregnant'
  return {
    state,
    stateLabel: STATE_LABEL[state],
    drivingCycle,
    matingDate,
    matingEndDate,
    expectedBirth: showBirth ? expectedBirth : undefined,
    expectedBirthEnd: showBirth ? expectedBirthEnd : undefined,
    confirmDueDate: state === 'mated_pending' ? confirmDueDate : undefined,
    nextHeatForecast,
    avgIntervalDays,
  }
}

/** Texto de parto previsto: fecha única o ventana si hubo rango de monta. */
export function birthWindowText(info: ReproInfo): string | null {
  if (!info.expectedBirth) return null
  if (info.expectedBirthEnd && info.expectedBirthEnd.getTime() !== info.expectedBirth.getTime()) {
    return `entre el ${fmtDate(info.expectedBirth)} y el ${fmtDate(info.expectedBirthEnd)}`
  }
  return fmtDate(info.expectedBirth)
}
