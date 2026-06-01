/**
 * Email cuando una suscripción se cancela (por el user o por
 * Stripe tras múltiples fallos de pago).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS } from './_components'
import { getTranslator } from '@/lib/i18n'

export type SubscriptionCancelledProps = {
  recipientName: string | null
  locale?: string
}

export default function SubscriptionCancelledEmail({
  recipientName, locale,
}: SubscriptionCancelledProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null

  return (
    <EmailLayout preview={t('Tu suscripción de Genealogic ha sido cancelada')} locale={locale}>
      <Eyebrow color={COLORS.muted}>{t('Suscripción cancelada')}</Eyebrow>
      <H1>{name ? `${name}, ${t('tu')}` : t('Tu')} {t('suscripción ha terminado.')}</H1>
      <P>
        {t('Confirmamos que tu plan de pago ha sido cancelado. Tu cuenta sigue activa con el plan')}{' '}
        <strong style={{ color: COLORS.ink }}>Free</strong> {t('— todos tus datos siguen guardados y puedes seguir usando la plataforma.')}
      </P>

      <P>
        <strong style={{ color: COLORS.ink }}>{t('Qué pierdes:')}</strong> {t('el pipeline de reservas, la web pública con dominio, el emailbot y los contratos digitales. Los datos no se borran — vuelven a estar disponibles si reactivas el plan.')}
      </P>

      <Btn href={`${SITE_URL}/pricing`}>{t('Reactivar plan')}</Btn>

      <Divider />

      <P>
        <strong style={{ color: COLORS.ink }}>{t('¿Algo no funcionó como esperabas?')}</strong>
      </P>
      <P>
        {t('Si la app no encajó con tu criadero, nos encantaría saber por qué. Responde a este email con dos líneas — leemos todo y nos ayuda a mejorar.')}
      </P>

      <Small>
        {t('¿Quieres borrar tu cuenta completamente? Hazlo desde')}{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.ink }}>/settings</a>{' '}
        {t('o escríbenos a hola@genealogic.io.')}
      </Small>
    </EmailLayout>
  )
}
