/**
 * Email al cliente cuando el criador ENVÍA un contrato (reserva o entrega) para
 * firmar. Si el cliente no tiene cuenta, el CTA le lleva a registrarse con su
 * email (el trigger le vincula la reserva); si la tiene, a entrar y firmar.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Small, SITE_URL } from './_components'
import { getTranslator } from '@/lib/i18n'

export type ContractSentProps = {
  clientName: string | null
  kennelName: string
  contractKind: 'reservation' | 'delivery'
  reservationId: string
  hasAccount: boolean
  /** UUID del preview_token del contrato → link público sólo-lectura
   *  para que el cliente lea sin crear cuenta. Si no está presente,
   *  el email omite ese CTA secundario. */
  previewToken?: string | null
  locale?: string
}

export default function ContractSentEmail({
  clientName,
  kennelName,
  contractKind,
  reservationId,
  hasAccount,
  previewToken,
  locale,
}: ContractSentProps) {
  const t = getTranslator(locale || 'es')
  const name = clientName?.split(' ')[0] || null
  const tipo = contractKind === 'delivery' ? t('contrato de compraventa y entrega') : t('contrato de reserva')
  const dest = `/mis-reservas/${reservationId}/contrato`
  // intent=owner → el cliente que se registra para firmar entra con onboarding
  // 100% de PROPIETARIO (salta el RoleSelector "¿eres criador o propietario?").
  // redirect → tras autenticarse aterriza directo en el contrato.
  const url = hasAccount
    ? `${SITE_URL}/login?intent=owner&redirect=${encodeURIComponent(dest)}`
    : `${SITE_URL}/register?intent=owner&redirect=${encodeURIComponent(dest)}`
  const previewUrl = previewToken ? `${SITE_URL}/contrato-preview/${previewToken}` : null
  return (
    <EmailLayout preview={`${kennelName}: ${t('contrato para firmar')}`} locale={locale}>
      <Eyebrow>{t('Contrato para firmar')}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {kennelName} {t('te ha enviado un contrato')}
      </H1>
      <P>
        <strong>{kennelName}</strong> {t('te ha enviado un')} {tipo}{' '}
        {t('para que lo revises y lo firmes en Genealogic.')}
      </P>
      {!hasAccount && (
        <P>
          {t('Para firmarlo necesitas una cuenta de Genealogic. Créala con este mismo email y tu reserva aparecerá automáticamente.')}
        </P>
      )}
      <Btn href={url}>{hasAccount ? t('Ver y firmar el contrato') : t('Crear cuenta y firmar')}</Btn>
      {previewUrl && (
        <P>
          {t('¿Prefieres leerlo antes sin crear cuenta?')}{' '}
          <a href={previewUrl} style={{ color: '#FE6620', fontWeight: 600 }}>
            {t('Vista previa del contrato')} →
          </a>
        </P>
      )}
      <Small>
        {t('Si no esperabas este contrato, puedes ignorar este email o escribir a hola@genealogic.io.')}
      </Small>
    </EmailLayout>
  )
}
