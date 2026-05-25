/**
 * Email de confirmación cuando una suscripción Pro/Premium se activa
 * por primera vez.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type SubscriptionActivatedProps = {
  recipientName: string | null
  /** Acepta los nuevos nombres canónicos + los legacy pro/premium */
  plan: 'kennel' | 'kennel_pro' | 'pro' | 'premium'
}

export default function SubscriptionActivatedEmail({
  recipientName, plan,
}: SubscriptionActivatedProps) {
  const name = recipientName?.split(' ')[0] || null
  const isKennelPro = plan === 'kennel_pro' || plan === 'premium'
  const planLabel = isKennelPro ? 'Kennel Pro' : 'Kennel'

  return (
    <EmailLayout preview={`Genealogic ${planLabel} activado. Bienvenido al siguiente nivel.`}>
      <Eyebrow color={COLORS.success}>✓ Plan activado</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        Genealogic {planLabel} ya está activo.
      </H1>
      <P>
        Gracias por confiar en nosotros. Tu suscripción <strong style={{ color: COLORS.ink }}>{planLabel}</strong> está activa
        y todas las herramientas profesionales ya las tienes desbloqueadas.
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '110px' }}>Plan</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>
              Genealogic {planLabel}
            </td>
          </tr>
          <tr>
            <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Estado</td>
            <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>Activo · facturación mensual</td>
          </tr>
        </table>
      </InfoCard>

      <P>Esto es lo que te recomendamos hacer ahora:</P>
      <ol style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>Activa tu web pública</strong> con dominio personalizado.
        </li>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>Configura el Emailbot</strong> para que responda a leads 24/7.
        </li>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>Importa tu lista de espera</strong> y empieza tu pipeline de reservas.
        </li>
      </ol>

      <Btn href={`${SITE_URL}/dashboard`}>Ir a mi panel</Btn>

      <Divider />

      <Small>
        Recibirás una factura por email cada mes. Puedes ver, descargar y gestionar
        tu suscripción desde{' '}
        <a href={`${SITE_URL}/cuenta/facturacion`} style={{ color: COLORS.ink }}>
          /cuenta/facturacion
        </a>
        . Si necesitas ayuda, responde a este email.
      </Small>
    </EmailLayout>
  )
}
