'use client'

import { useState } from 'react'
import { Receipt, ExternalLink, FileText, CreditCard } from 'lucide-react'
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
}

interface Props {
  profile: Profile | null
  invoices: Invoice[]
}

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(cents / 100)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BillingClient({ profile, invoices }: Props) {
  const [loadingPortal, setLoadingPortal] = useState(false)

  async function openPortal() {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error abriendo portal')
      window.location.href = data.url
    } catch (err: any) {
      alert(err.message)
      setLoadingPortal(false)
    }
  }

  const hasStripe = !!profile?.stripe_customer_id
  const subStatus = profile?.stripe_subscription_status

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-muted" />
          Facturación
        </h1>
        <p className="text-sm text-muted mt-0.5">Facturas, método de pago y datos fiscales.</p>
      </div>

      {/* Status + portal CTA */}
      <div className="rounded-2xl border border-hairline bg-canvas p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted mb-1">Estado</p>
            {!hasStripe ? (
              <p className="text-sm text-body">
                Aún no tienes cliente Stripe. Cuando hagas tu primer pago aparecerá todo aquí.
                {profile?.plan_is_founder && ' Como Founder no necesitas pagar — la cuenta es vitalicia.'}
              </p>
            ) : subStatus === 'active' ? (
              <p className="text-sm text-body">
                Suscripción <strong className="text-ink">activa</strong> en Stripe.
              </p>
            ) : subStatus === 'past_due' ? (
              <p className="text-sm text-red-700">
                Pago pendiente. Actualiza tu método de pago en el portal.
              </p>
            ) : subStatus === 'canceled' ? (
              <p className="text-sm text-body">Suscripción cancelada.</p>
            ) : (
              <p className="text-sm text-muted">{subStatus || '—'}</p>
            )}
          </div>
          {hasStripe && (
            <Button variant="primary" size="md" disabled={loadingPortal} onClick={openPortal}>
              <CreditCard className="w-4 h-4" />
              {loadingPortal ? 'Abriendo…' : 'Portal de Stripe'}
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        {hasStripe && (
          <p className="text-xs text-muted mt-3">
            En el portal de Stripe puedes: cambiar tarjeta, descargar facturas en cualquier momento,
            actualizar datos fiscales y cancelar la suscripción.
          </p>
        )}
      </div>

      {/* Invoices */}
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

      {/* Setup notes */}
      <div className="rounded-xl border border-hairline bg-surface-card p-5">
        <p className="text-sm font-semibold text-ink mb-2">Setup técnico (una sola vez)</p>
        <ol className="text-sm text-body space-y-1.5 list-decimal pl-5">
          <li>Crear productos en Stripe: Pro mensual, Pro anual, Premium mensual, Premium anual.</li>
          <li>Definir env vars en Vercel: <code className="text-[12px] bg-canvas border border-hairline rounded px-1">STRIPE_SECRET_KEY</code>, <code className="text-[12px] bg-canvas border border-hairline rounded px-1">STRIPE_WEBHOOK_SECRET</code>, <code className="text-[12px] bg-canvas border border-hairline rounded px-1">STRIPE_PRICE_PRO_MONTHLY</code>, <code className="text-[12px] bg-canvas border border-hairline rounded px-1">STRIPE_PRICE_PRO_ANNUAL</code>, <code className="text-[12px] bg-canvas border border-hairline rounded px-1">STRIPE_PRICE_PREMIUM_MONTHLY</code>, <code className="text-[12px] bg-canvas border border-hairline rounded px-1">STRIPE_PRICE_PREMIUM_ANNUAL</code>.</li>
          <li>Configurar webhook en Stripe que apunte a <code className="text-[12px] bg-canvas border border-hairline rounded px-1">https://genealogic.io/api/billing/webhook</code> con eventos: <code className="text-[11px]">checkout.session.completed</code>, <code className="text-[11px]">customer.subscription.updated</code>, <code className="text-[11px]">customer.subscription.deleted</code>, <code className="text-[11px]">invoice.paid</code>, <code className="text-[11px]">invoice.payment_failed</code>.</li>
          <li>Habilitar el Billing Portal en Stripe Dashboard (Settings → Billing → Customer portal).</li>
        </ol>
      </div>
    </div>
  )
}
