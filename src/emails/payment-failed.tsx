/**
 * Email cuando una factura recurrente falla (tarjeta caducada, fondos,
 * 3DS no completado, etc).
 *
 * Stripe reintenta automáticamente 3-4 veces durante 7-14 días. Si
 * todas fallan, dispara customer.subscription.deleted y mandamos el
 * email subscription_cancelled.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, Divider, Small, SITE_URL, COLORS } from './_components'

export type PaymentFailedProps = {
  recipientName: string | null
  hostedInvoiceUrl: string | null
  amountDueCents: number
  currency: string
}

function fmtMoney(cents: number, currency: string): string {
  const v = cents / 100
  const symbol = currency.toLowerCase() === 'eur' ? '€' : currency.toUpperCase() + ' '
  return `${v.toFixed(2)}${symbol === '€' ? '€' : ''}${symbol !== '€' ? symbol : ''}`.replace(/^/, currency.toLowerCase() === 'eur' ? '' : '')
}

export default function PaymentFailedEmail({
  recipientName, hostedInvoiceUrl, amountDueCents, currency,
}: PaymentFailedProps) {
  const name = recipientName?.split(' ')[0] || null
  const amount = fmtMoney(amountDueCents, currency)

  return (
    <EmailLayout preview="No hemos podido cobrar tu suscripción. Revisa tu método de pago.">
      <Eyebrow color={COLORS.danger}>Pago no completado</Eyebrow>
      <H1>{name ? `${name}, ` : ''}no hemos podido cobrar tu suscripción.</H1>
      <P>
        Tu factura de <strong style={{ color: COLORS.ink }}>{amount}</strong> no ha podido cobrarse.
        Suele ser por tarjeta caducada, fondos insuficientes o un cargo bloqueado por el banco.
      </P>

      <P>
        <Pill variant="danger">Acción requerida</Pill>
      </P>

      <P>
        Lo reintentaremos automáticamente las próximas horas, pero te recomendamos actualizar tu
        método de pago para evitar que tu suscripción se cancele.
      </P>

      {hostedInvoiceUrl ? (
        <Btn href={hostedInvoiceUrl}>Pagar factura ahora</Btn>
      ) : (
        <Btn href={`${SITE_URL}/cuenta/facturacion`}>Ir a facturación</Btn>
      )}

      <Divider />

      <Small>
        Si no actualizas tu método de pago en los próximos días, Stripe dejará de
        reintentar y tu plan pasará a Free automáticamente. Tus datos no se borran —
        siguen ahí cuando reactives. Para cualquier duda, responde a este email.
      </Small>
    </EmailLayout>
  )
}
