/**
 * Email de confirmación AL SOLICITANTE cuando rellena el formulario de un
 * kennel. Lo manda Genealogic, pero el reply-to se sobreescribe al email del
 * criador para que la conversación quede directa entre las dos partes.
 *
 * Categoría: 'critical' — es una confirmación inmediata de una acción del
 * propio usuario, no marketing. Siempre se manda.
 *
 * Tono: claro, breve, sin sobrepromesa. No diciéndole "te respondemos en X h"
 * porque eso depende del criador; sí explicando qué pasa ahora.
 */
import { EmailLayout, H1, P, Eyebrow, InfoCard, COLORS, FONT_STACK } from './_components'
import { getTranslator } from '@/lib/i18n'

export type InquiryReceivedProps = {
  /** Nombre del solicitante (saludo). */
  applicantName: string | null
  /** Nombre del criadero al que escribieron. */
  kennelName: string
  /** Mensaje original que enviaron, para que tengan copia. */
  applicantMessage?: string | null
  /** Raza preferida si la indicaron. */
  preferredBreed?: string | null
  /** Sexo preferido si lo indicaron. */
  preferredSex?: 'male' | 'female' | null
  locale?: string
}

export default function InquiryReceivedEmail({
  applicantName, kennelName, applicantMessage, preferredBreed, preferredSex, locale,
}: InquiryReceivedProps) {
  const t = getTranslator(locale || 'es')
  const name = applicantName?.split(' ')[0] || null
  const sexLabel = preferredSex === 'male' ? t('Macho') : preferredSex === 'female' ? t('Hembra') : null

  return (
    <EmailLayout
      preview={`${t('Hemos enviado tu solicitud a')} ${kennelName}`}
      audience="guest"
    >
      <Eyebrow>{t('Solicitud enviada')}</Eyebrow>
      <H1>
        {name
          ? `${name}${t(', tu solicitud está en camino.')}`
          : t('Tu solicitud está en camino.')}
      </H1>
      <P>
        {t('Hemos hecho llegar tu mensaje al criadero')}{' '}
        <strong style={{ color: COLORS.ink }}>{kennelName}</strong>.{' '}
        {t('Cada criador responde en su propio tiempo — si necesitas algo, basta con responder a este correo y le llegará directamente.')}
      </P>

      {(preferredBreed || sexLabel) && (
        <InfoCard>
          <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
            {preferredBreed && (
              <tr>
                <td style={{ paddingBottom: '8px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '110px' }}>
                  {t('Raza')}
                </td>
                <td style={{ paddingBottom: '8px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>
                  {preferredBreed}
                </td>
              </tr>
            )}
            {sexLabel && (
              <tr>
                <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Sexo preferido')}</td>
                <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{sexLabel}</td>
              </tr>
            )}
          </table>
        </InfoCard>
      )}

      {applicantMessage && (
        <>
          <P>
            <strong style={{ color: COLORS.ink }}>{t('Tu mensaje:')}</strong>
          </P>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${COLORS.hairline}`,
              borderLeft: `3px solid ${COLORS.accent}`,
              borderRadius: '6px',
              padding: '12px 16px',
              fontFamily: FONT_STACK,
              fontSize: '14px',
              lineHeight: 1.6,
              color: COLORS.body,
              whiteSpace: 'pre-wrap',
              margin: '0 0 18px 0',
            }}
          >
            {applicantMessage}
          </div>
        </>
      )}

      {/* El footer de EmailLayout (audience="guest") ya dice esto mismo,
          así que no duplicamos. */}
    </EmailLayout>
  )
}
