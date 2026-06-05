/**
 * /soporte — página unificada de Soporte.
 *
 * Fusiona la antigua lista de /mis-solicitudes con el formulario de soporte
 * en una sola página con dos pestañas:
 *   - ?tab=solicitudes (por defecto) → lista de las solicitudes del user
 *   - ?tab=nueva                     → formulario para abrir un ticket nuevo
 *
 * Ambas pestañas leen/escriben sobre la misma tabla `admin_requests`. El
 * detalle de cada solicitud vive en /soporte/[id]. Las rutas antiguas de
 * /mis-solicitudes redirigen aquí.
 *
 * Server component: lee searchParams para la pestaña activa y hace la query
 * de las solicitudes del user (idéntica a la antigua /mis-solicitudes).
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SupportForm from '@/components/admin-requests/support-form'
import { TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/admin-requests/types'
import {
  LifeBuoy, Inbox, Plus, MessageSquare, Dog, Store, ArrowRight, Sparkles,
} from 'lucide-react'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Soporte',
  description:
    'Tus solicitudes, reclamaciones y soporte humano en un solo sitio. Abre un ticket y un humano del equipo te responderá en menos de 24h en horario laboral.',
  alternates: { canonical: 'https://genealogic.io/soporte' },
  openGraph: {
    title: 'Soporte — Genealogic',
    description: 'Tus solicitudes y soporte humano. Respondemos en menos de 24h.',
    url: 'https://genealogic.io/soporte',
    type: 'website',
    siteName: 'Genealogic',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Genealogic' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soporte — Genealogic',
    description: 'Tus solicitudes y soporte humano.',
    images: ['/opengraph-image'],
  },
}

// Icono por tipo de solicitud (chip tintado).
function iconForType(type: string) {
  if (type === 'claim_dog') return Dog
  if (type === 'claim_kennel') return Store
  if (type === 'feedback') return Sparkles
  return MessageSquare
}

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const t = getTranslator(await getLocale())
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/soporte')

  const tab = sp.tab === 'nueva' ? 'nueva' : 'solicitudes'

  // MISMA query que la antigua /mis-solicitudes: solicitudes del user con
  // relaciones target_dog + target_kennel, orden por created_at desc.
  const { data: requests } = await supabase
    .from('admin_requests')
    .select(`
      id, type, status, subject, created_at, updated_at,
      target_dog:dogs!admin_requests_target_dog_id_fkey(name, slug),
      target_kennel:kennels!admin_requests_target_kennel_id_fkey(name, slug)
    `)
    .eq('requester_user_id', user.id)
    .order('created_at', { ascending: false })

  const count = requests?.length ?? 0

  const tabs: { key: 'solicitudes' | 'nueva'; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'solicitudes', label: t('Mis solicitudes'), icon: Inbox, badge: count || undefined },
    { key: 'nueva', label: t('Nueva solicitud'), icon: Plus },
  ]

  return (
    // Vive dentro del grupo (dashboard): el shell ya aporta sidebar + header
    // + padding. No hace falta wrapper min-h-screen ni link "volver".
    <div className="max-w-3xl space-y-6 sm:space-y-8">
      {/* Header — estilo /settings: eyebrow + h1 + subtítulo */}
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t('Ayuda')}</p>
        <h1 className="mt-1.5 text-[32px] sm:text-[40px] font-semibold leading-[1.1] tracking-[-0.04em] text-ink">
          {t('Soporte')}
        </h1>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-body">
          {t('Tus solicitudes, reporta un problema y recibe ayuda de un humano del equipo.')}
        </p>
      </div>

      {/* Pill tabs — estilo /settings (mobile tabs) */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map(({ key, label, icon: Icon, badge }) => {
          const active = tab === key
          return (
            <Link
              key={key}
              href={`/soporte?tab=${key}`}
              className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                active
                  ? 'bg-ink text-on-primary'
                  : 'border border-hairline bg-canvas text-body hover:bg-surface-soft hover:text-ink'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {typeof badge === 'number' && (
                <span
                  className={`ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-card text-muted'
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* === TAB: MIS SOLICITUDES === */}
      {tab === 'solicitudes' && (
        <div className="space-y-3">
          {count === 0 ? (
            <div className="rounded-2xl border border-dashed border-hairline bg-canvas px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <p className="mt-4 text-[15px] font-semibold text-ink">{t('Aún no tienes solicitudes')}</p>
              <p className="mt-1 text-[13px] text-muted">
                {t('Cuando abras un ticket o reclames un perro o criadero, aparecerá aquí.')}
              </p>
              <Link
                href="/soporte?tab=nueva"
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-on-primary transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> {t('Nueva solicitud')}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {requests!.map((r) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const target = (r as any).target_dog || (r as any).target_kennel
                const TypeIcon = iconForType(r.type)
                return (
                  <li key={r.id}>
                    <Link
                      href={`/soporte/${r.id}`}
                      className="group flex items-start gap-3.5 rounded-2xl border border-hairline bg-canvas p-4 transition-colors hover:bg-surface-soft sm:p-5"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            {TYPE_LABELS[r.type as keyof typeof TYPE_LABELS]}
                          </span>
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[r.status as keyof typeof STATUS_COLORS]}`}>
                            {STATUS_LABELS[r.status as keyof typeof STATUS_LABELS]}
                          </span>
                        </div>
                        <p className="truncate text-[14px] font-semibold text-ink">{r.subject}</p>
                        {target && (
                          <p className="mt-0.5 truncate text-[12px] text-muted">→ {target.name}</p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2 pt-0.5 text-[11px] text-muted">
                        <span>{new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* === TAB: NUEVA SOLICITUD === */}
      {tab === 'nueva' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.03em] text-ink">
                {t('¿En qué te ayudamos?')}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted">
                {t('Escribe tu consulta y un humano del equipo te responderá. Solemos tardar menos de 24h en días laborables.')}
              </p>
            </div>
          </div>

          <SupportForm />

          <p className="text-[12px] text-muted">
            {t('Verás la respuesta en')}{' '}
            <Link href="/soporte?tab=solicitudes" className="font-semibold text-ink hover:underline">
              {t('Mis solicitudes')}
            </Link>
            {t('. También te avisaremos por email.')}
          </p>
        </div>
      )}
    </div>
  )
}
