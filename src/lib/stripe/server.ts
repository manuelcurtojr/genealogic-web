/**
 * Cliente Stripe + helpers Connect.
 *
 * ENV vars necesarias en Vercel para producción:
 *   STRIPE_SECRET_KEY           — sk_live_... (server-only)
 *   STRIPE_WEBHOOK_SECRET       — whsec_... (server-only, para verificar webhooks)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_live_... (cliente, opcional)
 *
 * Para Connect:
 *   - Activar Stripe Connect en el dashboard:
 *     https://dashboard.stripe.com/settings/connect
 *   - Cada criador conecta vía Account Link (modo Express recomendado)
 *   - Pagos: Checkout Session con `payment_intent_data.transfer_data.destination`
 *     o (modo directo) `Stripe-Account` header
 *
 * Estrategia elegida: **Express accounts + destination charges**.
 *   El cliente paga a la cuenta de Genealogic, y la transferencia al criador
 *   se hace automática vía transfer_data.destination. Esto permite cobrar
 *   `application_fee_amount` en el futuro (comisión Genealogic).
 *   Por ahora application_fee = 0.
 */
import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY no configurado')
  _stripe = new Stripe(key, {
    // Sin apiVersion explícita: usa la default del SDK instalado (stripe@22)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
    appInfo: { name: 'Genealogic', version: '1.0.0' },
  })
  return _stripe
}

/** True si Stripe está configurado en el entorno actual. */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

/**
 * True si está todo lo necesario para lanzar un Checkout Session de
 * suscripción (Pro/Premium). Requiere también las IDs de precio
 * configuradas en Vercel:
 *   STRIPE_PRICE_PRO_MONTHLY      (price_xxx — Pro 39€/mes recurring)
 *   STRIPE_PRICE_PREMIUM_MONTHLY  (price_xxx — Premium 149€/mes recurring)
 *
 * Si falta cualquiera, la UI debe mostrar lista de espera en vez de
 * "pagar y activar" — evita botones rotos.
 */
export function isSubscriptionCheckoutAvailable(): boolean {
  return (
    isStripeConfigured() &&
    !!process.env.STRIPE_PRICE_PRO_MONTHLY &&
    !!process.env.STRIPE_PRICE_PREMIUM_MONTHLY
  )
}

/**
 * Crea una cuenta Connect Express para un criador y devuelve account_id.
 * Si el criador ya tiene una, devuelve la existente.
 */
export async function ensureConnectAccount(args: {
  kennelEmail: string
  kennelName: string
  country?: string // ISO2
  existingAccountId?: string | null
}): Promise<string> {
  const stripe = getStripe()
  if (args.existingAccountId) {
    try {
      const acc = await stripe.accounts.retrieve(args.existingAccountId)
      return acc.id
    } catch {
      // si la cuenta fue borrada en Stripe, creamos una nueva
    }
  }
  const acc = await stripe.accounts.create({
    type: 'express',
    country: args.country || 'ES',
    email: args.kennelEmail,
    business_profile: {
      name: args.kennelName,
      product_description: 'Cría y venta de cachorros de raza pura',
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { source: 'genealogic' },
  })
  return acc.id
}

/** Genera un Account Link (URL temporal) para que el criador complete onboarding. */
export async function createAccountLink(args: {
  accountId: string
  returnUrl: string
  refreshUrl: string
}): Promise<string> {
  const stripe = getStripe()
  const link = await stripe.accountLinks.create({
    account: args.accountId,
    return_url: args.returnUrl,
    refresh_url: args.refreshUrl,
    type: 'account_onboarding',
  })
  return link.url
}

/** Recupera el estado de una cuenta Connect. */
export async function getAccountStatus(
  accountId: string,
): Promise<'none' | 'onboarding' | 'active' | 'restricted'> {
  if (!accountId) return 'none'
  const stripe = getStripe()
  try {
    const acc = await stripe.accounts.retrieve(accountId)
    if (acc.charges_enabled && acc.details_submitted) return 'active'
    if (acc.requirements?.disabled_reason) return 'restricted'
    return 'onboarding'
  } catch {
    return 'none'
  }
}

/**
 * Crea una Checkout Session para que el cliente pague.
 * Modelo: destination charge (cliente paga a Genealogic, Stripe transfiere al criador).
 */
export async function createPaymentCheckoutSession(args: {
  kennelStripeAccountId: string
  amountCents: number
  currency: string
  description: string
  customerEmail: string
  successUrl: string
  cancelUrl: string
  reservationId: string
  paymentRowId: string
  applicationFeeCents?: number
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: args.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: args.currency.toLowerCase(),
          unit_amount: args.amountCents,
          product_data: {
            name: args.description,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: args.applicationFeeCents ?? 0,
      transfer_data: {
        destination: args.kennelStripeAccountId,
      },
      metadata: {
        reservation_id: args.reservationId,
        payment_row_id: args.paymentRowId,
      },
    },
    metadata: {
      reservation_id: args.reservationId,
      payment_row_id: args.paymentRowId,
    },
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
  })
  if (!session.url) throw new Error('Stripe no devolvió URL de checkout')
  return { url: session.url, sessionId: session.id }
}

/** Verifica firma del webhook y devuelve el evento parseado. */
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no configurado')
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
