/**
 * Welcome email para propietarios recién registrados.
 * Se envía justo tras signup cuando intent='owner'.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL } from './_components'
import { getTranslator } from '@/lib/i18n'

export type WelcomeOwnerProps = {
  displayName: string | null
  locale?: string
}

export default function WelcomeOwnerEmail({ displayName, locale }: WelcomeOwnerProps) {
  const t = getTranslator(locale || 'es')
  const name = displayName?.split(' ')[0] || null
  return (
    <EmailLayout preview={t('Bienvenido a Genealogic. La ficha digital de tu perro empieza aquí.')}>
      <Eyebrow>{t('Bienvenido')}</Eyebrow>
      <H1>{t('Hola')}{name ? `, ${name}` : ''}. {t('La ficha de tu perro empieza aquí.')}</H1>
      <P>
        {t('Genealogic es gratis para propietarios. Tu cuenta ya está activa y puedes empezar a documentar a tu perro: genealogía, papeles, vacunas y galería en un solo sitio.')}
      </P>

      <P>{t('Qué puedes hacer ahora:')}</P>

      <ol style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>{t('Añade tu primer perro')}</strong>{' '}
          {t('con foto, raza y fecha de nacimiento.')}
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>{t('Sube los papeles')}</strong>{' '}
          {t('(cartilla, genealogía, contrato). Todo escaneado y a mano cuando los necesites.')}
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>{t('Activa los recordatorios vet')}</strong>:{' '}
          {t('te avisamos antes de cada vacuna.')}
        </li>
      </ol>

      <Btn href={`${SITE_URL}/dogs`}>{t('Añadir mi primer perro')}</Btn>

      <Divider />

      <P>
        {t('¿Tu perro ya está en Genealogic? Es posible — tenemos miles de perros importados de clubes de raza. Búscalo en')}{' '}
        <a href={`${SITE_URL}/search`} style={{ color: '#111111' }}>/search</a>{' '}
        {t('y reclámalo si lo encuentras.')}
      </P>

      <Small>
        {t('Sin tarjeta, sin trials, sin anuncios. La plataforma se sostiene con los criadores que pagan — tú nunca.')}
      </Small>
    </EmailLayout>
  )
}
