import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Sparkles, Check, ArrowUpRight, Clock, MailIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPlanLabel } from '@/lib/permissions'
import { isSubscriptionCheckoutAvailable } from '@/lib/stripe/server'
import { isIosFromCookieStore } from '@/lib/platform'

export const metadata = { title: 'Suscripción · Genealogic Pro' }

export default async function SuscripcionPage({
  searchParams,
}: { searchParams: Promise<{ activate?: string }> }) {
  // App Store 3.1.1 — esta ruta no debe ser accesible desde el WebView iOS.
  if (isIosFromCookieStore(await cookies())) redirect('/dashboard')
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_is_founder, plan_started_at, plan_expires_at, stripe_subscription_status, trial_started_at, trial_ends_at')
    .eq('id', user.id)
    .single()

  const plan = (profile as any)?.plan || 'free'
  const isFounder = Boolean((profile as any)?.plan_is_founder)
  const startedAt = (profile as any)?.plan_started_at
  const startedDate = startedAt ? new Date(startedAt) : null
  const subStatus = (profile as any)?.stripe_subscription_status as string | null
  const trialEndsAt = (profile as any)?.trial_ends_at as string | null
  const trialEndsDate = trialEndsAt ? new Date(trialEndsAt) : null
  const isInTrial = subStatus === 'trialing' && trialEndsDate && trialEndsDate.getTime() > Date.now()
  const trialDaysLeft = isInTrial && trialEndsDate
    ? Math.ceil((trialEndsDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  // Si llega ?activate=kennel|kennel_pro tras crear kennel, mostrar pantalla
  // dedicada "activa tu plan" antes que el detalle normal. Aceptamos los
  // nombres legacy pro/premium y los mapeamos.
  const rawActivate = sp.activate
  const activatePlan: 'kennel' | 'kennel_pro' | null =
    rawActivate === 'kennel_pro' || rawActivate === 'premium' ? 'kennel_pro' :
    rawActivate === 'kennel' || rawActivate === 'pro' ? 'kennel' :
    null
  // Solo mostrar pantalla "activate" si todavía está en plan free
  // (si ya está en Kennel/Kennel Pro, no tiene sentido)
  const showActivate = activatePlan && plan === 'free'

  // Features del plan Kennel (29€)
  const kennelIncluded = [
    'Perros y camadas ilimitadas',
    'Pipeline de reservas (vistas Ventas/Clientes + filtros)',
    'Contratos digitales con firma electrónica',
    'Pagos a plazos para clientes',
    'Calendario veterinario + recordatorios automáticos',
    'Importador IA de pedigrees (sin límite)',
    'Hub de Contactos (suscriptores + leads + clientes)',
    'Estadísticas del perfil público',
    'Soporte por email',
  ]

  // Features adicionales del plan Kennel Pro (49€ Founder · Próximamente)
  const kennelProExtras = [
    'Todo lo del plan Kennel',
    'Web pública del criadero con dominio propio',
    'Emailbot multi-modelo (Claude / GPT / Gemini)',
    'Newsletter a tu lista de suscriptores',
    'Pagos online integrados con tarjeta',
    'Precio Founder de 49€/mes congelado de por vida',
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
        <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
          isInTrial
            ? 'bg-amber-500 text-white'
            : subStatus === 'past_due'
              ? 'bg-red-500 text-white'
              : 'bg-ink text-on-primary'
        }`}>
          <Sparkles className="w-3 h-3" />
          {isInTrial ? 'En prueba' : subStatus === 'past_due' ? 'Pago pendiente' : 'Activa'}
        </div>
        <div className="mb-4 pr-20 sm:pr-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">Plan actual</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink break-words">Genealogic {getPlanLabel(plan)}</h2>
            {isFounder && (
              <span className="inline-flex items-center rounded-full bg-surface-card border border-hairline px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
                Founder · 49€/mes para siempre
              </span>
            )}
          </div>
        </div>

        {/* Banda de trial: días restantes + fecha de primer cargo */}
        {isInTrial && trialEndsDate && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              Te quedan <strong>{trialDaysLeft} día{trialDaysLeft === 1 ? '' : 's'}</strong> de prueba gratis.
            </p>
            <p className="mt-1 text-[13px] text-amber-900/90">
              El primer cargo se hará automáticamente el{' '}
              <strong>{trialEndsDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{' '}
              en la tarjeta que registraste. Puedes cancelar antes desde el botón "Facturación" sin coste.
            </p>
          </div>
        )}

        {/* Aviso pago fallido — Stripe sigue reintentando */}
        {subStatus === 'past_due' && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">No hemos podido cobrar tu última factura.</p>
            <p className="mt-1 text-[13px] text-red-900/90">
              Stripe reintentará automáticamente las próximas horas. Revisa o cambia tu método
              de pago desde "Facturación" para evitar perder el acceso a tu plan.
            </p>
          </div>
        )}

        {startedDate && !isInTrial && (
          <p className="text-sm text-body mb-4">
            Activo desde el <strong>{startedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            {isFounder && ' Como Founder mantienes el precio original mientras la cuenta esté activa.'}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-6">
          {kennelIncluded.map(f => (
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

      {/* Kennel Pro upsell — todavía no disponible públicamente */}
      {plan !== 'premium' && plan !== 'kennel_pro' && (
        <div className="rounded-2xl border border-hairline bg-canvas p-6 lg:p-8">
          <div className="flex items-baseline gap-3 mb-1 flex-wrap">
            <h3 className="text-lg font-bold text-ink">Genealogic Kennel Pro</h3>
            <span className="text-xl font-bold text-ink">49€<span className="text-sm text-muted font-normal">/mes</span></span>
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
              Próximamente
            </span>
          </div>
          <p className="text-sm text-body mb-5">
            Web pública con dominio propio, emailbot 24/7, newsletter y pagos online.
            Lo estamos abriendo en privado a los primeros 50 criaderos. El precio Founder
            de 49€/mes se queda congelado de por vida.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
            {kennelProExtras.map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-body">
                <Check className="w-4 h-4 mt-0.5 text-ink flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Button
            variant="secondary" size="md"
            href="mailto:hola@genealogic.io?subject=Lista%20de%20espera%20Kennel%20Pro%20Founder"
          >
            <MailIcon className="w-4 h-4" />
            Apuntarme a la lista de espera
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

function ActivatePlanScreen({ plan }: { plan: 'kennel' | 'kennel_pro' }) {
  const checkoutReady = isSubscriptionCheckoutAvailable()
  const planLabel = plan === 'kennel' ? 'Kennel' : 'Kennel Pro'
  const planPrice = plan === 'kennel' ? '29€/mes' : '49€/mes Founder'
  // Kennel Pro está en privado hasta los primeros 50; aunque checkout esté
  // disponible, lo mostramos como lista de espera.
  const isPublicAvailable = plan === 'kennel'

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

      {/* Kennel arranca trial 15 días si Stripe está listo;
          Kennel Pro siempre va a lista de espera hasta apertura pública. */}
      {checkoutReady && isPublicAvailable ? (
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
  // El endpoint /api/billing/checkout normaliza nombres legacy → kennel/kennel_pro,
  // pero pasamos el canónico directo para que el flow sea explícito.
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
        15 días de prueba gratis con tarjeta. El primer cargo se hará automáticamente
        al día 15. Cancelas cuando quieras desde el portal de Stripe sin coste.
      </p>
      <Button
        href={`/api/checkout/start?plan=${plan}`}
        variant="primary"
        size="md"
        className="w-full"
      >
        Probar {planLabel} 15 días gratis
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
        <p className="text-sm font-semibold text-ink mb-3">Apúntate a la lista de espera</p>
        <p className="text-sm text-body mb-4">
          Escríbenos a hola@genealogic.io y te avisamos en cuanto abramos tu acceso
          a {planLabel} (precio Founder de 49€/mes congelado de por vida para los
          primeros 50 criaderos).
        </p>
        <Button
          href={`mailto:hola@genealogic.io?subject=Lista%20de%20espera%20${planLabel}%20Founder&body=Hola,%20acabo%20de%20crear%20mi%20criadero%20en%20Genealogic%20y%20quiero%20apuntarme%20a%20la%20lista%20de%20espera%20para%20activar%20${planLabel}.%20Mi%20email%20es:%20`}
          variant="primary"
          size="md"
          className="w-full"
        >
          <MailIcon className="w-4 h-4" />
          Apuntarme a {planLabel}
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
