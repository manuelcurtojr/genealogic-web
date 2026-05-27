/**
 * /admin/kennels/[id] — Vista 360 de un criadero.
 *
 * Concentra todo del kennel: stats (perros, camadas, reservas, reviews,
 * page views 30d), owner, top referrers, reservas recientes, perros
 * recientes, tracking.
 *
 * Usa la RPC `admin_kennel_360` que hace todas las queries server-side
 * en una sola llamada.
 */
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft, Dog, Baby, ShoppingBag, Star, BookOpen, Activity,
  Globe, MapPin, ExternalLink, User as UserIcon,
} from 'lucide-react'
import { pastelByName } from '@/lib/avatars'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Criadero 360 · Admin · Genealogic' }

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d`
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default async function AdminKennel360Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (callerProfile?.role !== 'admin') redirect('/dashboard')

  const { data: snapshot, error } = await supabase.rpc('admin_kennel_360', { p_kennel_id: id })
  if (error || !snapshot) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = snapshot as any
  const kennel = s.kennel
  if (!kennel) notFound()

  const owner = s.owner || null
  const stats = s.stats || {}
  const location = [kennel.city, kennel.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      <Link
        href="/admin/kennels"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a criaderos
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        {kennel.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={kennel.logo_url}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover border border-hairline"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ backgroundColor: pastelByName(kennel.name) }}
          >
            {kennel.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Criadero 360
          </p>
          <h1 className="mt-1 text-[24px] sm:text-[28px] font-semibold tracking-[-0.03em] text-ink leading-tight">
            {kennel.name}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-body">
            {kennel.slug && (
              <Link
                href={`/kennels/${kennel.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-muted hover:text-ink transition"
              >
                /kennels/{kennel.slug} <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            )}
            {kennel.foundation_date && (
              <span>Desde {new Date(kennel.foundation_date).getFullYear()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Owner */}
      {owner && (
        <Section icon={UserIcon} title="Dueño">
          <Link
            href={`/admin/users/${owner.id}`}
            className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas p-3 hover:border-ink/30 transition"
          >
            {owner.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={owner.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: pastelByName(owner.display_name || owner.email) }}
              >
                {(owner.display_name || owner.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink truncate">{owner.display_name || 'Sin nombre'}</p>
              <p className="text-[11px] text-muted truncate">{owner.email} · plan {owner.plan || 'free'}</p>
            </div>
            <span className="text-[11px] text-muted">Ver 360 →</span>
          </Link>
        </Section>
      )}

      {/* Stats grid */}
      <Section icon={Activity} title="Métricas">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Dog} label="Perros" value={stats.dogs} accent="text-blue-600" />
          <StatCard icon={Dog} label="En venta" value={stats.dogs_for_sale} accent="text-emerald-600" />
          <StatCard icon={Dog} label="Reproductores" value={stats.dogs_reproductive} accent="text-pink-600" />
          <StatCard icon={Baby} label="Camadas" value={stats.litters} accent="text-purple-600" />
          <StatCard icon={ShoppingBag} label="Reservas" value={stats.reservations_total} accent="text-amber-600" />
          <StatCard icon={ShoppingBag} label="Abiertas" value={stats.reservations_open} accent="text-rose-600" />
          <StatCard icon={Star} label="Reseñas visibles" value={`${stats.reviews_visible || 0}/${stats.reviews_total || 0}`} accent="text-yellow-600" />
          <StatCard icon={BookOpen} label="Posts pub." value={stats.posts_published} accent="text-indigo-600" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatCard icon={Activity} label="Page views 30d" value={(stats.page_views_30d || 0).toLocaleString('es-ES')} accent="text-ink" />
          <StatCard icon={UserIcon} label="Sesiones únicas 30d" value={(stats.page_views_unique_sessions_30d || 0).toLocaleString('es-ES')} accent="text-ink" />
        </div>
      </Section>

      {/* Top referrers */}
      {Array.isArray(s.top_referrers_30d) && s.top_referrers_30d.length > 0 && (
        <Section icon={Globe} title="Top referrers (30d)">
          <ul className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.top_referrers_30d.map((r: any, i: number) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-surface-soft px-3 py-2 text-[12.5px]">
                <span className="truncate flex-1 text-body" title={r.referrer}>{r.referrer || '(directo)'}</span>
                <span className="ml-2 inline-flex items-center rounded-full bg-surface-card px-2 py-0.5 text-[11px] font-medium tabular-nums text-ink">
                  {r.count.toLocaleString('es-ES')}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Reservations */}
      {Array.isArray(s.recent_reservations) && s.recent_reservations.length > 0 && (
        <Section icon={ShoppingBag} title={`Reservas recientes (${s.recent_reservations.length})`}>
          <ul className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.recent_reservations.map((r: any) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-soft px-3 py-2 text-[12px]">
                <span className="font-mono text-[11px] text-muted">{r.id.slice(0, 8)}…</span>
                <span className="flex-1 truncate text-body">{r.applicant_email || '—'}</span>
                <span className="inline-flex items-center rounded-full bg-surface-card px-2 py-0.5 text-[10.5px] font-medium text-ink">{r.status}</span>
                <span className="text-muted text-[10.5px]">{relativeTime(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Dogs recientes */}
      {Array.isArray(s.recent_dogs) && s.recent_dogs.length > 0 && (
        <Section icon={Dog} title="Perros recientes">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.recent_dogs.map((d: any) => (
              <Link
                key={d.id}
                href={`/dogs/${d.slug || d.id}`}
                target="_blank"
                className="group flex items-center gap-2 rounded-lg border border-hairline bg-canvas p-2 hover:border-ink/30 transition"
              >
                {d.thumbnail_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={d.thumbnail_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-surface-card flex items-center justify-center text-[10px] text-muted">
                    {d.sex === 'male' ? '♂' : d.sex === 'female' ? '♀' : '?'}
                  </div>
                )}
                <span className="text-[12px] font-medium text-ink truncate flex-1">{d.name}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Page views recientes */}
      {Array.isArray(s.recent_page_views) && s.recent_page_views.length > 0 && (
        <Section icon={Activity} title="Páginas visitadas (recientes)">
          <ul className="space-y-0.5 text-[11.5px]">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.recent_page_views.map((pv: any, i: number) => (
              <li key={i} className="flex items-center gap-2 px-2 py-1 text-body">
                <code className="flex-1 truncate font-mono text-[11px]">{pv.path}</code>
                {pv.referrer && <span className="text-muted text-[10.5px] truncate max-w-[120px]" title={pv.referrer}>{pv.referrer}</span>}
                {pv.country && <span className="text-muted text-[10.5px]">{pv.country}</span>}
                {pv.device && <span className="text-muted text-[10.5px]">{pv.device}</span>}
                <span className="text-muted text-[10.5px]">{relativeTime(pv.created_at)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-hairline bg-canvas p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-ink" />
        <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'text-ink',
}: {
  icon: React.ElementType
  label: string
  value: number | string | undefined | null
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-hairline bg-canvas p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</span>
      </div>
      <p className={`mt-2 text-[20px] font-semibold tabular-nums tracking-[-0.03em] ${accent} leading-none`}>
        {value ?? 0}
      </p>
    </div>
  )
}
