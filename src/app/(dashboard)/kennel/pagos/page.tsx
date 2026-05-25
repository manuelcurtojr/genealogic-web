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
import Link from 'next/link'
import { isStripeConfigured } from '@/lib/stripe/server'
import { startStripeOnboardingAction, syncStripeStatusAction } from './actions'
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { isEarlyAccessKennel } from '@/lib/early-access'
import ComingSoon from '@/components/early-access/coming-soon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Pagos · Mi criadero · Genealogic' }

export default async function KennelPagosPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createKennelAdminClient() as any
  const { data: kennel } = await admin
    .from('kennels')
    .select('id, name, slug, stripe_account_id, stripe_account_status')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Gate Early Access: solo el kennel del fundador (Irema) ve la página real.
  // El resto ve placeholder "Próximamente" hasta que activemos Stripe Connect
  // globalmente con metered billing y onboarding pulido.
  if (!isEarlyAccessKennel(kennel?.id)) {
    return <ComingSoon featureId="stripe_payments" backHref="/kennel" backLabel="← Volver a Mi criadero" />
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
        ← Mi criadero
      </Link>

      <h1 className="text-3xl font-bold tracking-tight text-ink">Pagos online</h1>
      <p className="mt-2 text-body max-w-2xl">
        Conecta Stripe para cobrar online a tus clientes con tarjeta. El dinero llega
        directamente a tu cuenta bancaria (no pasa por Genealogic). Cumple PSD2, SEPA y
        normativa europea.
      </p>

      {!stripeReady && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Stripe no disponible</p>
            <p className="text-amber-800 mt-0.5">
              El equipo de Genealogic aún no ha configurado Stripe Connect en producción.
              Mientras tanto, puedes crear pagos y marcarlos como pagados manualmente
              (transferencia bancaria, efectivo) desde el panel de cada reserva.
            </p>
          </div>
        </div>
      )}

      {stripeReady && (
        <section className="mt-8 rounded-2xl border border-hairline bg-canvas p-6">
          <h2 className="text-lg font-bold text-ink mb-1">Estado de tu cuenta Stripe</h2>
          <StatusDisplay status={status} accountId={kennel?.stripe_account_id} />
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-hairline bg-canvas p-6">
        <h2 className="text-base font-bold text-ink mb-3">Cómo funciona</h2>
        <ol className="space-y-2 text-sm text-body list-decimal list-inside">
          <li>Conectas Stripe (5-10 min de onboarding, una vez)</li>
          <li>Creas pagos en cada reserva del cliente (señal, pago intermedio, final)</li>
          <li>El cliente paga online desde su panel <code>/mis-reservas</code></li>
          <li>El dinero llega a tu cuenta bancaria en 1-7 días (depende del banco)</li>
          <li>Sin Stripe puedes seguir creando pagos y marcándolos como pagados manualmente</li>
        </ol>
      </section>
    </div>
  )
}

function StatusDisplay({
  status,
  accountId,
}: {
  status: string
  accountId: string | null | undefined
}) {
  if (status === 'active') {
    return (
      <div>
        <p className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          Cuenta activa — listo para cobrar
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
            Abrir dashboard Stripe
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
              Sincronizar estado
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (status === 'restricted') {
    return (
      <div>
        <p className="text-amber-800 font-semibold mb-2">⚠️ Stripe ha restringido tu cuenta</p>
        <p className="text-sm text-body mb-3">
          Stripe necesita información adicional para mantener tu cuenta activa.
          Revisa el dashboard de Stripe para ver qué falta.
        </p>
        <form action={startStripeOnboardingAction}>
          <button
            type="submit"
            className="rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90"
          >
            Continuar onboarding
          </button>
        </form>
      </div>
    )
  }

  if (status === 'onboarding') {
    return (
      <div>
        <p className="text-amber-800 font-semibold mb-2">Onboarding sin completar</p>
        <p className="text-sm text-body mb-3">
          Empezaste a conectar Stripe pero falta completar el formulario. Termina el
          proceso para poder cobrar online.
        </p>
        <div className="flex gap-2">
          <form action={startStripeOnboardingAction}>
            <button
              type="submit"
              className="rounded-lg bg-ink text-on-primary px-5 py-2.5 text-sm font-semibold hover:opacity-90"
            >
              Continuar onboarding →
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
              Sincronizar estado
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
        Conecta una cuenta Stripe Express (5-10 min) para empezar a cobrar online.
      </p>
      <form action={startStripeOnboardingAction}>
        <button
          type="submit"
          className="rounded-lg bg-[#635bff] text-white px-6 py-3 text-sm font-bold hover:opacity-90"
        >
          Conectar con Stripe →
        </button>
      </form>
    </div>
  )
}
