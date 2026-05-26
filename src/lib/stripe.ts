/**
 * Cliente ligero de Stripe via REST API (sin SDK).
 *
 * Endpoints usados:
 *   - POST /v1/customers              (crear cliente si no existe)
 *   - POST /v1/checkout/sessions      (checkout para crear subscription)
 *   - POST /v1/billing_portal/sessions (portal de gestión del cliente)
 *   - POST /v1/invoices (list via GET)
 *
 * Setup necesario (env vars):
 *   STRIPE_SECRET_KEY               — sk_live_… o sk_test_…
 *   STRIPE_WEBHOOK_SECRET           — para verificar webhooks
 *   STRIPE_PRICE_KENNEL_MONTHLY     — price_xxx (Kennel 29€/mes)
 *   STRIPE_PRICE_KENNEL_ANNUAL      — price_xxx (Kennel 290€/año)
 *   STRIPE_PRICE_KENNEL_PRO_MONTHLY — price_xxx (Kennel Pro 49€/mes Founder · Próximamente)
 *   STRIPE_PRICE_KENNEL_PRO_ANNUAL  — price_xxx
 *   Legacy: STRIPE_PRICE_PRO_*, STRIPE_PRICE_PREMIUM_* todavía se aceptan
 *           como fallback en priceIdToPlan para subs antiguas.
 */

const STRIPE_API = 'https://api.stripe.com/v1'

function authHeader(): { Authorization: string } {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY no configurada')
  return { Authorization: `Bearer ${key}` }
}

function formEncode(obj: Record<string, any>, prefix = ''): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'object') parts.push(formEncode(item, `${key}[${i}]`))
        else parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`)
      })
    } else if (typeof v === 'object') {
      parts.push(formEncode(v, key))
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
    }
  }
  return parts.join('&')
}

async function stripeFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      ...authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(init.headers || {}),
    },
  })
  const json: any = await res.json()
  if (!res.ok) {
    throw new Error(json?.error?.message || `Stripe error ${res.status}`)
  }
  return json
}

export async function createOrGetCustomer(args: {
  email: string
  name?: string | null
  metadata?: Record<string, string>
  existingId?: string | null
}): Promise<{ id: string }> {
  if (args.existingId) {
    // Validar que sigue existiendo
    try {
      const c = await stripeFetch(`/customers/${args.existingId}`)
      if (!c.deleted) return { id: c.id }
    } catch { /* fall through */ }
  }
  const body = formEncode({
    email: args.email,
    ...(args.name ? { name: args.name } : {}),
    ...(args.metadata ? { metadata: args.metadata } : {}),
  })
  const c = await stripeFetch('/customers', { method: 'POST', body })
  return { id: c.id }
}

export async function createCheckoutSession(args: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  /**
   * Días de trial gratis antes del primer cargo. Stripe requiere tarjeta al
   * iniciar checkout (`payment_method_collection=always`), pero no cobra
   * nada hasta que el trial termina. Si la primera tarjeta falla:
   * past_due → unpaid → canceled (vía Smart Retries de Stripe) y el webhook
   * baja el plan a 'free'.
   *
   * Si no se pasa, no hay trial (cobro inmediato).
   */
  trialDays?: number
}): Promise<{ url: string; id: string }> {
  const subscriptionData: Record<string, unknown> = {}
  if (args.trialDays && args.trialDays > 0) {
    subscriptionData.trial_period_days = args.trialDays
    // Si por algún motivo Stripe no consigue un método de pago al final del
    // trial (no debería pasar con payment_method_collection=always pero por
    // si acaso), que cancele la sub en vez de dejarla en limbo.
    subscriptionData.trial_settings = {
      end_behavior: { missing_payment_method: 'cancel' },
    }
  }

  const body = formEncode({
    mode: 'subscription',
    customer: args.customerId,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    line_items: [{ price: args.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    // Card upfront: el usuario DEBE introducir tarjeta para empezar el trial.
    // Evita signups anónimos que nunca convierten.
    payment_method_collection: 'always',
    ...(Object.keys(subscriptionData).length > 0 ? { subscription_data: subscriptionData } : {}),
    ...(args.metadata ? { metadata: args.metadata } : {}),
  })
  const s = await stripeFetch('/checkout/sessions', { method: 'POST', body })
  return { url: s.url, id: s.id }
}

export async function createBillingPortalSession(args: {
  customerId: string
  returnUrl: string
}): Promise<{ url: string }> {
  const body = formEncode({
    customer: args.customerId,
    return_url: args.returnUrl,
  })
  const s = await stripeFetch('/billing_portal/sessions', { method: 'POST', body })
  return { url: s.url }
}

export async function listInvoices(customerId: string, limit = 24): Promise<any[]> {
  const params = new URLSearchParams({ customer: customerId, limit: String(limit) })
  const res = await stripeFetch(`/invoices?${params.toString()}`)
  return res.data || []
}

/** Mapea price_id → plan canónico actual.
 *  Mantenemos las env vars STRIPE_PRICE_PRO_* y STRIPE_PRICE_PREMIUM_* como
 *  legacy por si quedan suscripciones antiguas; los nuevos planes son
 *  STRIPE_PRICE_KENNEL_* y STRIPE_PRICE_KENNEL_PRO_*. */
export function priceIdToPlan(priceId: string): 'kennel' | 'kennel_pro' | null {
  // Nuevos
  if ([process.env.STRIPE_PRICE_KENNEL_MONTHLY, process.env.STRIPE_PRICE_KENNEL_ANNUAL].filter(Boolean).includes(priceId)) return 'kennel'
  if ([process.env.STRIPE_PRICE_KENNEL_PRO_MONTHLY, process.env.STRIPE_PRICE_KENNEL_PRO_ANNUAL].filter(Boolean).includes(priceId)) return 'kennel_pro'
  // Legacy fallback (por si Stripe envía un webhook de una sub antigua)
  if ([process.env.STRIPE_PRICE_PRO_MONTHLY, process.env.STRIPE_PRICE_PRO_ANNUAL].filter(Boolean).includes(priceId)) return 'kennel'
  if ([process.env.STRIPE_PRICE_PREMIUM_MONTHLY, process.env.STRIPE_PRICE_PREMIUM_ANNUAL].filter(Boolean).includes(priceId)) return 'kennel_pro'
  return null
}
