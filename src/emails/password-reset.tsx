/**
 * Email de recuperación de contraseña — enviado con NUESTRO Resend (remitente
 * "Genealogic"), no con el SMTP por defecto de Supabase ("Supabase Auth").
 * El enlace lleva un token_hash que se verifica en /reset-password (client-side
 * verifyOtp), así que funciona aunque se abra en otro dispositivo.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Small } from './_components'
import { getTranslator } from '@/lib/i18n'

export type PasswordResetProps = {
  resetUrl: string
  locale?: string
}

export default function PasswordResetEmail({ resetUrl, locale }: PasswordResetProps) {
  const t = getTranslator(locale || 'es')
  return (
    <EmailLayout preview={t('Restablece tu contraseña de Genealogic')} locale={locale}>
      <Eyebrow>{t('Seguridad')}</Eyebrow>
      <H1>{t('Restablece tu contraseña')}</H1>
      <P>
        {t('Has solicitado cambiar tu contraseña de Genealogic. Pulsa el botón para elegir una nueva. El enlace caduca en 1 hora.')}
      </P>
      <Btn href={resetUrl}>{t('Cambiar mi contraseña')}</Btn>
      <Small>
        {t('Si no has sido tú, ignora este email — tu contraseña no cambiará.')}
      </Small>
    </EmailLayout>
  )
}
