/**
 * Modo CRÍA del escritorio. Además de las camadas activas y los atajos, expone
 * las señales reproductivas que hoy no se veían en el escritorio: próximos
 * partos con cuenta atrás, hembras a confirmar preñez, celos activos, próximos
 * celos previstos y camadas montadas cuyo parto ya venció sin registrar.
 */
import { createKennelAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getReproSignals } from '@/lib/dashboard/repro-signals'
import StatCard from './stat-card'
import { Baby, Dog, Heart, GitCompareArrows, ArrowRight, AlertTriangle, CalendarClock, Stethoscope, Flame } from 'lucide-react'

function countdown(daysLeft: number): string {
  if (daysLeft === 0) return 'hoy'
  if (daysLeft === 1) return 'mañana'
  if (daysLeft > 1) return `en ${daysLeft} días`
  const n = Math.abs(daysLeft)
  return n === 1 ? 'ayer' : `hace ${n} días`
}

export default async function CriaPanel({
  kennelId, ownerId, t,
}: {
  kennelId: string
  ownerId: string
  t: (k: string) => string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const [signals, littersCountRes, dogsCountRes, femalesRes, activeLittersRes] = await Promise.all([
    getReproSignals(admin, ownerId, kennelId),
    admin.from('litters').select('id', { count: 'exact', head: true }).eq('owner_id', ownerId),
    admin.from('dogs').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${ownerId},kennel_id.eq.${kennelId}`),
    admin.from('dogs').select('id', { count: 'exact', head: true }).or(`owner_id.eq.${ownerId},kennel_id.eq.${kennelId}`).eq('sex', 'female').eq('is_reproductive', true),
    admin.from('litters').select('id, status, father:dogs!litters_father_id_fkey(name), mother:dogs!litters_mother_id_fkey(name)').eq('owner_id', ownerId).in('status', ['planned', 'mated']).order('created_at', { ascending: false }).limit(4),
  ])

  const activeLitters = (activeLittersRes.data || []) as { id: string; status: string; father: { name?: string } | null; mother: { name?: string } | null }[]
  const hasRepro = signals.upcomingBirths.length + signals.toConfirm.length + signals.inHeat.length + signals.upcomingHeats.length + signals.littersNoBirth.length > 0

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Baby} label={t('Camadas')} value={littersCountRes.count || 0} accentColor="#8b5cf6" sub={t('totales registradas')} href="/litters" />
        <StatCard icon={Heart} label={t('Reproductoras')} value={femalesRes.count || 0} accentColor="#ec4899" sub={t('hembras activas')} href="/dogs?tab=reproductive" />
        <StatCard icon={Dog} label={t('Perros')} value={dogsCountRes.count || 0} accentColor="#fb923c" sub={t('en tu criadero')} href="/dogs" />
      </section>

      {/* Alerta: camadas montadas sin registrar el nacimiento */}
      {signals.littersNoBirth.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-800 flex-shrink-0"><AlertTriangle className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-amber-900">
                {signals.littersNoBirth.length === 1 ? t('1 camada sin registrar el nacimiento') : `${signals.littersNoBirth.length} ${t('camadas sin registrar el nacimiento')}`}
              </p>
              <p className="text-[12.5px] text-amber-800 mt-0.5">{t('El parto previsto ya pasó. Registra el nacimiento (o marca preñez fallida).')}</p>
              <ul className="mt-2 space-y-1">
                {signals.littersNoBirth.slice(0, 4).map((l) => (
                  <li key={l.litterId}>
                    <Link href={`/litters/${l.litterId}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-900 hover:underline">
                      {l.label} · {t('parto previsto')} {countdown(-l.overdueDays)} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Reproducción — señales del ciclo */}
      {hasRepro ? (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">{t('Reproducción')}</h2>
            <Link href="/reproduccion" className="text-[13px] font-medium text-body hover:text-ink">{t('Ver calendario →')}</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SignalList icon={Baby} color="#8b5cf6" title={t('Próximos partos')} href="/reproduccion"
              items={signals.upcomingBirths.slice(0, 4).map((b) => ({ main: b.femaleName, meta: `${b.when} · ${countdown(b.daysLeft)}`, strong: b.daysLeft <= 3 }))} empty={t('Sin gestaciones en curso')} />
            <SignalList icon={Flame} color="#ef4444" title={t('En celo')} href="/reproduccion"
              items={signals.inHeat.slice(0, 4).map((h) => ({ main: h.femaleName, meta: t('celo activo — ventana de monta'), strong: true }))} empty={t('Ninguna en celo ahora')} />
            <SignalList icon={Stethoscope} color="#3b82f6" title={t('Confirmar preñez')} href="/reproduccion"
              items={signals.toConfirm.slice(0, 4).map((c) => ({ main: c.femaleName, meta: `${c.overdue ? t('toca ya') : t('a partir del')} ${c.when}`, strong: c.overdue }))} empty={t('Nada pendiente de confirmar')} />
            <SignalList icon={CalendarClock} color="#059669" title={t('Próximos celos')} href="/reproduccion"
              items={signals.upcomingHeats.slice(0, 4).map((h) => ({ main: h.femaleName, meta: `${h.when} · ${countdown(h.daysLeft)}`, strong: false }))} empty={t('Sin celos previstos próximos')} />
          </div>
        </section>
      ) : null}

      {/* Camadas activas */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-ink">{t('Camadas activas')}</h2>
          <Link href="/litters" className="text-[13px] font-medium text-body hover:text-ink">{t('Ver todas →')}</Link>
        </div>
        {activeLitters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline bg-surface-soft px-6 py-12 text-center">
            <Baby className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 text-[14px] text-body">{t('Sin camadas activas. Cuando planifiques o cruces, aparecerán aquí.')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-hairline bg-canvas divide-y divide-hairline-soft">
            {activeLitters.map((l) => (
              <Link key={l.id} href={`/litters/${l.id}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-soft">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#8b5cf6' }}><Baby className="h-4 w-4 text-white" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink truncate">{l.father?.name || '?'} × {l.mother?.name || '?'}</p>
                  <p className="text-[12.5px] text-muted">{l.status === 'mated' ? t('En gestación') : t('Planificada')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Atajos */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/cruces" className="group rounded-xl border border-hairline bg-canvas p-5 transition-all hover:border-ink/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#8b5cf615', color: '#8b5cf6' }}><GitCompareArrows className="h-5 w-5" /></span>
            <ArrowRight className="h-4 w-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="mt-4 text-[16px] font-semibold text-ink">{t('Simulador de cruces')}</h3>
          <p className="mt-1 text-[13px] text-body">{t('Predice genética, morfología y consanguinidad de un cruce.')}</p>
        </Link>
        <Link href="/reproduccion" className="group rounded-xl border border-hairline bg-canvas p-5 transition-all hover:border-ink/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#ec489915', color: '#ec4899' }}><Heart className="h-5 w-5" /></span>
            <ArrowRight className="h-4 w-4 text-muted group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="mt-4 text-[16px] font-semibold text-ink">{t('Calendario reproductivo')}</h3>
          <p className="mt-1 text-[13px] text-body">{t('Registra celos y montas; controla gestaciones y próximos celos.')}</p>
        </Link>
      </section>
    </div>
  )
}

function SignalList({ icon: Icon, color, title, href, items, empty }: {
  icon: React.ElementType; color: string; title: string; href: string
  items: { main: string; meta: string; strong: boolean }[]; empty: string
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}15`, color }}><Icon className="h-4 w-4" /></span>
        <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="px-1 py-2 text-[12.5px] text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-hairline-soft">
          {items.map((it, i) => (
            <li key={i}>
              <Link href={href} className="flex items-center justify-between gap-2 px-1 py-2 hover:opacity-80">
                <span className="text-[13.5px] font-medium text-ink truncate">{it.main}</span>
                <span className={`text-[12px] flex-shrink-0 ${it.strong ? 'font-semibold text-amber-700' : 'text-muted'}`}>{it.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
