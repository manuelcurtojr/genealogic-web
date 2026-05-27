/**
 * /admin/users/[id] — Vista 360 de un usuario.
 *
 * Concentra TODO sobre el user en una sola pantalla: perfil, kennels,
 * reservas, emails enviados, tickets, page views recientes, signup meta.
 *
 * Usa la RPC `admin_user_360` que hace todas las queries server-side y
 * devuelve un solo JSON. Más rápido que N queries cliente.
 *
 * Solo admins.
 */
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft, Mail, MessageSquare, Activity, Store, ShoppingBag,
  Globe, Calendar, FileText,
} from 'lucide-react'
import { pastelByName } from '@/lib/avatars'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Usuario 360 · Admin · Genealogic' }

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

export default async function AdminUser360Page({
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

  // Llamada a la RPC que trae todo en un JSON
  const { data: snapshot, error } = await supabase.rpc('admin_user_360', { p_user_id: id })
  if (error || !snapshot) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = snapshot as any
  const profile = s.profile || null
  if (!profile) notFound()

  const signupMeta = profile.signup_meta || {}
  const sourceLabel = signupMeta.utm_source
    ? `${signupMeta.utm_source}${signupMeta.utm_medium ? ` · ${signupMeta.utm_medium}` : ''}`
    : signupMeta.referrer
      ? 'Referrer'
      : 'Directo'

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a usuarios
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover border border-hairline"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ backgroundColor: pastelByName(profile.display_name || profile.email) }}
          >
            {(profile.display_name || profile.email || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Usuario 360 · {profile.role}
          </p>
          <h1 className="mt-1 text-[24px] sm:text-[28px] font-semibold tracking-[-0.03em] text-ink leading-tight">
            {profile.display_name || 'Sin nombre'}
          </h1>
          <p className="mt-0.5 text-[13px] text-body">{profile.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="inline-flex items-center rounded-full bg-surface-card px-2 py-0.5 font-medium text-ink">
              Plan: {profile.plan || 'free'}
            </span>
            {profile.status && profile.status !== 'active' && (
              <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 font-semibold">
                {profile.status}
              </span>
            )}
            {profile.country && (
              <span className="inline-flex items-center rounded-full bg-surface-card px-2 py-0.5 text-body">
                📍 {[profile.city, profile.country].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-surface-card px-2 py-0.5 text-muted">
              Desde {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Signup attribution */}
      <Section icon={Globe} title="Cómo llegó">
        {Object.keys(signupMeta).length === 0 ? (
          <p className="text-[13px] text-muted">Sin datos de attribution (registrado antes del tracking).</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12.5px]">
            <Field label="Fuente" value={sourceLabel} />
            {signupMeta.utm_campaign && <Field label="Campaña" value={signupMeta.utm_campaign} />}
            {signupMeta.referrer && <Field label="Referrer" value={signupMeta.referrer} truncate />}
            {signupMeta.landing_page && <Field label="Landing" value={signupMeta.landing_page} truncate />}
            {signupMeta.signup_device && <Field label="Dispositivo" value={signupMeta.signup_device} />}
            {signupMeta.signup_at && <Field label="Fecha signup" value={new Date(signupMeta.signup_at).toLocaleDateString('es-ES')} />}
          </div>
        )}
      </Section>

      {/* Kennels */}
      {Array.isArray(s.kennels) && s.kennels.length > 0 && (
        <Section icon={Store} title={`Criaderos (${s.kennels.length})`}>
          <ul className="space-y-1.5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.kennels.map((k: any) => (
              <li key={k.id}>
                <Link
                  href={`/kennels/${k.slug || k.id}`}
                  className="block rounded-lg border border-hairline bg-canvas px-3 py-2 hover:border-ink/30 transition"
                >
                  <p className="text-[13px] font-semibold text-ink">{k.name}</p>
                  <p className="text-[11px] text-muted">Creado {new Date(k.created_at).toLocaleDateString('es-ES')}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Reservations */}
      {Array.isArray(s.reservations) && s.reservations.length > 0 && (
        <Section icon={ShoppingBag} title={`Reservas (${s.reservations.length})`}>
          <ul className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.reservations.map((r: any) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg bg-surface-soft px-3 py-2 text-[12.5px]">
                <span className="text-body">{r.id.slice(0, 8)}…</span>
                <span className="inline-flex items-center rounded-full bg-surface-card px-2 py-0.5 text-[11px] font-medium text-ink">{r.status}</span>
                <span className="text-muted text-[11px]">{relativeTime(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Emails */}
      <Section icon={Mail} title={`Emails enviados (${(s.recent_emails || []).length})`}>
        {(s.recent_emails || []).length === 0 ? (
          <p className="text-[13px] text-muted">Sin emails registrados.</p>
        ) : (
          <ul className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.recent_emails.map((e: any) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-soft px-3 py-1.5 text-[12px]">
                <span className="font-mono text-[11px] text-muted">{e.template}</span>
                <span className="flex-1 truncate text-body">{e.subject}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                  e.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                  e.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                  e.status === 'skipped' ? 'bg-gray-100 text-gray-600' :
                  'bg-surface-card text-ink'
                }`}>{e.status}</span>
                <span className="text-muted text-[10.5px]">{relativeTime(e.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Support requests */}
      {Array.isArray(s.recent_requests) && s.recent_requests.length > 0 && (
        <Section icon={MessageSquare} title={`Tickets / Claims (${s.recent_requests.length})`}>
          <ul className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {s.recent_requests.map((r: any) => (
              <li key={r.id}>
                <Link
                  href={`/admin/solicitudes/${r.id}`}
                  className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2 hover:border-ink/30 transition text-[12.5px]"
                >
                  <span className="inline-flex items-center rounded-full bg-surface-card px-2 py-0.5 text-[10.5px] font-medium text-ink">{r.type}</span>
                  <span className="flex-1 truncate font-medium text-ink">{r.subject || '(sin asunto)'}</span>
                  <span className="text-muted text-[11px]">{r.status}</span>
                  <span className="text-muted text-[10.5px]">{relativeTime(r.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Page views */}
      <Section icon={Activity} title={`Páginas visitadas (${(s.recent_page_views || []).length})`}>
        {(s.recent_page_views || []).length === 0 ? (
          <p className="text-[13px] text-muted">Sin tracking de navegación (usuario antiguo o navegación 100% en dashboard).</p>
        ) : (
          <ul className="space-y-0.5 text-[11.5px]">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(s.recent_page_views as any[]).slice(0, 25).map((pv, i) => (
              <li key={i} className="flex items-center gap-2 px-2 py-1 text-body">
                <code className="flex-1 truncate font-mono text-[11px]">{pv.path}</code>
                {pv.country && <span className="text-muted text-[10.5px]">{pv.country}</span>}
                {pv.device && <span className="text-muted text-[10.5px]">{pv.device}</span>}
                <span className="text-muted text-[10.5px]">{relativeTime(pv.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Notas admin */}
      {profile.admin_notes && (
        <Section icon={FileText} title="Notas internas del admin">
          <p className="text-[13px] text-body whitespace-pre-wrap">{profile.admin_notes}</p>
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

function Field({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</p>
      <p className={`mt-0.5 text-[12.5px] text-ink ${truncate ? 'truncate' : ''}`} title={truncate ? value : undefined}>
        {value}
      </p>
    </div>
  )
}
