'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Receipt, ExternalLink, FileText, CreditCard, Sparkles, Crown, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Invoice {
  id: string
  number: string | null
  amount_cents: number
  currency: string
  status: string
  description: string | null
  hosted_invoice_url: string | null
  pdf_url: string | null
  paid_at: string | null
  created_at: string
}

interface Profile {
  stripe_customer_id: string | null
  stripe_subscription_status: string | null
  billing_email: string | null
  billing_name: string | null
  billing_tax_id: string | null
  billing_country: string | null
  billing_address: string | null
  billing_city: string | null
  billing_postal_code: string | null
  plan: string
  plan_is_founder: boolean
  trial_started_at?: string | null
  trial_ends_at?: string | null
}

interface Props {
  profile: Profile | null
  invoices: Invoice[]
  /** True si en server las env vars STRIPE_PRICE_* están configuradas. */
  stripeReady: boolean
  /** True si el user tiene un kennel (puede suscribirse a Pro/Premium). */
  hasKennel: boolean
}

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: (currency || 'EUR').toUpperCase(),
  }).format(cents / 100)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  kennel: 'Kennel',
  kennel_pro: 'Kennel Pro',
  // Legacy aliases (suscripciones antiguas)
  pro: 'Kennel',
  premium: 'Kennel Pro',
  starter: 'Kennel',
}

const PLAN_PRICE: Record<string, string> = {
  free: 'Gratis',
  kennel: '29 €/mes',
  kennel_pro: '49 €/mes',
  pro: '29 €/mes',
  premium: '49 €/mes',
  starter: '29 €/mes',
}

