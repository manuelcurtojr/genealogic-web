/**
 * Email cuando una suscripción se cancela (por el user o por
 * Stripe tras múltiples fallos de pago).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS } from './_components'

export type SubscriptionCancelledProps = {
  recipientName: string | null
}

export default function SubscriptionCancelledEmail({
  recipientName,
}: SubscriptionCancelledProps) {
  const name = recipientName?.split(' ')[0] || null

  return (
    <EmailLayout preview="Tu suscripción de Genealogic ha sido cancelada">
      <Eyebrow color={COLORS.muted}>Suscripción cancelada</Eyebrow>
      <H1>{name ? `${name}, tu` : 'Tu'} suscripción ha terminado.</H1>
      <P>
        Confirmamos que tu plan de pago ha sido cancelado. Tu cuenta sigue activa con
        el plan <strong style={{ color: COLORS.ink }}>Free</strong> — todos tus datos
        siguen guardados y puedes seguir usando la plataforma.
      </P>

      <P>
        <strong style={{ color: COLORS.ink }}>Qué pierdes:</strong> el pipeline de
        reservas, la web pública con dominio, el emailbot y los contratos digitales.
        Los datos no se borran — vuelven a estar disponibles si reactivas el plan.
      </P>

      <Btn href={`${SITE_URL}/pricing`}>Reactivar plan</Btn>

      <Divider />

      <P>
        <strong style={{ color: COLORS.ink }}>¿Algo no funcionó como esperabas?</strong>
      </P>
      <P>
        Si la app no encajó con tu criadero, nos encantaría saber por qué. Responde a
        este email con dos líneas — leemos todo y nos ayuda a mejorar.
      </P>

      <Small>
        ¿Quieres borrar tu cuenta completamente? Hazlo desde{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.ink }}>/settings</a>{' '}
        o escríbenos a hola@genealogic.io.
      </Small>
    </EmailLayout>
  )
}
