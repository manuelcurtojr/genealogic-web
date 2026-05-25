import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Check, ArrowUpRight, Clock, MailIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPlanLabel } from '@/lib/permissions'
import { isSubscriptionCheckoutAvailable } from '@/lib/stripe/server'

export const metadata = { title: 'Suscripción · Genealogic Pro' }

export default async function SuscripcionPage({
  searchParams,
}: { searchParams: Promise<{ activate?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_is_founder, plan_started_at, plan_expires_at')
    .eq('id', user.id)
    .single()

  const plan = (profile as any)?.plan || 'free'
  const isFounder = Boolean((profile as any)?.plan_is_founder)
  const startedAt = (profile as any)?.plan_started_at
  const startedDate = startedAt ? new Date(startedAt) : null

  // Si llega ?activate=pro|premium tras crear kennel, mostrar pantalla
  // dedicada "activa tu plan" antes que el detalle normal.
  const activatePlan = (sp.activate === 'pro' || sp.activate === 'premium')
    ? sp.activate
    : null
  // Solo mostrar pantalla "activate" si todavía está en plan free
  // (si ya está en Pro/Premium, no tiene sentido)
  const showActivate = activatePlan && plan === 'free'

  const proIncluded = [
    'Pipeline de reservas (vistas Ventas/Clientes + filtros)',
    'Hub de Contactos (suscriptores + leads + clientes)',
    'Mini-sitio del criador con custom domain',
    'Biblioteca de conocimiento',
    'Emailbot con tu Biblioteca como contexto',
    'Newsletter (gestión de suscriptores)',
    'Estadísticas del perfil público',
    'Soporte por email',
  ]

  const premiumExtras = [
    'Todo lo del plan Pro',
    'Multi-kennel (varios afijos en una misma cuenta)',
    'API B2B para integraciones',
    '5 verificaciones oficiales /mes incluidas',
    'Featured listing incluido',
    'Soporte prioritario',
  ]

  // Pantalla "Activa tu plan" — usuario recién registrado con plan elegido
  if (showActivate) {
    return <ActivatePlanScreen plan={activatePlan!} />
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Suscripción</h1>
        <p className="text-sm text-muted mt-0.5">Gestión de tu plan y próximos pasos.</p>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl border border-ink bg-canvas p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink text-on-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
          <Sparkles className="w-3 h-3" />
          Activa
        </div>
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">Plan actual</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-3xl font-bold text-ink">Genealogic {getPlanLabel(plan)}</h2>
            {isFounder && (
              <span className="inline-flex items-center rounded-full bg-surface-card border border-hairline px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
                Founder · 39€/mes para siempre
              </span>
            )}
          </div>
        </div>

        {startedDate && (
          <p className="text-sm text-body mb-4">
            Activo desde el <strong>{startedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            {isFounder && ' Como Founder mantienes el precio original mientras la cuenta esté activa.'}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-6">
          {proIncluded.map(f => (
            <div key={f} className="flex items-start gap-2 text-sm text-body">
              <Check className="w-4 h-4 mt-0.5 text-ink flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing CTA */}
      <div className="rounded-xl border border-hairline bg-surface-card p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <p className="text-sm font-semibold text-ink mb-1">Facturación</p>
            <p className="text-sm text-body">
              Tu facturación con Stripe llega en la próxima fase: ahí verás historial de pagos,
              método de pago y datos fiscales. Por ahora, si necesitas algo factúrame escríbeme a{' '}
              <a href="mailto:hola@genealogic.io" className="text-ink underline">hola@genealogic.io</a>.
            </p>
          </div>
          <Button variant="secondary" size="sm" href="/cuenta/facturacion">
            Facturación
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Premium upsell */}
      {plan !== 'premium' && (
        <div className="rounded-2xl border border-hairline bg-canvas p-6 lg:p-8">
          <div className="flex items-baseline gap-3 mb-1 flex-wrap">
            <h3 className="text-lg font-bold text-ink">Genealogic Premium</h3>
            <span className="text-xl font-bold text-ink">149€<span className="text-sm text-muted font-normal">/mes</span></span>
          </div>
          <p className="text-sm text-body mb-5">
            Para criaderos grandes, multi-afijo, con necesidad de API y verificaciones oficiales mensuales.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
            {premiumExtras.map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-body">
                <Check className="w-4 h-4 mt-0.5 text-ink flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Button
            variant="primary" size="md"
            href="mailto:hola@genealogic.io?subject=Upgrade%20a%20Premium"
          >
            Hablar con nosotros para Premium
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Pantalla "Activa tu plan" ──────────────────────────────────────────────
// Se muestra cuando el user llega con ?activate=pro|premium tras crear su
// kennel desde el flujo de signup (pricing → register → kennel/new).
//
// Comportamiento:
//   - Si Stripe Checkout está disponible en el server (STRIPE_SECRET_KEY +
//     productos configurados): botón "Pagar y activar" → Checkout Session.
//   - Si NO está disponible (situación actual hasta que setup Stripe Subscriptions
//     en producción): pantalla "Lista de espera" + CTA emailto + botón
//     "Empezar gratis mientras tanto" → /dashboard.
//
// Esto permite que el flujo TENGA SENTIDO end-to-end sin Stripe activado:
// el user crea cuenta → crea kennel → ve "te avisamos cuando activamos Pro"
// → usa Free mientras tanto. Sin pantallas rotas, sin promesas vacías.

function ActivatePlanScreen({ plan }: { plan: 'pro' | 'premium' }) {
  const checkoutReady = isSubscriptionCheckoutAvailable()
  const planLabel = plan === 'pro' ? 'Pro' : 'Premium'
  const planPrice = plan === 'pro' ? '39€/mes' : '149€/mes'

  return (
    <div className="max-w-xl mx-auto py-8">
      {/* Header con celebración */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
          <Check className="w-6 h-6 text-emerald-700" strokeWidth={3} />
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          Criadero creado ✓
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink tracking-tight">
          Activa Genealogic {planLabel}
        </h1>
        <p className="mt-3 text-body">
          Tu criadero está creado. Falta un último paso para activar tu plan.
        </p>
      </div>

      {checkoutReady ? (
        <CheckoutCard plan={plan} planLabel={planLabel} planPrice={planPrice} />
      ) : (
        <WaitlistCard plan={plan} planLabel={planLabel} planPrice={planPrice} />
      )}

      <p className="mt-6 text-center text-xs text-muted">
        ¿Cambiaste de idea?{' '}
        <a href="/dashboard" className="underline text-ink">
          Ir al dashboard
        </a>
      </p>
    </div>
  )
}

function CheckoutCard({
  plan, planLabel, planPrice,
}: { plan: string; planLabel: string; planPrice: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-canvas p-6">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Plan elegido</p>
          <p className="text-xl font-bold text-ink">Genealogic {planLabel}</p>
        </div>
        <p className="text-2xl font-bold text-ink">{planPrice}</p>
      </div>
      <p className="text-sm text-body mb-5">
        Pago seguro con Stripe. Cancela cuando quieras. La primera factura llega tras
        el primer pago confirmado.
      </p>
      <Button
        href={`/api/checkout/start?plan=${plan}`}
        variant="primary"
        size="md"
        className="w-full"
      >
        Pagar y activar {planLabel}
        <ArrowUpRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

function WaitlistCard({
  plan, planLabel, planPrice,
}: { plan: string; planLabel: string; planPrice: string }) {
  return (
    <>
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 mb-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 mb-1">
              {planLabel} a {planPrice} — abriendo gradualmente
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">
              Estamos abriendo Genealogic {planLabel} por tandas para asegurar buen
              soporte a cada nuevo criador. Te avisamos en cuanto tu cuenta esté lista
              (suele ser cuestión de días).
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-canvas p-5 mb-4">
        <p className="text-sm font-semibold text-ink mb-3">¿Quieres saltarte la cola?</p>
        <p className="text-sm text-body mb-4">
          Escríbenos y activamos tu cuenta {planLabel} en menos de 24h con el precio
          Founder (39€/mes para siempre si entras antes del lanzamiento público).
        </p>
        <Button
          href={`mailto:hola@genealogic.io?subject=Activar%20${planLabel}%20-%20Founder&body=Hola,%20acabo%20de%20crear%20mi%20criadero%20en%20Genealogic%20y%20quiero%20activar%20el%20plan%20${planLabel}.%20Mi%20email%20es:%20`}
          variant="primary"
          size="md"
          className="w-full"
        >
          <MailIcon className="w-4 h-4" />
          Pedir activación {planLabel}
        </Button>
      </div>

      <a
        href="/dashboard"
        className="block text-center rounded-xl border border-hairline bg-canvas px-5 py-3 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
      >
        Empezar en Free mientras tanto →
      </a>
    </>
  )
}
