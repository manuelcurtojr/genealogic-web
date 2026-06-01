/**
 * Email a ambas partes cuando se firma electrónicamente un contrato de
 * reserva. Se manda 2 veces (uno al criador, otro al cliente) con role
 * distinto para personalizar el copy.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, Divider, Small, SITE_URL, COLORS } from './_components'
import { getTranslator } from '@/lib/i18n'

export type ContractSignedProps = {
  recipientName: string | null
  recipientRole: 'breeder' | 'client'
  otherPartyName: string
  kennelName: string
  reservationId: string
  contractPdfUrl: string | null
  locale?: string
}

export default function ContractSignedEmail({
  recipientName, recipientRole, otherPartyName, kennelName, reservationId, contractPdfUrl, locale,
}: ContractSignedProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null

  const headline = recipientRole === 'breeder'
    ? `${otherPartyName} ${t('ha firmado el contrato')}`
    : `${t('Contrato firmado con')} ${kennelName}`

  const body = recipientRole === 'breeder'
    ? `${otherPartyName} ${t('acaba de firmar electrónicamente el contrato de reserva. Tienes el PDF firmado disponible en tu panel.')}`
    : `${t('Acabas de firmar el contrato de reserva con')} ${kennelName}. ${t('Te dejamos el PDF firmado para que lo guardes.')}`

  const link = recipientRole === 'breeder'
    ? `${SITE_URL}/reservas/${reservationId}`
    : `${SITE_URL}/mis-reservas/${reservationId}`

  return (
    <EmailLayout preview={`${t('Contrato firmado')} ${recipientRole === 'breeder' ? t('por el cliente') : `${t('con')} ${kennelName}`}`} locale={locale}>
      <Eyebrow color={COLORS.success}>{t('✓ Contrato firmado')}</Eyebrow>
      <H1>{name ? `${name}, ` : ''}{headline}.</H1>
      <P>
        <Pill variant="success">{t('Firmado electrónicamente')}</Pill>
      </P>
      <P>{body}</P>

      {contractPdfUrl && (
        <Btn href={contractPdfUrl}>{t('Descargar contrato firmado (PDF)')}</Btn>
      )}

      <P>
        {t('También puedes acceder a la reserva completa, mensajes y pagos desde tu panel:')}
      </P>

      <Btn href={link} variant="secondary">{t('Abrir la reserva')}</Btn>

      <Divider />

      <Small>
        {t('Guarda este email — el PDF adjunto es la copia oficial firmada con validez legal. Si necesitas la versión notarial o tienes dudas, escríbenos a hola@genealogic.io.')}
      </Small>
    </EmailLayout>
  )
}
