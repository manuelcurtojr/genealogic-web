/**
 * Email al CLIENTE cuando un pago de su reserva se marca como pagado.
 * Sirve tanto si el criador lo marcó a mano (transferencia, efectivo)
 * como si llegó automático vía Stripe Checkout.
 *
 * Se envía SOLO al cliente — el criador ya lo ve en su panel y no
 * necesita email cuando él mismo marca el pago.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type PaymentReceivedProps = {
  recipientName: string | null
  kennelName: string
  reservationId: string
  amountCents: number
  currency: string
  description: string | null
  paidVia: 'stripe' | 'manual' | 'transfer' | 'cash' | string
  paidAt: string  // ISO
}

function fmtMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase() || 'EUR',
    }).format(cents / 100)
  } catch { return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}` }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return iso }
}

const VIA_LABEL: Record<string, string> = {
  stripe: 'Tarjeta (Stripe)',
  manual: 'Manual',
  transfer: 'Transferencia',
  cash: 'Efectivo',
}

export default function PaymentReceivedEmail({
  recipientName, kennelName, reservationId, amountCents, currency,
  description, paidVia, paidAt,
}: PaymentReceivedProps) {
  const name = recipientName?.split(' ')[0] || null
  const amount = fmtMoney(amountCents, currency)
  const viaLabel = VIA_LABEL[paidVia] || paidVia

  return (
    <EmailLayout preview={`${kennelName} ha confirmado tu pago de ${amount}`}>
      <Eyebrow color={COLORS.success}>✓ Pago confirmado</Eyebrow>
      <H1>{name ? `${name}, ` : ''}pago recibido.</H1>
      <P>
        <strong style={{ color: COLORS.ink }}>{kennelName}</strong> ha confirmado tu
        pago de <strong style={{ color: COLORS.ink }}>{amount}</strong>.
        Considéralo tu recibo oficial — guárdalo por si lo necesitas más adelante.
      </P>

      <P>
        <Pill variant="success">Pagado</Pill>
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '120px' }}>Importe</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>{amount}</td>
          </tr>
          {description && (
            <tr>
              <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Concepto</td>
              <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{description}</td>
            </tr>
          )}
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Método</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{viaLabel}</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Fecha</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{fmtDate(paidAt)}</td>
          </tr>
          <tr>
            <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Criadero</td>
            <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{kennelName}</td>
          </tr>
        </table>
      </InfoCard>

      <Btn href={`${SITE_URL}/mis-reservas/${reservationId}/pagos`}>Ver mis pagos</Btn>

      <Divider />

      <Small>
        Si tienes dudas sobre este pago o necesitas factura formal, contacta
        directamente con {kennelName} desde el hilo de tu reserva.
      </Small>
    </EmailLayout>
  )
}
