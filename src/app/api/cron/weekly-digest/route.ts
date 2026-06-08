/**
 * GET /api/cron/weekly-digest
 *
 * Cron semanal (lunes 9:00) que manda:
 *  - weekly_digest_breeder a usuarios con kennel (intent=breeder)
 *  - weekly_digest_owner a propietarios (intent=owner) con al menos 1 perro
 *
 * Solo manda si hay algo que decir — no spamean los inboxes con resúmenes vacíos.
 *
 * Autorización: requiere CRON_SECRET.
 */
import { NextResponse } from 'next/server'
import { createKennelAdminClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '@/lib/email/send'
import { isAuthorizedCron, cronUnauthorized } from '@/lib/cron/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return cronUnauthorized()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const weekLabel = formatWeekLabel(now)
  // dedupeKey por semana ISO para que si el cron se ejecuta varias veces
  // el mismo lunes no spamee
  const weekKey = isoWeekKey(now)

  let breedersSent = 0, breedersSkipped = 0
  let ownersSent = 0, ownersSkipped = 0

  // ─── BREEDERS ──────────────────────────────────────────────────────────
  const { data: kennels } = await admin
    .from('kennels')
    .select('id, name, owner_id')
    .not('owner_id', 'is', null)

  for (const k of (kennels as Array<{ id: string; name: string; owner_id: string }> || [])) {
    // Stats de la semana
    const [reservRes, msgsRes, littersRes, viewsRes] = await Promise.all([
      admin.from('puppy_reservations').select('id', { count: 'exact', head: true })
        .eq('kennel_id', k.id).gte('created_at', weekAgo),
      admin.from('reservation_messages').select('id', { count: 'exact', head: true })
        .eq('kennel_id', k.id).eq('sender_role', 'client').is('read_at_breeder', null),
      admin.from('litters').select('id', { count: 'exact', head: true })
        .eq('owner_id', k.owner_id).in('status', ['planned', 'mated']),
      admin.from('page_views').select('id', { count: 'exact', head: true })
        .eq('kennel_id', k.id).gte('created_at', weekAgo),
    ])

    const stats = {
      newReservations: reservRes.count || 0,
      pendingMessages: msgsRes.count || 0,
      upcomingLitters: littersRes.count || 0,
      profileViews: viewsRes.count || 0,
    }

    // Solo mandar si hay AL MENOS una cosa que reportar
    const total = stats.newReservations + stats.pendingMessages + stats.upcomingLitters
    if (total === 0) { breedersSkipped++; continue }

    const { data: profile } = await admin
      .from('profiles')
      .select('display_name, email')
      .eq('id', k.owner_id)
      .maybeSingle()
    if (!profile?.email) { breedersSkipped++; continue }

    // Top 3 mensajes pendientes (para preview en email)
    const { data: topMsgs } = await admin
      .from('reservation_messages')
      .select('body, sender_name, reservation_id')
      .eq('kennel_id', k.id).eq('sender_role', 'client').is('read_at_breeder', null)
      .order('created_at', { ascending: false })
      .limit(3)

    const topMessages = (topMsgs || []).map((m: { body: string; sender_name: string | null; reservation_id: string }) => ({
      from: m.sender_name || 'Cliente',
      preview: m.body,
      reservationId: m.reservation_id,
    }))

    const result = await sendTransactionalEmail(
      profile.email,
      {
        template: 'weekly_digest_breeder',
        props: {
          recipientName: profile.display_name || null,
          kennelName: k.name,
          weekLabel,
          stats,
          topMessages,
        },
      },
      {
        userId: k.owner_id,
        dedupeKey: `digest_breeder:${k.id}:${weekKey}`,
      },
    )
    if (result.ok && !result.skipped) breedersSent++
    else breedersSkipped++
  }

  // ─── OWNERS ────────────────────────────────────────────────────────────
  // Filtra por role='owner', NO onboarding_intent: casi todas las altas tienen
  // intent=NULL pero role='owner'. Filtrar por intent dejaba fuera ~84%.
  const { data: owners } = await admin
    .from('profiles')
    .select('id, display_name, email')
    .eq('role', 'owner')

  const in14ISO = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10)
  const todayISO = now.toISOString().slice(0, 10)

  for (const o of (owners as Array<{ id: string; display_name: string | null; email: string | null }> || [])) {
    if (!o.email) { ownersSkipped++; continue }

    // Cuántos perros tiene
    const { count: dogsCount } = await admin
      .from('dogs').select('id', { count: 'exact', head: true })
      .eq('owner_id', o.id)
    if (!dogsCount || dogsCount === 0) { ownersSkipped++; continue }

    // Recordatorios vet próximos 14 días
    const { data: vetRems } = await admin
      .from('vet_reminders')
      .select('id, title, due_date, dog:dogs(name, slug, id)')
      .eq('owner_id', o.id)
      .is('completed_date', null)
      .gte('due_date', todayISO)
      .lte('due_date', in14ISO)
      .order('due_date')
      .limit(5)

    // Mensajes nuevos en sus reservas (sender=breeder, sin leer por client)
    const { count: msgsCount } = await admin
      .from('reservation_messages').select('id', { count: 'exact', head: true })
      .eq('sender_role', 'breeder').is('read_at_client', null)
      .in('reservation_id',
        (await admin.from('puppy_reservations').select('id').eq('client_user_id', o.id)).data?.map((r: { id: string }) => r.id) || [],
      )

    const upcomingVet = (vetRems || []).map((v: { title: string; due_date: string; dog: { name: string; slug: string | null; id: string } | { name: string; slug: string | null; id: string }[] | null }) => {
      const dog = Array.isArray(v.dog) ? v.dog[0] : v.dog
      return {
        dogName: dog?.name || '—',
        title: v.title,
        dueDate: v.due_date,
        dogId: dog?.slug || dog?.id || '',
      }
    })

    // Solo mandar si hay vet o mensajes
    if (upcomingVet.length === 0 && (msgsCount || 0) === 0) { ownersSkipped++; continue }

    const result = await sendTransactionalEmail(
      o.email,
      {
        template: 'weekly_digest_owner',
        props: {
          recipientName: o.display_name,
          weekLabel,
          dogsCount: dogsCount || 0,
          upcomingVet,
          pendingMessages: msgsCount || 0,
        },
      },
      {
        userId: o.id,
        dedupeKey: `digest_owner:${o.id}:${weekKey}`,
      },
    )
    if (result.ok && !result.skipped) ownersSent++
    else ownersSkipped++
  }

  return NextResponse.json({
    ok: true,
    weekLabel,
    breeders: { sent: breedersSent, skipped: breedersSkipped },
    owners: { sent: ownersSent, skipped: ownersSkipped },
    ranAt: new Date().toISOString(),
  })
}

function formatWeekLabel(d: Date): string {
  const day = d.getDay() // 0=domingo
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const monStr = monday.getDate()
  const sunStr = sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  return `Semana del ${monStr} al ${sunStr}`
}

function isoWeekKey(d: Date): string {
  // Año + nº de semana ISO
  const target = new Date(d.valueOf())
  target.setUTCHours(0, 0, 0, 0)
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${target.getUTCFullYear()}W${String(weekNo).padStart(2, '0')}`
}
