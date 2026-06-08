/**
 * Email de ACTIVACIÓN para usuarios que se registraron y confirmaron su email
 * pero NUNCA llegaron a iniciar sesión (last_sign_in_at IS NULL).
 *
 * Cubre un hueco que ni welcome ni checkin cubrían: el welcome asume "ya
 * entraste" (y de hecho se disparaba sin sesión, fallando con 401), y el
 * checkin asume que ya usaste el producto. Este reengancha al registro frío:
 * voz de fundador, un solo CTA (entrar + crear el primer perro) y la puerta
 * abierta a responder directamente a Manuel.
 *
 * Lo dispara el cron /api/cron/onboarding (dedupe activation:{userId}).
 * Reply-to → manuel@genealogic.io (se fija en TEMPLATE_META de email/send).
 */
import { EmailLayout, P, Btn, SITE_URL, COLORS } from './_components'
import { getTranslator } from '@/lib/i18n'

export type OwnerActivationProps = {
  displayName: string | null
  locale?: string
}

export default function OwnerActivationEmail({ displayName, locale }: OwnerActivationProps) {
  const t = getTranslator(locale || 'es')
  const name = displayName?.split(' ')[0] || null

  return (
    <EmailLayout preview={t('Termina de entrar y registra a tu primer perro en Genealogic')}>
      <P style={{ marginTop: 8 }}>{t('Hola')}{name ? `, ${name}` : ''}:</P>

      <P>
        {t('Soy Manuel, fundador de Genealogic. Vi que creaste tu cuenta hace unos días — gracias por dar el paso.')}
      </P>

      <P>
        {t('Genealogic es donde guardas a tus perros de por vida: su genealogía, sus fotos y su cartilla de salud con recordatorios de vacunas y desparasitaciones que te avisan solos. No vuelves a perder un papel del veterinario.')}
      </P>

      <P>{t('¿Te animas a registrar tu primer perro? Se tarda dos minutos:')}</P>

      <Btn href={`${SITE_URL}/login?redirect=/dogs`}>{t('Entrar y registrar mi perro →')}</Btn>

      <P>
        {t('Y si te quedaste atascado en algo —o simplemente entraste a curiosear—')}{' '}
        <strong style={{ color: COLORS.ink }}>{t('respóndeme a este correo')}</strong>{' '}
        {t('y te echo una mano yo mismo.')}
      </P>

      <P style={{ margin: '20px 0 0 0' }}>
        {t('Un abrazo,')}<br />
        Manuel<br />
        <span style={{ color: COLORS.muted, fontSize: 13 }}>Genealogic · {SITE_URL.replace('https://', '')}</span>
      </P>
    </EmailLayout>
  )
}
