/**
 * /newsletter — lista de campañas + acceso a suscriptores.
 *
 * Reemplaza el viejo "/newsletter = lista de suscriptores" — ahora el
 * panel principal son CAMPAÑAS. Los suscriptores se gestionan en
 * /newsletter/suscriptores (o desde /contactos tab Suscriptores).
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Mail } from 'lucide-react'
import { countAllAudiences, AUDIENCE_LABELS } from '@/lib/newsletter/audiences'
import NewsletterCreateButton from '@/components/newsletter/create-campaign-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Newsletter · Genealogic Pro' }

type Campaign = {
  id: string
  title: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  audience_type: string
  recipients_total: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  sent_at: string | null
  created_at: string
  scheduled_at: string | null
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Borrador',   cls: 'bg-gray-100 text-gray-700' },
  scheduled: { label: 'Programada', cls: 'bg-amber-50 text-amber-800' },
  sending:   { label: 'Enviando…',  cls: 'bg-blue-50 text-blue-800' },
  sent:      { label: 'Enviada',    cls: 'bg-emerald-50 text-emerald-800' },
  failed:    { label: 'Fallo',      cls: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Cancelada',  cls: 'bg-gray-100 text-gray-500' },
}

export default async function NewsletterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kennel } = await supabase
    .from('kennels').select('id, name').eq('owner_id', user.id).maybeSingle()
  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">Newsletter</h1>
        <p className="text-body">Necesitas un criadero registrado.</p>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const [{ data: rows }, audiences] = await Promise.all([
    admin.from('newsletter_campaigns')
      .select('id, title, subject, status, audience_type, recipients_total, delivered_count, opened_count, clicked_count, sent_at, created_at, scheduled_at')
      .eq('kennel_id', kennel.id)
      .order('created_at', { ascending: false })
      .limit(50),
    countAllAudiences(kennel.id),
  ])
  const campaigns = (rows as Campaign[] | null) ?? []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
            {kennel.name}
          </p>
          <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold text-ink tracking-tight">
            <Mail className="w-7 h-7" />
            Newsletter
          </h1>
          <p className="mt-2 text-body max-w-2xl text-sm">
            Envía novedades, próximas camadas y noticias del criadero a tus
            contactos. Cada email incluye link de baja automático.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/newsletter/suscriptores"
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-4 py-2 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
          >
            <Users className="w-4 h-4" />
            Suscriptores ({audiences.all})
          </Link>
          <NewsletterCreateButton kennelId={kennel.id} />
        </div>
      </div>

      {/* Audiencias */}
      <section className="rounded-2xl border border-hairline bg-canvas p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-3">
          Tu audiencia
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AudienceStat label={AUDIENCE_LABELS.all} count={audiences.all} />
          <AudienceStat label={AUDIENCE_LABELS.customers} count={audiences.customers} hint="con reserva" />
          <AudienceStat label={AUDIENCE_LABELS.leads} count={audiences.leads} hint="sin reserva" />
          <AudienceStat label={AUDIENCE_LABELS.delivered} count={audiences.delivered} hint="ya recibieron" />
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Cifras basadas en suscriptores activos. Se actualizan al momento.
        </p>
      </section>

      {/* Campañas */}
      <section>
        <h2 className="text-base font-bold text-ink mb-3">Campañas ({campaigns.length})</h2>
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-6 py-12 text-center">
            <Mail className="mx-auto h-10 w-10 text-muted mb-3" />
            <p className="text-base font-bold text-ink">Aún no hay campañas</p>
            <p className="text-sm text-muted mt-1">
              Pulsa &ldquo;Nueva campaña&rdquo; arriba a la derecha para crear la primera.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-hairline bg-canvas">
            <table className="w-full text-sm">
              <thead className="bg-surface-soft/50 border-b border-hairline">
                <tr>
                  <Th>Título</Th>
                  <Th hide="md">Asunto</Th>
                  <Th align="right">Destinatarios</Th>
                  <Th align="right" hide="md">Open rate</Th>
                  <Th align="right">Fecha</Th>
                  <Th align="right">Estado</Th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const meta = STATUS_META[c.status] ?? STATUS_META.draft
                  const openRate = c.delivered_count > 0
                    ? Math.round((c.opened_count * 100) / c.delivered_count)
                    : 0
                  return (
                    <tr key={c.id} className="border-t border-hairline-soft hover:bg-surface-soft transition">
                      <td className="px-4 py-2.5">
                        <Link href={`/newsletter/${c.id}`} className="font-semibold text-ink hover:underline">
                          {c.title}
                        </Link>
                      </td>
                      <Td hide="md" className="text-body text-[12.5px] max-w-xs truncate">{c.subject}</Td>
                      <td className="px-4 py-2.5 text-right text-body tabular-nums">
                        {c.recipients_total || '—'}
                      </td>
                      <Td hide="md" className="text-right text-body tabular-nums">
                        {c.delivered_count > 0 ? `${openRate}%` : '—'}
                      </Td>
                      <td className="px-4 py-2.5 text-right text-muted text-[12px]">
                        {fmtDate(c.sent_at || c.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Helpers UI ────────────────────────────────────────────────────────────
function Th({
  children, align = 'left', hide,
}: { children?: React.ReactNode; align?: 'left' | 'right'; hide?: 'sm' | 'md' | 'lg' }) {
  const hideCls = hide === 'sm' ? 'hidden sm:table-cell' : hide === 'md' ? 'hidden md:table-cell' : hide === 'lg' ? 'hidden lg:table-cell' : ''
  return (
    <th className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted ${align === 'right' ? 'text-right' : 'text-left'} ${hideCls}`}>
      {children}
    </th>
  )
}
function Td({
  children, hide, className,
}: { children?: React.ReactNode; hide?: 'sm' | 'md' | 'lg'; className?: string }) {
  const hideCls = hide === 'sm' ? 'hidden sm:table-cell' : hide === 'md' ? 'hidden md:table-cell' : hide === 'lg' ? 'hidden lg:table-cell' : ''
  return <td className={`px-4 py-2.5 ${hideCls} ${className || ''}`}>{children}</td>
}

function AudienceStat({ label, count, hint }: { label: string; count: number; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface-soft/40 border border-hairline p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink tabular-nums leading-none">{count}</p>
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
