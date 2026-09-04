/**
 * Modo NEGOCIO del escritorio (criador). Resumen operativo del embudo:
 *  - Dinero: cobrado · pendiente de cobro · valor en reservas.
 *  - Reservas por estado (mini-embudo del pipeline "Reservas").
 *  - Requiere tu atención: solicitudes nuevas sin leer · próximas entregas ·
 *    contratos pendientes de firma.
 *
 * Server component: carga con service-role (ya verificado el kennel del user)
 * los datos del embudo. Todo enlaza a /embudo, /contratos, etc.
 */
import { createKennelAdminClient } from '@/lib/supabase/server'
import { getAnalytics } from '@/lib/analytics'
import Link from 'next/link'
import { Coins, Wallet, Hourglass, Inbox, Truck, ScrollText, ArrowRight, TrendingUp, MessageSquare, AlertCircle, Globe, Eye, MapPin } from 'lucide-react'

function money(cents: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
  } catch {
    return `${Math.round(cents / 100).toLocaleString('es-ES')} €`
  }
}

type Stage = { id: string; name: string; type: string | null; position: number }
type Reservation = {
  id: string; stage_id: string | null; seen_by_breeder_at: string | null
  total_price_cents: number | null; currency: string | null; applicant_name: string | null
}

export default async function NegocioPanel({
  kennelId, t,
}: {
  kennelId: string
  t: (k: string) => string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any

  // Pipeline "Reservas" (el operativo) + sus pasos.
  const { data: pipelines } = await admin
    .from('pipelines')
    .select('id, slug, name, pipeline_stages(id, name, type, position)')
    .eq('kennel_id', kennelId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipelinesList = (pipelines || []) as any[]
  const reservasPipe = pipelinesList.find((p) => p.slug === 'reservas') || pipelinesList[0] || null
  const stages: Stage[] = ((reservasPipe?.pipeline_stages || []) as Stage[]).sort((a, b) => a.position - b.position)
  const stageById = new Map(stages.map((s) => [s.id, s]))

  // eslint-disable-next-line react-hooks/purity
  const todayISO = new Date().toISOString().split('T')[0]
  const [resRes, paysRes, newCountRes, unreadMsgRes, overduePayRes] = await Promise.all([
    reservasPipe
      ? admin.from('puppy_reservations')
          .select('id, stage_id, seen_by_breeder_at, total_price_cents, currency, applicant_name')
          .eq('pipeline_id', reservasPipe.id)
      : Promise.resolve({ data: [] }),
    admin.from('reservation_payments').select('reservation_id, amount_cents').eq('kennel_id', kennelId).eq('status', 'paid'),
    // Solicitudes NUEVAS sin leer (cualquier pipeline del kennel).
    admin.from('puppy_reservations').select('id', { count: 'exact', head: true }).eq('kennel_id', kennelId).is('seen_by_breeder_at', null),
    // Mensajes de clientes SIN responder (esperando al criador).
    admin.from('reservation_messages').select('id', { count: 'exact', head: true }).eq('kennel_id', kennelId).eq('sender_role', 'client').is('read_at_breeder', null),
    // Pagos ATRASADOS: vencidos y no cobrados.
    admin.from('reservation_payments').select('id', { count: 'exact', head: true }).eq('kennel_id', kennelId).lt('due_date', todayISO).in('status', ['pending', 'requested']),
  ])
  const unreadMessages = unreadMsgRes.count || 0
  const overduePayments = overduePayRes.count || 0
  // Tráfico de la web pública del criadero (últimos 30 días).
  const analytics = await getAnalytics({ kennelId, range: 'month' }).catch(() => null)

  const reservations: Reservation[] = (resRes.data || []) as Reservation[]
  const paidByRes: Record<string, number> = {}
  for (const p of (paysRes.data || []) as { reservation_id: string; amount_cents: number }[]) {
    paidByRes[p.reservation_id] = (paidByRes[p.reservation_id] || 0) + (p.amount_cents || 0)
  }

  const lostIds = new Set(stages.filter((s) => s.type === 'lost').map((s) => s.id))
  const active = reservations.filter((r) => r.stage_id && !lostIds.has(r.stage_id))

  let totalCents = 0, pendingCents = 0, currency = 'EUR'
  for (const r of active) {
    const paid = paidByRes[r.id] || 0
    if (r.total_price_cents != null) {
      totalCents += r.total_price_cents
      pendingCents += Math.max(0, r.total_price_cents - paid)
    }
    if (r.currency) currency = r.currency
  }
  const paidCents = reservations.reduce((s, r) => s + (paidByRes[r.id] || 0), 0)

  // Conteo por paso (todos los del pipeline Reservas).
  const countByStage = new Map<string, number>()
  for (const r of reservations) if (r.stage_id) countByStage.set(r.stage_id, (countByStage.get(r.stage_id) || 0) + 1)

  const newCount = newCountRes.count || 0

  // Próximas entregas: reservas en el paso cuyo nombre menciona "entrega".
  const deliveryStage = stages.find((s) => /entrega/i.test(s.name))
  const upcomingDeliveries = deliveryStage
    ? active.filter((r) => r.stage_id === deliveryStage.id).slice(0, 5)
    : []

  // Contratos pendientes de firma (de las reservas del kennel).
  let pendingContracts = 0
  const resIds = reservations.map((r) => r.id)
  if (resIds.length) {
    const { data: contracts } = await admin
      .from('reservation_contracts')
      .select('status, reservation_id')
      .in('reservation_id', resIds)
    for (const c of (contracts || []) as { status: string }[]) {
      if (c.status !== 'signed_full' && c.status !== 'cancelled' && c.status !== 'draft') pendingContracts++
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Dinero ── */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MoneyCard icon={Coins} label={t('Valor en reservas')} value={money(totalCents, currency)} accent="#1f2937" sub={t('reservas activas')} href="/embudo" />
        <MoneyCard icon={Wallet} label={t('Cobrado')} value={money(paidCents, currency)} accent="#059669" sub={t('pagos recibidos')} href="/embudo" />
        <MoneyCard icon={Hourglass} label={t('Pendiente de cobro')} value={money(pendingCents, currency)} accent="#d97706" sub={t('por cobrar')} href="/embudo" />
      </section>

      {/* ── Reservas por estado ── */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">{t('Reservas por estado')}</h2>
          <Link href="/embudo" className="text-[13px] font-medium text-body hover:text-ink">{t('Abrir embudo →')}</Link>
        </div>
        {stages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-10 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 text-[14px] text-body">{t('Aún no tienes embudo de reservas configurado.')}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stages.map((s) => {
              const n = countByStage.get(s.id) || 0
              const tone = s.type === 'won' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : s.type === 'lost' ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-hairline bg-canvas text-body'
              return (
                <Link key={s.id} href="/embudo" className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition hover:border-ink/30 ${tone}`}>
                  <span className="text-[13px] font-medium">{t(s.name)}</span>
                  <span className="text-[15px] font-bold tabular-nums">{n}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Requiere tu atención ── */}
      <section>
        <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.04em] text-ink">{t('Requiere tu atención')}</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <AttentionCard icon={Inbox} color="#f59e0b" href="/embudo" value={newCount} title={t('Solicitudes nuevas')} sub={t('sin leer')} />
          <AttentionCard icon={MessageSquare} color="#0ea5e9" href="/embudo" value={unreadMessages} title={t('Mensajes')} sub={t('sin responder')} />
          <AttentionCard icon={AlertCircle} color="#ef4444" href="/embudo" value={overduePayments} title={t('Pagos atrasados')} sub={t('vencidos sin cobrar')} />
          <AttentionCard icon={Truck} color="#3b82f6" href="/embudo" value={deliveryStage ? upcomingDeliveries.length : 0} title={t('Próximas entregas')} sub={t('pendientes de entregar')} />
          <AttentionCard icon={ScrollText} color="#8b5cf6" href="/contratos" value={pendingContracts} title={t('Contratos por firmar')} sub={t('esperando firma')} />
        </div>
        {upcomingDeliveries.length > 0 && (
          <ul className="mt-3 overflow-hidden rounded-xl border border-hairline bg-canvas divide-y divide-hairline-soft">
            {upcomingDeliveries.map((r) => (
              <li key={r.id}>
                <Link href="/embudo" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-soft">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10"><Truck className="h-4 w-4 text-blue-600" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink truncate">{r.applicant_name || t('Sin nombre')}</p>
                    <p className="text-[12.5px] text-muted">{t('Pendiente de entrega')}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tu web pública — demanda entrante (últimos 30 días) */}
      {analytics && analytics.kpi.visits > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">{t('Tu web pública')}</h2>
            <Link href="/visitas" className="text-[13px] font-medium text-body hover:text-ink">{t('Ver estadísticas →')}</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <MoneyCard icon={Globe} label={t('Visitas (30 días)')} value={String(analytics.kpi.visits)} accent="#3b82f6" sub={`${analytics.kpi.uniqueVisitors} ${t('visitantes únicos')}`} href="/visitas" />
            <MoneyCard icon={Eye} label={t('Páginas por visita')} value={analytics.kpi.pagesPerVisitor.toFixed(1)} accent="#8b5cf6" sub={`${analytics.kpi.bouncePct}% ${t('rebote')}`} href="/visitas" />
            <MoneyCard icon={MapPin} label={t('Top país')} value={analytics.countries[0]?.country || '—'} accent="#059669" sub={analytics.countries[0] ? `${analytics.countries[0].visits} ${t('visitas')}` : t('sin datos')} href="/visitas" />
          </div>
        </section>
      )}
    </div>
  )
}

function MoneyCard({ icon: Icon, label, value, accent, sub, href }: {
  icon: React.ElementType; label: string; value: string; accent: string; sub: string; href: string
}) {
  return (
    <Link href={href} className="group rounded-2xl border border-hairline bg-canvas p-5 transition-all hover:border-ink/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${accent}15`, color: accent }}><Icon className="h-4 w-4" /></span>
        {label}
      </div>
      <p className="mt-3 text-[28px] font-bold tabular-nums text-ink leading-none">{value}</p>
      <p className="mt-2 text-[12.5px] text-muted">{sub}</p>
    </Link>
  )
}

function AttentionCard({ icon: Icon, color, href, value, title, sub }: {
  icon: React.ElementType; color: string; href: string; value: number; title: string; sub: string
}) {
  return (
    <Link href={href} className={`group rounded-2xl border p-5 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${value > 0 ? 'border-ink/20 bg-canvas' : 'border-hairline bg-surface-soft/40'}`}>
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}15`, color }}><Icon className="h-5 w-5" /></span>
        <span className="text-[26px] font-bold tabular-nums text-ink leading-none">{value}</span>
      </div>
      <p className="mt-3 text-[15px] font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-[12.5px] text-muted">{sub}</p>
    </Link>
  )
}
