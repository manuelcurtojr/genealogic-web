/**
 * Email al criador cuando un visitante envía una SOLICITUD nueva (lead) en su
 * kennel. Es el email MÁS importante de la app — si no llega, el criador
 * puede perder el lead.
 *
 * Nota terminológica: aunque el template se llama `reservation_new` por
 * compatibilidad histórica (email_log + dedupe_keys), el copy dice
 * "solicitud" en vez de "reserva". Lo que entra por el formulario público
 * es un lead/solicitud — la "reserva" propiamente dicha es una etapa
 * posterior del embudo (Reservas/Reserva en firme).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'
import { getTranslator } from '@/lib/i18n'

export type ReservationNewProps = {
  breederName: string | null
  kennelName: string
  clientName: string
  clientEmail: string
  clientMessage?: string | null
  reservationId: string
  preferredSex?: 'male' | 'female' | null
  preferredBreed?: string | null
  locale?: string
}

export default function ReservationNewEmail({
  breederName, kennelName, clientName, clientEmail, clientMessage,
  reservationId, preferredSex, preferredBreed, locale,
}: ReservationNewProps) {
  const t = getTranslator(locale || 'es')
  const name = breederName?.split(' ')[0] || null
  const sexLabel = preferredSex === 'male' ? t('Macho') : preferredSex === 'female' ? t('Hembra') : null

  return (
    <EmailLayout preview={`${t('Nueva solicitud de')} ${clientName} ${t('para')} ${kennelName}`}>
      <Eyebrow>{t('Nueva solicitud')}</Eyebrow>
      <H1>{name ? `${name}${t(', te ha llegado una solicitud.')}` : t('Tienes una solicitud nueva.')}</H1>
      <P>
        <strong style={{ color: COLORS.ink }}>{clientName}</strong>{' '}
        {t('se ha interesado por un cachorro de tu criadero')}{' '}
        <strong style={{ color: COLORS.ink }}>{kennelName}</strong>.
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '8px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '110px' }}>
              {t('Cliente')}
            </td>
            <td style={{ paddingBottom: '8px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>
              {clientName}
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '8px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Email')}</td>
            <td style={{ paddingBottom: '8px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>
              <a href={`mailto:${clientEmail}`} style={{ color: COLORS.ink }}>{clientEmail}</a>
            </td>
          </tr>
          {preferredBreed && (
            <tr>
              <td style={{ paddingBottom: '8px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Raza')}</td>
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

      {clientMessage && (
        <>
          <P>
            <strong style={{ color: COLORS.ink }}>{t('Mensaje del cliente:')}</strong>
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
            {clientMessage}
          </div>
        </>
      )}

      <Btn href={`${SITE_URL}/reservas/${reservationId}`}>{t('Ver solicitud')}</Btn>

      <Divider />

      <Small>
        {t('Responde rápido — los criadores que contactan en menos de 1h convierten 3× más. Si tienes el Emailbot activo, ya está respondiendo por ti mientras lees esto.')}
      </Small>
    </EmailLayout>
  )
}
