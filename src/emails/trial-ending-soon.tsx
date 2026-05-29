/**
 * Email de aviso "tu prueba acaba en X días".
 *
 * Disparado por el webhook customer.subscription.trial_will_end de Stripe
 * (~3 días antes de que termine el trial de 14 días). El cobro automático
 * se hará cuando termine el trial — si la tarjeta sigue siendo válida no
 * hay que hacer nada, pero le damos al user la oportunidad de:
 *   - Cambiar la tarjeta si la actual va a fallar
 *   - Cancelar la suscripción antes del primer cargo
 *   - Confirmar que quiere seguir
 */
import { EmailLayout, H1, P, Btn, Eyebrow, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type TrialEndingSoonProps = {
  recipientName: string | null
  /** Plan canónico (acepta legacy pro/premium para retrocompat). */
  plan: 'kennel' | 'kennel_pro' | 'pro' | 'premium'
  /** ISO date de cuándo termina el trial. Si null, asumimos "pronto". */
  trialEndsAt: string | null
}

function formatSpanishDate(iso: string | null): string {
  if (!iso) return 'pronto'
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return 'pronto'
  }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  try {
    const ms = new Date(iso).getTime() - Date.now()
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  } catch {
    return null
  }
}

export default function TrialEndingSoonEmail({
  recipientName, plan, trialEndsAt,
}: TrialEndingSoonProps) {
  const name = recipientName?.split(' ')[0] || null
  // BBDD: plan 'kennel_pro' = Kennel Enterprise (149€); plan 'kennel' = Kennel Pro (49€).
  const isEnterprise = plan === 'kennel_pro' || plan === 'premium'
  const planLabel = isEnterprise ? 'Kennel Enterprise' : 'Kennel Pro'
  const endDate = formatSpanishDate(trialEndsAt)
  const days = daysUntil(trialEndsAt)
  const daysLabel = days === 1 ? '1 día' : `${days ?? 3} días`

  return (
    <EmailLayout preview={`Tu prueba de Genealogic ${planLabel} termina en ${daysLabel}.`}>
      <Eyebrow color={COLORS.amber}>Tu prueba está por terminar</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        tu prueba acaba en {daysLabel}.
      </H1>
      <P>
        El {endDate} se hará el primer cargo automático de tu suscripción
        <strong style={{ color: COLORS.ink }}> Genealogic {planLabel}</strong>.
        Si todo está bien, no tienes que hacer nada: la suscripción continuará
        sin interrupciones.
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
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Fin de la prueba</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{endDate}</td>
          </tr>
          <tr>
            <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Próximo cobro</td>
            <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>El {endDate} en la tarjeta registrada</td>
          </tr>
        </table>
      </InfoCard>

      <P>¿Quieres revisar algo antes del cobro?</P>
      <ul style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>Cambiar tarjeta</strong> si la actual va a caducar.
        </li>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>Cancelar la suscripción</strong> si decides no continuar (sin coste).
        </li>
        <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.ink }}>Cambiar de plan</strong> a Kennel Pro / Kennel Enterprise según necesites.
        </li>
      </ul>

      <Btn href={`${SITE_URL}/cuenta/facturacion`}>Gestionar mi suscripción</Btn>

      <Divider />

      <Small>
        Si el cargo falla, lo reintentaremos automáticamente los siguientes días.
        Pasados los reintentos sin éxito, tu plan vuelve a Free conservando todos
        tus datos. Para cualquier duda, responde a este email.
      </Small>
    </EmailLayout>
  )
}
