/**
 * Email de confirmación cuando una suscripción Pro/Premium se activa
 * por primera vez.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type SubscriptionActivatedProps = {
  recipientName: string | null
  /** Acepta los nuevos nombres canónicos + los legacy pro/premium */
  plan: 'kennel' | 'kennel_pro' | 'pro' | 'premium'
  /** Si está en trial, ISO date de cuándo termina. null = ya activo / sin trial. */
  trialEndsAt?: string | null
}

function formatTrialDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return null
  }
}

export default function SubscriptionActivatedEmail({
  recipientName, plan, trialEndsAt = null,
}: SubscriptionActivatedProps) {
  const name = recipientName?.split(' ')[0] || null
  // BBDD: plan 'kennel_pro' = Kennel Enterprise (149€); plan 'kennel' = Kennel Pro (49€).
  const isEnterprise = plan === 'kennel_pro' || plan === 'premium'
  const planLabel = isEnterprise ? 'Kennel Enterprise' : 'Kennel Pro'
  const trialEnd = formatTrialDate(trialEndsAt)
  const isTrial = !!trialEnd

  const preview = isTrial
    ? `Tu prueba de 14 días de Genealogic ${planLabel} está activa. Termina el ${trialEnd}.`
    : `Genealogic ${planLabel} activado. Bienvenido al siguiente nivel.`

  return (
    <EmailLayout preview={preview}>
      <Eyebrow color={COLORS.success}>{isTrial ? '✓ Prueba activa' : '✓ Plan activado'}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {isTrial
          ? <>tu prueba de Genealogic {planLabel} ya está activa.</>
          : <>Genealogic {planLabel} ya está activo.</>}
      </H1>
      <P>
        {isTrial ? (
          <>
            Tienes <strong style={{ color: COLORS.ink }}>14 días para probar todas las herramientas</strong> de
            Genealogic {planLabel} sin coste. El primer cargo se hará el <strong style={{ color: COLORS.ink }}>{trialEnd}</strong>;
            puedes cancelar antes desde tu cuenta sin pagar nada.
          </>
        ) : (
          <>
            Gracias por confiar en nosotros. Tu suscripción <strong style={{ color: COLORS.ink }}>{planLabel}</strong> está activa
            y todas las herramientas profesionales ya las tienes desbloqueadas.
          </>
        )}
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '140px' }}>Plan</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>
              Genealogic {planLabel}
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Estado</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>
              {isTrial ? 'En prueba · sin coste hasta el primer cargo' : 'Activo · facturación mensual'}
            </td>
          </tr>
          {isTrial && (
            <tr>
              <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Primer cargo</td>
              <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>El {trialEnd}</td>
            </tr>
          )}
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