export default function BillingClient({ profile, invoices, stripeReady, hasKennel }: Props) {
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [checkoutPending, startCheckout] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setError(null)
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Error abriendo portal')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error abriendo portal')
      setLoadingPortal(false)
    }
  }

  function startCheckoutFn(plan: 'pro' | 'premium', interval: 'monthly' | 'annual' = 'monthly') {
    setError(null)
    startCheckout(async () => {
      try {
        const res = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, interval }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || data.message || 'Error iniciando el pago')
        if (data.url) window.location.href = data.url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error iniciando el pago')
      }
    })
  }

  const hasStripe = !!profile?.stripe_customer_id
  const subStatus = profile?.stripe_subscription_status
  const currentPlan = profile?.plan || 'free'
  const isPaidPlan = currentPlan !== 'free' && !!currentPlan
  const isFounder = profile?.plan_is_founder
  const trialEndsAt = profile?.trial_ends_at
  const trialEndsDate = trialEndsAt ? new Date(trialEndsAt) : null
  const isInTrial = subStatus === 'trialing' && trialEndsDate && trialEndsDate.getTime() > Date.now()
  const trialDaysLeft = isInTrial && trialEndsDate
    ? Math.ceil((trialEndsDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-muted" />
          Facturación
        </h1>
        <p className="text-sm text-muted mt-0.5">Tu plan, facturas y método de pago.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ═════ Plan actual ═════ */}
      <div className="rounded-2xl border border-hairline bg-canvas p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">Tu plan</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ink tracking-tight">
                {PLAN_LABEL[currentPlan] || currentPlan}
              </span>
              <span className="text-sm text-muted">{PLAN_PRICE[currentPlan]}</span>
              {isFounder && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  <Crown className="w-2.5 h-2.5" />
                  Founder
                </span>
              )}
            </div>
            {/* Status secundario */}
            <p className="text-sm text-body mt-3">
              {isFounder ? (
                <>Cuenta vitalicia — no se cobra nunca.</>
              ) : isInTrial && trialEndsDate ? (
                <span className="text-amber-700">
                  Prueba gratis · Te quedan <strong>{trialDaysLeft} día{trialDaysLeft === 1 ? '' : 's'}</strong>.
                  Primer cargo el {trialEndsDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}.
                </span>
              ) : !hasStripe ? (
                <>Aún sin método de pago. {hasKennel ? 'Suscríbete para desbloquear Kennel o Kennel Pro.' : 'Crea tu criadero para acceder a planes de pago.'}</>
              ) : subStatus === 'active' ? (
                <>Suscripción activa en Stripe.</>
              ) : subStatus === 'past_due' ? (
                <span className="text-red-700">Pago pendiente — actualiza tu tarjeta cuanto antes.</span>
              ) : subStatus === 'canceled' ? (
                <>Suscripción cancelada. Puedes reactivarla cuando quieras.</>
              ) : (
                <>{subStatus || 'Sin estado'}</>
              )}
            </p>
          </div>

          {hasStripe && (
            <Button variant="primary" size="md" disabled={loadingPortal} onClick={openPortal}>
              <CreditCard className="w-4 h-4" />
              {loadingPortal ? 'Abriendo…' : 'Gestionar suscripción'}
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {hasStripe && (
          <p className="text-xs text-muted mt-4">
            En el portal de Stripe puedes cambiar de plan, cancelar, actualizar tarjeta y descargar facturas.
          </p>
        )}
      </div>

      {/* ═════ Upgrade CTAs — solo si tiene kennel y no es plan pago ya ═════ */}
      {!isPaidPlan && !isFounder && hasKennel && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-muted" />
            Mejora tu plan
          </h2>

          {!stripeReady ? (
            <div className="rounded-xl border border-hairline bg-surface-card p-5">
              <p className="text-sm text-body">
                Los pagos online estarán disponibles muy pronto. Si quieres activar Kennel ahora,
                escríbenos a <a href="mailto:hola@genealogic.io" className="text-ink underline">hola@genealogic.io</a>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PlanCard
                name="Kennel"
                price="29 €"
                period="/mes"
                description="Pipeline de reservas, contratos digitales, vet calendar, importer IA. 15 días gratis."
                highlight
                onSelect={() => startCheckoutFn('pro')}
                disabled={checkoutPending}
              />
              <PlanCard
                name="Kennel Pro"
                price="49 €"
                period="/mes · Founder"
                description="Web pública, emailbot, newsletter, pagos online. Lo estamos abriendo en privado a los primeros 50 criaderos. Te avisamos cuando esté disponible."
                onSelect={() => startCheckoutFn('premium')}
                disabled={checkoutPending}
                comingSoon
              />
            </div>
          )}

          {checkoutPending && (
            <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Redirigiendo a Stripe…
            </p>
          )}

          <p className="text-xs text-muted mt-3">
            15 días de prueba gratis · Tarjeta requerida · Cobro automático al terminar la prueba ·
            Cancela cuando quieras desde el portal.{' '}
            <Link href="/pricing" className="text-ink underline">Ver todas las diferencias</Link>.
          </p>
        </div>
      )}

      {/* ═════ Histórico de facturas ═════ */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-muted" />
          Historial de facturas
        </h2>
        {invoices.length === 0 ? (
          <div className="border border-dashed border-hairline rounded-xl bg-canvas p-8 text-center">
            <p className="text-sm text-muted">
              Aún no hay facturas. Cuando se procese tu primer pago, aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="border border-hairline rounded-xl bg-canvas overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-hairline">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Fecha</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted hidden md:table-cell">Número</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">Concepto</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted text-right">Importe</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted text-right">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted text-right">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} className={i > 0 ? 'border-t border-hairline' : ''}>
                    <td className="px-4 py-3 text-body">{fmtDate(inv.paid_at || inv.created_at)}</td>
                    <td className="px-4 py-3 text-muted hidden md:table-cell font-mono text-[12px]">{inv.number || '—'}</td>
                    <td className="px-4 py-3 text-body">{inv.description || 'Suscripción Genealogic'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{fmtMoney(inv.amount_cents, inv.currency)}</td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === 'paid' ? (
                        <span className="text-[11px] font-bold uppercase tracking-[0.06em] bg-ink text-on-primary rounded-full px-2 py-0.5">Pagada</span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-[0.06em] bg-surface-card text-muted rounded-full px-2 py-0.5">{inv.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.pdf_url ? (
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-body hover:text-ink underline">PDF</a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════ Footer info ═════ */}
      <p className="text-xs text-muted text-center mt-8">
        ¿Dudas con tu facturación? Escríbenos a{' '}
        <a href="mailto:hola@genealogic.io" className="text-ink underline">hola@genealogic.io</a>.
      </p>
    </div>
  )
}

function PlanCard({
  name, price, period, description, highlight, onSelect, disabled, comingSoon,
}: {
  name: string
  price: string
  period: string
  description: string
  highlight?: boolean
  onSelect: () => void
  disabled?: boolean
  /** Si true, deshabilita el CTA y muestra etiqueta "Próximamente". */
  comingSoon?: boolean
}) {
  return (
    <div className={`rounded-xl border-2 p-5 flex flex-col ${
      highlight ? 'border-ink bg-canvas shadow-[0_4px_24px_rgba(0,0,0,0.06)]' : 'border-hairline bg-canvas'
    } ${comingSoon ? 'opacity-90' : ''}`}>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {highlight && (
          <div className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-on-primary">
            Recomendado
          </div>
        )}
        {comingSoon && (
          <div className="inline-flex items-center rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
            Próximamente
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-ink">{name}</h3>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold text-ink">{price}</span>
        <span className="text-xs text-muted">{period}</span>
      </div>
      <p className="text-[13px] text-body mt-2 mb-4 leading-relaxed">{description}</p>
      {comingSoon ? (
        <button
          type="button"
          disabled
          className="mt-auto inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-hairline bg-surface-soft px-4 py-2 text-sm font-bold text-muted"
        >
          Próximamente
        </button>
      ) : (
        <button
          onClick={onSelect}
          disabled={disabled}
          className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
            highlight
              ? 'bg-ink text-on-primary hover:opacity-90'
              : 'border border-hairline bg-canvas text-ink hover:border-ink/40'
          }`}
        >
          Probar {name} 15 días gratis
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
