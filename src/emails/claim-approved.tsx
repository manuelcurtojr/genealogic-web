/**
 * Email al user cuando se aprueba su reclamación de perro o criadero.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, Divider, Small, SITE_URL, COLORS } from './_components'
import { getTranslator } from '@/lib/i18n'

export type ClaimApprovedProps = {
  recipientName: string | null
  targetType: 'dog' | 'kennel'
  targetName: string
  targetUrl: string
  resolutionNote?: string | null
  locale?: string
}

export default function ClaimApprovedEmail({
  recipientName, targetType, targetName, targetUrl, resolutionNote, locale,
}: ClaimApprovedProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  const kindLabel = targetType === 'dog' ? t('perro') : t('criadero')

  return (
    <EmailLayout preview={`${t('Tu reclamación de')} ${targetName} ${t('ha sido aprobada')}`} locale={locale}>
      <Eyebrow color={COLORS.success}>{t('✓ Aprobada')}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {targetName} {t('ya es tuyo.')}
      </H1>
      <P>
        {t('Hemos verificado tu reclamación del')} {kindLabel}{' '}
        <strong style={{ color: COLORS.ink }}>{targetName}</strong> {t('y la titularidad ya está a tu nombre.')}
      </P>

      <P>
        <Pill variant="success">{t('Titularidad transferida')}</Pill>
      </P>

      {targetType === 'dog' && (
        <P>
          {t('A partir de ahora puedes editar su ficha, subir fotos, gestionar sus papeles y registrar sus visitas al vet desde tu cuenta.')}
        </P>
      )}
      {targetType === 'kennel' && (
        <P>
          {t('A partir de ahora puedes editar la información del criadero, publicar tu web, recibir reservas y gestionar tus camadas.')}
        </P>
      )}

      <Btn href={targetUrl}>{t('Ver mi')} {kindLabel}</Btn>

      {resolutionNote && (
        <>
          <Divider />
          <P>
            <strong style={{ color: COLORS.ink }}>{t('Nota del equipo:')}</strong>
          </P>
          <P>
            <em>"{resolutionNote}"</em>
          </P>
        </>
      )}

      <Divider />

      <Small>
        {t('Si crees que hay algún error o necesitas ayuda con la transferencia, responde a este email o escribe a hola@genealogic.io.')}
      </Small>
    </EmailLayout>
  )
}
