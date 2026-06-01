import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sparkles, Check, ArrowUpRight, Clock, MailIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Nota: no usamos getPlanLabel() de lib/permissions porque devuelve los
// nombres internos antiguos ("Kennel"/"Kennel Pro"). En esta página, copy
// de cara al user, mapeamos al nombre comercial actual:
//   rol técnico 'kennel'     → "Kennel Pro" (49€/mes)
//   rol técnico 'kennel_pro' → "Kennel Enterprise" (149€/mes, manual)
function publicPlanLabel(plan: string): string {
  if (plan === 'kennel_pro' || plan === 'premium' || plan === 'enterprise') return 'Kennel Enterprise'
  if (plan === 'kennel' || plan === 'pro') return 'Kennel Pro'
  return 'Kennel Free'
}
import { isSubscriptionCheckoutAvailable } from '@/lib/stripe/server'
import { isIosUserAgent } from '@/lib/platform'
import { getTranslator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export const metadata = { title: 'Suscripción · Genealogic Pro' }

export default async function SuscripcionPage({
  searchParams,
}: { searchParams: Promise<{ activate?: string }> }) {
  const t = getTranslator(await getLocale())
  // App Store 3.1.1 — esta ruta no debe ser accesible desde el WebView iOS.
  const h = await headers()
  if (isIosUserAgent(h.get('user-agent'))) redirect('/dashboard')
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
  // Nota: en BBDD el rol técnico 'kennel' = Kennel Pro (49€), y
  // 'kennel_pro' = Kennel Enterprise (149€).
  const rawActivate = sp.activate
  const activatePlan: 'kennel' | 'kennel_pro' | null =
    rawActivate === 'kennel_pro' || rawActivate === 'premium' || rawActivate === 'enterprise' ? 'kennel_pro' :
    rawActivate === 'kennel' || rawActivate === 'pro' ? 'kennel' :
    null
  // Solo mostrar pantalla "activate" si todavía está en plan free
  // (si ya está en Kennel Pro/Enterprise, no tiene sentido)
  const showActivate = activatePlan && plan === 'free'

  // Features del plan Kennel Pro (49€/mes · rol técnico 'kennel')
  const kennelIncluded = [
    t('Perros ilimitados'),
    t('COI de Wright + ancestros duplicados'),
    t('Simulador de cruces y predicción de color por genotipos'),
    t('Pipeline de reservas, contratos digitales con firma electrónica'),
    t('Pagos online integrados (Stripe Connect)'),
    t('Calendario veterinario + recordatorios automáticos'),
    t('Importador IA de genealogías (sin límite)'),
    t('Hub de Contactos (suscriptores + leads + clientes)'),
    t('Estadísticas del perfil público'),
    t('Soporte prioritario <24h'),
  ]

  // Features adicionales del plan Kennel Enterprise (149€/mes ·
  // rol técnico 'kennel_pro' · activación manual)
  const kennelProExtras = [
    t('Todo lo del plan Kennel Pro'),
    t('Web pública del criadero con dominio propio y multi-idioma'),
    t('Blog SEO, reseñas, formulario de contacto, mapa de ubicación'),
    t('Emailbot multi-modelo (Claude / GPT / Gemini)'),
    t('Newsletter y biblioteca de conocimiento'),
    t('API REST pública, multi-usuario, white-label e integraciones'),
  ]

  // Pantalla "Activa tu plan" — usuario recién registrado con plan elegido
  if (showActivate) {
    return <ActivatePlanScreen plan={activatePlan!} t={t} />
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight">{t('Suscripción')}</h1>
        <p className="text-sm text-muted mt-0.5">{t('Gestión de tu plan y próximos pasos.')}</p>
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
          {isInTrial ? t('En prueba') : subStatus === 'past_due' ? t('Pago pendiente') : t('Activa')}
        </div>
        <div className="mb-4 pr-20 sm:pr-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">{t('Plan actual')}</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink break-words">Genealogic {publicPlanLabel(plan)}</h2>
            {isFounder && (
              <span className="inline-flex items-center rounded-full bg-surface-card border border-hairline px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
                {t('Cuenta vitalicia interna')}
              </span>
            )}
          </div>
        </div>

        {/* Banda de trial: días restantes + fecha de primer cargo */}
        {isInTrial && trialEndsDate && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              {t('Te quedan')} <strong>{trialDaysLeft} {trialDaysLeft === 1 ? t('día') : t('días')}</strong> {t('de prueba gratis.')}
            </p>
            <p className="mt-1 text-[13px] text-amber-900/90">
              {t('El primer cargo se hará automáticamente el')}{' '}
              <strong>{trialEndsDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>{' '}
              {t('en la tarjeta que registraste. Puedes cancelar antes desde el botón "Facturación" sin coste.')}
            </p>
          </div>
        )}

        {/* Aviso pago fallido — Stripe sigue reintentando */}
        {subStatus === 'past_due' && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">{t('No hemos podido cobrar tu última factura.')}</p>
            <p className="mt-1 text-[13px] text-red-900/90">
              {t('Stripe reintentará automáticamente las próximas horas. Revisa o cambia tu método de pago desde "Facturación" para evitar perder el acceso a tu plan.')}
            </p>
          </div>
        )}

        {startedDate && !isInTrial && (
          <p className="text-sm text-body mb-4">
            {t('Activo desde el')} <strong>{startedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            {isFounder && ' ' + t('Tu cuenta vitalicia interna se mantiene activa sin coste.')}
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
            <p className="text-sm font-semibold text-ink mb-1">{t('Facturación')}</p>
            <p className="text-sm text-body">
              {t('Tu facturación con Stripe llega en la próxima fase: ahí verás historial de pagos, método de pago y datos fiscales. Por ahora, si necesitas algo factúrame escríbeme a')}{' '}
              <a href="mailto:hola@genealogic.io" className="text-ink underline">hola@genealogic.io</a>.
            </p>
          </div>
          <Button variant="secondary" size="sm" href="/cuenta/facturacion">
            {t('Facturación')}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Kennel Enterprise upsell — activación manual */}
      {plan !== 'premium' && plan !== 'kennel_pro' && (
        <div className="rounded-2xl border border-hairline bg-canvas p-6 lg:p-8">
          <div className="flex items-baseline gap-3 mb-1 flex-wrap">
            <h3 className="text-lg font-bold text-ink">Genealogic Kennel Enterprise</h3>
            <span className="text-xl font-bold text-ink">149€<span className="text-sm text-muted font-normal">{t('/mes')}</span></span>
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
              {t('Activación manual')}
            </span>
          </div>
          <p className="text-sm text-body mb-5">
            {t('Web pública del criadero con dominio propio y multi-idioma, blog SEO, emailbot IA, newsletter, API REST, multi-usuario, white-label e integraciones. El alta de Kennel Enterprise se hace de forma manual tras hablar con soporte — escríbenos y te coordinamos el onboarding.')}
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
            href="mailto:hola@genealogic.io?subject=Activar%20Kennel%20Enterprise"
          >
            <MailIcon className="w-4 h-4" />
            {t('Hablar con soporte')}
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

function ActivatePlanScreen({ plan, t }: { plan: 'kennel' | 'kennel_pro'; t: (k: string) => string }) {
  const checkoutReady = isSubscriptionCheckoutAvailable()
  // En BBDD el rol 'kennel' = Kennel Pro (49€), 'kennel_pro' = Kennel Enterprise (149€).
  const planLabel = plan === 'kennel' ? 'Kennel Pro' : 'Kennel Enterprise'
  const planPrice = plan === 'kennel' ? '49€/mes' : '149€/mes'
  // Kennel Enterprise se activa de forma manual; aunque checkout esté
  // disponible, lo mostramos como contacto con soporte.
  const isPublicAvailable = plan === 'kennel'

  return (
    <div className="max-w-xl mx-auto py-8">
      {/* Header con celebración */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-3">
          <Check className="w-6 h-6 text-emerald-700" strokeWidth={3} />
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          {t('Criadero creado ✓')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink tracking-tight">
          {t('Activa Genealogic')} {planLabel}
        </h1>
        <p className="mt-3 text-body">
          {t('Tu criadero está creado. Falta un último paso para activar tu plan.')}
        </p>
      </div>

      {/* Kennel Pro arranca trial 14 días si Stripe está listo;
          Kennel Enterprise siempre va a lista de espera (alta manual). */}
      {checkoutReady && isPublicAvailable ? (
        <CheckoutCard plan={plan} planLabel={planLabel} planPrice={planPrice} t={t} />
      ) : (
        <WaitlistCard plan={plan} planLabel={planLabel} planPrice={planPrice} t={t} />
      )}

      <p className="mt-6 text-center text-xs text-muted">
        {t('¿Cambiaste de idea?')}{' '}
        <a href="/dashboard" className="underline text-ink">
          {t('Ir al dashboard')}
        </a>
      </p>
    </div>
  )
}

function CheckoutCard({
  plan, planLabel, planPrice, t,
}: { plan: string; planLabel: string; planPrice: string; t: (k: string) => string }) {
  // El endpoint /api/billing/checkout normaliza nombres legacy → kennel/kennel_pro,
  // pero pasamos el canónico directo para que el flow sea explícito.
  return (
    <div className="rounded-2xl border-2 border-ink bg-canvas p-6">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('Plan elegido')}</p>
          <p className="text-xl font-bold text-ink">Genealogic {planLabel}</p>
        </div>
        <p className="text-2xl font-bold text-ink">{planPrice}</p>
      </div>
      <p className="text-sm text-body mb-5">
        {t('14 días de prueba gratis, sin tarjeta. Antes de que termine la prueba te pediremos método de pago para continuar; si no lo facilitas, tu cuenta vuelve a Kennel Free sin coste y conservando tus datos.')}
      </p>
      <Button
        href={`/api/checkout/start?plan=${plan}`}
        variant="primary"
        size="md"
        className="w-full"
      >
        {t('Probar')} {planLabel} {t('14 días gratis')}
        <ArrowUpRight className="w-4 h-4" />
      </Button>
    </div>
  )
}

function WaitlistCard({
  plan, planLabel, planPrice, t,
}: { plan: string; planLabel: string; planPrice: string; t: (k: string) => string }) {
  return (
    <>
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 mb-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 mb-1">
              {planLabel} a {planPrice} — {t('activación manual')}
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">
              {t('Kennel Enterprise se contrata hablando con soporte. Hacemos un onboarding personalizado (dominio, multi-idioma, configuración de emailbot y newsletter) antes de activar la cuenta.')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-canvas p-5 mb-4">
        <p className="text-sm font-semibold text-ink mb-3">{t('Habla con soporte para activarlo')}</p>
        <p className="text-sm text-body mb-4">
          {t('Escríbenos a hola@genealogic.io y te coordinamos el alta de')} {planLabel}
          ({planPrice}). {t('No hay alta automática desde la web ni periodo de prueba.')}
        </p>
        <Button
          href={`mailto:hola@genealogic.io?subject=Activar%20${planLabel}&body=Hola,%20acabo%20de%20crear%20mi%20criadero%20en%20Genealogic%20y%20quiero%20activar%20${planLabel}.%20Mi%20email%20es:%20`}
          variant="primary"
          size="md"
          className="w-full"
        >
          <MailIcon className="w-4 h-4" />
          {t('Hablar con soporte')}
        </Button>
      </div>

      <a
        href="/dashboard"
        className="block text-center rounded-xl border border-hairline bg-canvas px-5 py-3 text-sm font-semibold text-body hover:border-ink/30 hover:text-ink"
      >
        {t('Empezar en Kennel Free mientras tanto →')}
      </a>
    </>
  )
}
