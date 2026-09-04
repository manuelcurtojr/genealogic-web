/**
 * Señales reproductivas para el escritorio del criador (modo Cría / Agenda).
 * Reutiliza el motor canónico `computeReproInfo` (lib/repro/cycle) sobre las
 * hembras reproductoras del criadero, sus celos (heat_cycles) y camadas.
 *
 * Deriva: próximos partos con cuenta atrás, hembras a confirmar preñez, celos
 * activos, próximos celos previstos, y camadas montadas cuyo parto ya venció
 * sin registrar nacimiento.
 */
import {
  computeReproInfo, todayLocal, daysBetween, parseDate, addDays, fmtDate,
  GESTATION_DAYS, type HeatCycleLike, type LitterLike,
} from '@/lib/repro/cycle'

export type BirthSignal = { femaleName: string; when: string; daysLeft: number; confirmed: boolean }
export type ConfirmSignal = { femaleName: string; when: string; overdue: boolean }
export type HeatSignal = { femaleName: string; when: string; daysLeft: number }
export type LitterNoBirthSignal = { litterId: string; label: string; overdueDays: number }

export type ReproSignals = {
  gestating: number
  upcomingBirths: BirthSignal[]
  toConfirm: ConfirmSignal[]
  inHeat: HeatSignal[]
  upcomingHeats: HeatSignal[]
  littersNoBirth: LitterNoBirthSignal[]
}

const EMPTY: ReproSignals = { gestating: 0, upcomingBirths: [], toConfirm: [], inHeat: [], upcomingHeats: [], littersNoBirth: [] }

export async function getReproSignals(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  ownerId: string,
  kennelId: string,
): Promise<ReproSignals> {
  const { data: females } = await admin
    .from('dogs').select('id, name')
    .or(`owner_id.eq.${ownerId},kennel_id.eq.${kennelId}`)
    .eq('sex', 'female').eq('is_reproductive', true)
  const list = (females || []) as { id: string; name: string }[]
  if (list.length === 0) return EMPTY
  const nameById = new Map(list.map((f) => [f.id, f.name]))

  const [cyclesRes, littersRes] = await Promise.all([
    admin.from('heat_cycles')
      .select('id, dog_id, start_date, end_date, was_mated, mating_date, mating_end_date, mating_dates, pregnancy_status, resulted_in_litter_id')
      .eq('owner_id', ownerId),
    admin.from('litters')
      .select('id, status, mating_date, birth_date, mother_id, puppy_count, father:dogs!litters_father_id_fkey(name), mother:dogs!litters_mother_id_fkey(name)')
      .eq('owner_id', ownerId),
  ])
  const cycles = (cyclesRes.data || []) as HeatCycleLike[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const litters = (littersRes.data || []) as any[]
  const today = todayLocal()

  const out: ReproSignals = { gestating: 0, upcomingBirths: [], toConfirm: [], inHeat: [], upcomingHeats: [], littersNoBirth: [] }

  for (const f of list) {
    const info = computeReproInfo(f.id, cycles, litters as LitterLike[], today)
    const name = f.name || '—'
    if (info.state === 'pregnant' || info.state === 'mated_pending') {
      out.gestating++
      if (info.expectedBirth) {
        out.upcomingBirths.push({
          femaleName: name,
          when: fmtDate(info.expectedBirth),
          daysLeft: daysBetween(today, info.expectedBirth),
          confirmed: info.state === 'pregnant',
        })
      }
    }
    if (info.state === 'mated_pending' && info.confirmDueDate) {
      out.toConfirm.push({ femaleName: name, when: fmtDate(info.confirmDueDate), overdue: info.confirmDueDate <= today })
    }
    if (info.state === 'in_heat' && info.drivingCycle) {
      out.inHeat.push({ femaleName: name, when: fmtDate(parseDate(info.drivingCycle.start_date)), daysLeft: 0 })
    }
    if (info.nextHeatForecast) {
      const d = daysBetween(today, info.nextHeatForecast)
      if (d >= 0 && d <= 30) out.upcomingHeats.push({ femaleName: name, when: fmtDate(info.nextHeatForecast), daysLeft: d })
    }
  }

  // Camadas montadas cuyo parto previsto ya venció y siguen sin nacimiento.
  for (const l of litters) {
    if (l.status === 'mated' && !l.birth_date && l.mating_date) {
      const expected = addDays(parseDate(l.mating_date), GESTATION_DAYS)
      if (expected < today) {
        out.littersNoBirth.push({
          litterId: l.id,
          label: `${l.father?.name || '?'} × ${l.mother?.name || nameById.get(l.mother_id) || '?'}`,
          overdueDays: daysBetween(expected, today),
        })
      }
    }
  }

  out.upcomingBirths.sort((a, b) => a.daysLeft - b.daysLeft)
  out.upcomingHeats.sort((a, b) => a.daysLeft - b.daysLeft)
  out.littersNoBirth.sort((a, b) => b.overdueDays - a.overdueDays)
  return out
}
