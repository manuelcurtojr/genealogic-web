/**
 * Welcome email para criadores recién registrados.
 * Se envía justo tras signup cuando intent='breeder'.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL } from './_components'
import { getTranslator } from '@/lib/i18n'

export type WelcomeBreederProps = {
  displayName: string | null
  locale?: string
}

export default function WelcomeBreederEmail({ displayName, locale }: WelcomeBreederProps) {
  const t = getTranslator(locale || 'es')
  const name = displayName?.split(' ')[0] || null
  return (
    <EmailLayout preview={t('Bienvenido a Genealogic. Vamos a poner tu criadero en marcha.')}>
      <Eyebrow>{t('Bienvenido')}</Eyebrow>
      <H1>{t('Hola')}{name ? `, ${name}` : ''}. {t('Vamos a poner tu criadero en marcha.')}</H1>
      <P>
        {t('Acabas de crear tu cuenta en Genealogic. En 10 minutos puedes tener tu afijo publicado, tu web pública activa y tu pipeline de reservas funcionando.')}
      </P>
      <P>{t('Aquí tienes los 3 primeros pasos:')}</P>

      <ol style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>{t('Crea tu criadero')}</strong>{' '}
          {t('(logo, descripción, país). Es tu marca dentro de Genealogic.')}
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>{t('Añade tus reproductores')}</strong>{' '}
          {t('con foto y genealogía. Cuanto más completo, más confianza generas.')}
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>{t('Publica tu web')}</strong>{' '}
          {t('con el builder o conecta tu dominio.')}
        </li>
      </ol>

      <Btn href={`${SITE_URL}/dashboard`}>{t('Ir a mi panel')}</Btn>

      <Divider />

      <P>
        {t('¿Dudas? Escríbenos a')}{' '}
        <a href="mailto:hola@genealogic.io" style={{ color: '#111111' }}>hola@genealogic.io</a>{' '}
        {t('o pregunta a Genos (el chat de la esquina). Te respondemos en menos de 24h.')}
      </P>

    </EmailLayout>
  )
}
