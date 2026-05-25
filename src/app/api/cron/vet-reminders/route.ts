/**
 * GET /api/cron/vet-reminders
 *
 * Cron diario que manda recordatorios vet:
 *  - 7 días antes del due_date
 *  - 1 día antes
 *  - el día D
 *
 * Solo procesa recordatorios con completed_date=NULL. Dedupea por
 * (reminder_id + bucket) para no mandar 2 veces el mismo aviso (ej:
 * si el cron se ejecuta a las 9:00 y otra vez a las 10:00 por retry).
 *
 * Autorización: requiere CRON_SECRET (Vercel Cron lo añade auto).
 */
import { NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '@/lib/email/send'
import { isAuthorizedCron, cronUnauthorized } from '@/lib/cron/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Bucket = 'today' | 'tomorrow' | 'in_7_days'

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Fechas en formato YYYY-MM-DD comparadas server-side
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const todayISO = fmt(today)
  const tomorrowISO = fmt(new Date(today.getTime() + 86400000))
  const in7ISO = fmt(new Date(today.getTime() + 7 * 86400000))

  const buckets: Record<Bucket, string> = {
    today: todayISO,
    tomorrow: tomorrowISO,
    in_7_days: in7ISO,
  }

  const results: Record<string, { processed: number; sent: number; skipped: number; failed: number }> = {}

  for (const [bucket, date] of Object.entries(buckets)) {
    const { data: reminders } = await admin
      .from('vet_reminders')
      .select('id, dog_id, owner_id, title, type, due_date, dog:dogs(name, slug)')
      .is('completed_date', null)
      .eq('due_date', date)

    let sent = 0, skipped = 0, failed = 0
    const list = (reminders || []) as Array<{
      id: string; dog_id: string; owner_id: string; title: string; type: string; due_date: string;
      dog: { name: string; slug: string | null } | { name: string; slug: string | null }[] | null
    }>

    for (const r of list) {
      // Resolver email del owner
      const { data: profile } = await admin
        .from('profiles')
        .select('display_name, email')
        .eq('id', r.owner_id)
        .maybeSingle()
      if (!profile?.email) { skipped++; continue }

      const dog = Array.isArray(r.dog) ? r.dog[0] : r.dog
      if (!dog) { skipped++; continue }

      const result = await sendTransactionalEmail(
        profile.email,
        {
          template: 'vet_reminder',
          props: {
            recipientName: profile.display_name || null,
            dogName: dog.name,
            dogId: dog.slug || r.dog_id,
            reminderTitle: r.title,
            reminderType: (r.type as 'vaccine' | 'deworming' | 'checkup' | 'custom') || 'custom',
            dueDate: r.due_date,
            bucket: bucket as Bucket,
          },
        },
        {
          userId: r.owner_id,
          dedupeKey: `vet_reminder:${r.id}:${bucket}`,
        },
      )

      if (result.ok && !result.skipped) sent++
      else if (result.skipped) skipped++
      else failed++
    }

    results[bucket] = { processed: list.length, sent, skipped, failed }
  }

  return NextResponse.json({ ok: true, results, ranAt: new Date().toISOString() })
}
