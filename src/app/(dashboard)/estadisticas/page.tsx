import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Dog, Baby, UsersRound, KanbanSquare, BookOpen, Mail, TrendingUp, ArrowRight } from 'lucide-react'
import AnalyticsSubnav from '@/components/analytics/analytics-subnav'
import { hasProFeatures, isEnterpriseUser, normalizePlan } from '@/lib/permissions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const metadata = { title: 'Estadísticas · Genealogic Pro' }

export default async function EstadisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const t = getTranslator(await getLocale())

  // Gate REAL de plan: Estadísticas es feature de Kennel Pro (49€). El flag
  // requiresPro del sidebar es solo cosmético; sin esto cualquiera abría la
  // página por URL. Si no tiene plan de pago → /pricing.
  const [{ data: kennelArr }, { data: planProfile }] = await Promise.all([
    supabase
      .from('kennels')
      .select('id, name, slug')
      .eq('owner_id', user.id)
      .limit(1),
    supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
  ])
  if (!isEnterpriseUser(user.id) && !hasProFeatures(normalizePlan(planProfile?.plan))) {
    redirect('/pricing')
  }
  const kennel = kennelArr?.[0]

  if (!kennel) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-3xl font-bold text-ink mb-3">{t('Estadísticas')}</h1>
        <p className="text-body">{t('Necesitas un criadero registrado.')}</p>
      </div>
    )
  }

  // Cargar contadores en paralelo
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString()
  const [dogsRes, littersRes, activeReservasRes, totalReservasRes, ownersRes, knowledgeRes, subsRes, pageviewsRes, pageviews30Res] = await Promise.all([
    supabase.from('dogs').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id),
    supabase.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('puppy_reservations').select('id', { count: 'exact', head: true })
      .eq('kennel_id', kennel.id).not('status', 'in', '("delivered","cancelled")'),
    supabase.from('puppy_reservations').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id),
    supabase.from('owners').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id),
    supabase.from('knowledge_entries').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id).eq('is_active', true),
    supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id).eq('is_active', true),
    supabase.from('page_views').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id),
    supabase.from('page_views').select('id', { count: 'exact', head: true }).eq('kennel_id', kennel.id).gte('created_at', since30d),
  ])

  const stats = {
    dogs: dogsRes.count || 0,
    litters: littersRes.count || 0,
    activeReservas: activeReservasRes.count || 0,
    totalReservas: totalReservasRes.count || 0,
    owners: ownersRes.count || 0,
    knowledge: knowledgeRes.count || 0,
    subs: subsRes.count || 0,
    pageviewsTotal: pageviewsRes.count || 0,
    pageviews30d: pageviews30Res.count || 0,
  }

  // Top perros por reservas
  const { data: topDogsByRes } = await supabase
    .from('puppy_reservations')
    .select('dog_id, dog:dogs(id, name, slug)')
    .eq('kennel_id', kennel.id)
    .not('dog_id', 'is', null)

  const dogReservCount: Record<string, { name: string; slug: string; count: number }> = {}
  for (const r of topDogsByRes || []) {
    const d = (r as any).dog
    if (!d) continue
    if (!dogReservCount[d.id]) dogReservCount[d.id] = { name: d.name, slug: d.slug || d.id, count: 0 }
    dogReservCount[d.id].count++
  }
  const topDogs = Object.values(dogReservCount).sort((a, b) => b.count - a.count).slice(0, 5)

  // Reservas por status
  const { data: allRes } = await supabase
    .from('puppy_reservations')
    .select('status')
    .eq('kennel_id', kennel.id)
  const byStatus: Record<string, number> = {}
  for (const r of allRes || []) byStatus[r.status] = (byStatus[r.status] || 0) + 1

  return (
    <div>
      <div className="mb-5">
        <AnalyticsSubnav />
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight">{t('Estadísticas')}</h1>
        <p className="text-sm text-muted mt-0.5">{kennel.name} · {t('resumen general')}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Dog} label={t('Perros')} value={stats.dogs} href="/dogs" />
        <StatCard icon={Baby} label={t('Camadas')} value={stats.litters} href="/litters" />
        <StatCard icon={KanbanSquare} label={t('Reservas activas')} value={stats.activeReservas}
                  sub={`${stats.totalReservas} ${t('totales')}`} href="/reservas" />
        <StatCard icon={UsersRound} label={t('Contactos')} value={stats.owners} href="/contactos" />
        <StatCard icon={BookOpen} label={t('Biblioteca')} value={stats.knowledge}
                  sub={t('entradas activas')} href="/conocimiento" />
        <StatCard icon={Mail} label={t('Newsletter')} value={stats.subs}
                  sub={t('suscriptores')} href="/newsletter" />
        <StatCard icon={TrendingUp} label={t('Visitas 30d')} value={stats.pageviews30d}
                  sub={`${stats.pageviewsTotal} ${t('histórico')}`} />
        <StatCard icon={TrendingUp} label={t('Visitas totales')} value={stats.pageviewsTotal} />
      </div>

      {/* Pageviews note */}
      {stats.pageviewsTotal === 0 && (
        <div className="rounded-xl border border-hairline bg-surface-card p-4 mb-8 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
          <div className="text-sm text-body leading-relaxed">
            <p className="mb-1"><strong>{t('Tracking de visitas aún sin datos.')}</strong></p>
            <p>
              {t('El conteo de visitas a tu perfil público y a las fichas de tus perros se activa en la próxima fase. La infraestructura ya está en la base de datos')}
              {' '}(<code className="text-[12px] bg-canvas border border-hairline rounded px-1">page_views</code>),
              {' '}{t('falta enganchar el middleware de tracking ligero y anónimo (sha256 de ip+user-agent+día, GDPR-friendly).')}
            </p>
          </div>
        </div>
      )}

      {/* Pipeline status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-hairline bg-canvas p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">{t('Pipeline de reservas')}</h3>
          {stats.totalReservas === 0 ? (
            <p className="text-sm text-muted">{t('Sin reservas todavía. Crea la primera en')} <Link href="/reservas" className="text-ink underline">{t('Reservas')}</Link>.</p>
          ) : (
            <div className="space-y-2">
              {[
                ['interested', t('Interesado')],
                ['waitlisted', t('Lista de espera')],
                ['deposit_paid', t('Depósito pagado')],
                ['assigned', t('Asignado')],
                ['contract_signed', t('Contrato firmado')],
                ['paid_in_full', t('Pago total')],
                ['delivered', t('Entregado')],
                ['cancelled', t('Cancelado')],
              ].map(([key, label]) => {
                const count = byStatus[key] || 0
                const pct = stats.totalReservas > 0 ? (count / stats.totalReservas) * 100 : 0
                if (count === 0) return null
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-body">{label}</span>
                      <span className="text-muted font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-surface-card rounded-full overflow-hidden">
                      <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-hairline bg-canvas p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">{t('Top perros (por reservas asociadas)')}</h3>
          {topDogs.length === 0 ? (
            <p className="text-sm text-muted">{t('Aún no hay reservas asociadas a perros concretos.')}</p>
          ) : (
            <div className="space-y-2">
              {topDogs.map((d, i) => (
                <Link
                  key={d.slug + i}
                  href={`/dogs/${d.slug}`}
                  className="flex items-center justify-between gap-3 py-2 border-b border-hairline last:border-0 hover:bg-surface-soft -mx-2 px-2 rounded transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted font-medium w-4">{i + 1}</span>
                    <span className="text-sm font-medium text-ink truncate">{d.name}</span>
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">{d.count} {d.count === 1 ? t('reserva') : t('reservas')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Perfil público link */}
      <div className="rounded-xl border border-hairline bg-canvas p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-ink mb-1">{t('Tu perfil público')}</p>
            <p className="text-sm text-muted">
              {t('Las visitas y conversiones a este perfil se medirán aquí en cuanto se active el tracking.')}
            </p>
          </div>
          <Link
            href={`/kennels/${kennel.slug}`}
            target="_blank"
            className="text-xs font-medium text-body hover:text-ink border border-hairline rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 transition hover:bg-surface-soft"
          >
            {t('Ver perfil')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub, href,
}: {
  icon: any; label: string; value: number; sub?: string; href?: string
}) {
  const inner = (
    <div className="rounded-xl border border-hairline bg-canvas p-4 hover:border-ink/30 hover:shadow-sm transition h-full">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-muted" />
        {href && <ArrowRight className="w-3 h-3 text-muted opacity-0 transition" />}
      </div>
      <p className="text-2xl font-bold text-ink leading-none">{value.toLocaleString('es-ES')}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted mt-2">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}
