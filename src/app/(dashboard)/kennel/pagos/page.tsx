/**
 * Configuración de pagos del kennel — Stripe Connect.
 *
 * Estados visibles:
 *  - Sin Stripe configurado en el servidor: aviso "Pagos online no disponibles"
 *  - none: nunca conectó. Botón "Conectar Stripe"
 *  - onboarding: lo abrió pero no completó. Botón "Continuar onboarding" + "Sincronizar estado"
 *  - active: ✓ verde + datos básicos
 *  - restricted: aviso amarillo "Stripe requiere acción"
 *
 * El usuario completa onboarding en stripe.com y vuelve a /kennel/pagos.
 * Al volver, sync automático del status (Account Link no llama webhook,
 * así que sincronizamos manualmente o esperamos a account.updated).
 */
import { createClient, createKennelAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isIosUserAgent } from '@/lib/platform'
import Link from 'next/link'
import { isStripeConfigured } from '@/lib/stripe/server'
import { startStripeOnboardingAction, syncStripeStatusAction } from './actions'
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { hasProFeatures, normalizePlan, isEnterpriseUser } from '@/lib/permissions'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagos · Mi criadero · Genealogic' }

export default async function KennelPagosPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string }>
}) {
  // App Store 3.1.1 — Stripe Connect onboarding/cobros nunca desde el WebView iOS.
  const h = await headers()
  if (isIosUserAgent(h.get('user-agent'))) redirect('/dashboard')
  const sp = await searchParams
  const t = getTranslator(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const [{ data: kennel }, { data: profile }] = await Promise.all([
    admin.from('kennels')
      .select('id, name, slug, stripe_account_id, stripe_account_status')
      .eq('owner_id', user.id).maybeSingle(),
    supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
  ])

  // Pagos online (Stripe Connect) — feature de Kennel Pro desde el go-live
  // 2026-07-09 (se vende como highlight del plan). Free ve el upsell a Pro.
  if (!hasProFeatures(normalizePlan(profile?.plan)) && !isEnterpriseUser(user.id)) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-2xl border-2 border-dashed border-hairline bg-canvas p-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 text-[#FE6620] px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
            {t('Kennel Pro')}
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{t('Pagos online (Stripe)')}</h1>
          <p className="mt-3 text-body max-w-md mx-auto">
            {t('Cobra señas, pagos parciales y entregas a tus clientes con tarjeta, directo a tu IBAN. Incluido en Kennel Pro — pruébalo 14 días gratis, sin tarjeta.')}
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#FE6620] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {t('Prueba Kennel Pro 14 días gratis')}
          </Link>
        </div>
      </div>
    )
  }

  // Si vuelven del onboarding (?refresh=1), sincronizamos status
  if (sp.refresh && kennel?.stripe_account_id) {
    await syncStripeStatusAction()
    redirect('/kennel/pagos')
  }

  const stripeReady = isStripeConfigured()
  const status = kennel?.stripe_account_status ?? 'none'

  return (
    <div className="max-w-3xl">
      <Link
        href="/kennel"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink mb-5"
      >
        ← {t('Mi criadero')}
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-ink">{t('Pagos online')}</h1>
      <p className="mt-2 text-body max-w-2xl">
        {t('Conecta Stripe para cobrar online a tus clientes con tarjeta. El dinero llega directamente a tu cuenta bancaria (no pasa por Genealogic). Cumple PSD2, SEPA y normativa europea.')}
      </p>

      {!stripeReady && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">{t('Stripe no disponible')}</p>
            <p className="text-amber-800 mt-0.5">
              {t('El equipo de Genealogic aún no ha configurado Stripe Connect en producción. Mientras tanto, puedes crear pagos y marcarlos como pagados manualmente (transferencia bancaria, efectivo) desde el panel de cada reserva.')}
            </p>
          </div>
        </div>
      )}

      {stripeReady && (
        <section className="mt-8 rounded-2xl border border-hairline bg-canvas p-6">
          <h2 className="text-lg font-bold text-ink mb-1">{t('Estado de tu cuenta Stripe')}</h2>
          <StatusDisplay status={status} accountId={kennel?.stripe_account_id} t={t} />
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-hairline bg-canvas p-6">
        <h2 className="text-base font-bold text-ink mb-3">{t('Cómo funciona')}</h2>
        <ol className="space-y-2 text-sm text-body list-decimal list-inside">
          <li>{t('Conectas Stripe (5-10 min de onboarding, una vez)')}</li>
          <li>{t('Creas pagos en cada reserva del cliente (señal, pago intermedio, final)')}</li>
          <li>{t('El cliente paga online desde su panel')} <code>/mis-reservas</code></li>
          <li>{t('El dinero llega a tu cuenta bancaria en 1-7 días (depende del banco)')}</li>
          <li>{t('Sin Stripe puedes seguir creando pagos y marcándolos como pagados manualmente')}</li>
        </ol>
      </section>
    </div>
  )
}

function StatusDisplay({
  status,
  accountId,
  t,
}: {
  status: string
  accountId: string | null | undefined
  t: (key: string) => string
}) {
  if (status === 'active') {
    return (
      <div>
        <p className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          {t('Cuenta activa — listo para cobrar')}
        </p>
        <p className="mt-1 text-[11px] text-muted font-mono">acct: {accountId}</p>
        <div className="mt-4 flex gap-2">
          <a
            href={`https://dashboard.stripe.com/${accountId}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('Abrir dashboard Stripe')}
          </a>
          <form
            action={async () => {
              'use server'
              const { syncStripeStatusAction } = await import('./actions')
              await syncStripeStatusAction()
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-hairline px-4 py-2 text-xs font-semibold text-body hover:border-ink/30 hover:text-ink"
            >
              {t('Sincronizar estado')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (status === 'restricted') {
    return (
      <div>
        <p className="text-amber-800 font-semibold mb-2">⚠️ {t('Stripe ha restringido tu cuenta')}</p>
        <p className="text-sm text-body mb-3">
          {t('Stripe necesita información adicional para mantener tu cuenta activa. Revisa el dashboard de Stripe para ver qué falta.')}
        </p>
        <form action={startStripeOnboardingAction}>
          <button
            type="submit"
            className="rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90"
          >
            {t('Continuar onboarding')}
          </button>
        </form>
      </div>
    )
  }

  if (status === 'onboarding') {
    return (
      <div>
        <p className="text-amber-800 font-semibold mb-2">{t('Onboarding sin completar')}</p>
        <p className="text-sm text-body mb-3">
          {t('Empezaste a conectar Stripe pero falta completar el formulario. Termina el proceso para poder cobrar online.')}
        </p>
        <div className="flex gap-2">
          <form action={startStripeOnboardingAction}>
            <button
              type="submit"
              className="rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              {t('Continuar onboarding')} →
            </button>
          </form>
          <form
            action={async () => {
              'use server'
              const { syncStripeStatusAction } = await import('./actions')
              await syncStripeStatusAction()
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-hairline px-5 py-2.5 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
            >
              {t('Sincronizar estado')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // none
  return (
    <div>
      <p className="text-body mb-4">
        {t('Conecta una cuenta Stripe Express (5-10 min) para empezar a cobrar online.')}
      </p>
      <form action={startStripeOnboardingAction}>
        <button
          type="submit"
          className="rounded-lg bg-[#635bff] text-white px-6 py-3 text-sm font-bold hover:opacity-90"
        >
          {t('Conectar con Stripe')} →
        </button>
      </form>
    </div>
  )
}
