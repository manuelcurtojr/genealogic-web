/**
 * GET /api/cron/repro-reminders
 *
 * Cron diario que manda avisos reproductivos a los criadores:
 *   · Próximo celo  → 7 días antes del celo estimado (HEAT_WARN_DAYS)
 *   · Confirmar preñez → el día 28 desde la monta (CONFIRM_PREGNANCY_DAYS)
 *   · Parto previsto → 7 días antes (BIRTH_WARN_DAYS) y el día del parto
 *
 * Toda la lógica de fechas vive en @/lib/repro/cycle (compartida con la UI).
 * Dedupe por dedupe_key en email_log → seguro si el cron corre 2 veces.
 *
 * Autorización: requiere CRON_SECRET (Vercel Cron lo añade auto).
 */
import { NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { isAuthorizedCron, cronUnauthorized } from '@/lib/cron/auth'
import { sendTransactionalEmail } from '@/lib/email/send'
import {
  parseDate, addDays, toISODate, fmtDate, avgHeatInterval,
  GESTATION_DAYS, CONFIRM_PREGNANCY_DAYS, BIRTH_WARN_DAYS, HEAT_WARN_DAYS,
} from '@/lib/repro/cycle'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dogName(c: any): string {
  const d = Array.isArray(c.dog) ? c.dog[0] : c.dog
  return d?.name || 'tu perra'
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const todayISO = new Date().toISOString().slice(0, 10)
  const today = parseDate(todayISO)

  const { data: cyclesRaw } = await admin
    .from('heat_cycles')
    .select('id, owner_id, dog_id, start_date, end_date, was_mated, mating_date, pregnancy_status, dog:dogs(name)')
  const cycles = (cyclesRaw || []) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  if (cycles.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  const ownerIds = [...new Set(cycles.map((c) => c.owner_id))]
  const { data: profiles } = await admin.from('profiles').select('id, email, display_name').in('id', ownerIds)
  const profById = new Map<string, { email: string | null; display_name: string | null }>(
    (profiles || []).map((p: any) => [p.id, { email: p.email, display_name: p.display_name }]), // eslint-disable-line @typescript-eslint/no-explicit-any
  )

  let sent = 0

  // ── 1) Confirmar preñez + parto previsto (por celo montado) ──────────────
  for (const c of cycles) {
    const prof = profById.get(c.owner_id)
    if (!prof?.email) continue
    if (!c.was_mated || !c.mating_date) continue
    const mating = parseDate(c.mating_date)
    const name = dogName(c)

    if (c.pregnancy_status === 'suspected') {
      const confirmISO = toISODate(addDays(mating, CONFIRM_PREGNANCY_DAYS))
      if (confirmISO === todayISO) {
        const r = await sendTransactionalEmail(prof.email, {
          template: 'repro_confirm_pregnancy',
          props: {
            recipientName: prof.display_name, dogName: name,
            matingDate: fmtDate(mating),
            expectedBirth: fmtDate(addDays(mating, GESTATION_DAYS)),
          },
        }, { userId: c.owner_id, dedupeKey: `repro_confirm:${c.id}` })
        if (r.ok && !r.skipped) sent++
      }
    }

    if (c.pregnancy_status === 'confirmed') {
      const birth = addDays(mating, GESTATION_DAYS)
      const warnISO = toISODate(addDays(birth, -BIRTH_WARN_DAYS))
      const birthISO = toISODate(birth)
      if (warnISO === todayISO || birthISO === todayISO) {
        const isDay = birthISO === todayISO
        const r = await sendTransactionalEmail(prof.email, {
          template: 'repro_birth_soon',
          props: {
            recipientName: prof.display_name, dogName: name,
            expectedBirth: fmtDate(birth), daysUntil: isDay ? 0 : BIRTH_WARN_DAYS,
          },
        }, { userId: c.owner_id, dedupeKey: `repro_birth_${isDay ? 'day' : 'warn'}:${c.id}` })
        if (r.ok && !r.skipped) sent++
      }
    }
  }

  // ── 2) Próximo celo previsto (por hembra) ────────────────────────────────
  const byDog = new Map<string, any[]>() // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const c of cycles) {
    if (!byDog.has(c.dog_id)) byDog.set(c.dog_id, [])
    byDog.get(c.dog_id)!.push(c)
  }
  for (const [, dogCycles] of byDog) {
    const owner = dogCycles[0].owner_id
    const prof = profById.get(owner)
    if (!prof?.email) continue
    const starts = dogCycles.map((c) => parseDate(c.start_date)).sort((a, b) => a.getTime() - b.getTime())
    const avg = avgHeatInterval(starts)
    const forecast = addDays(starts[starts.length - 1], avg)
    if (forecast <= today) continue
    const warnISO = toISODate(addDays(forecast, -HEAT_WARN_DAYS))
    if (warnISO === todayISO) {
      const r = await sendTransactionalEmail(prof.email, {
        template: 'repro_next_heat',
        props: {
          recipientName: prof.display_name, dogName: dogName(dogCycles[0]),
          heatDate: fmtDate(forecast), daysUntil: HEAT_WARN_DAYS,
        },
      }, { userId: owner, dedupeKey: `repro_heat:${dogCycles[0].dog_id}:${toISODate(forecast)}` })
      if (r.ok && !r.skipped) sent++
    }
  }

  return NextResponse.json({ ok: true, sent })
}
