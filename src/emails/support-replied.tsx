/**
 * Email al user cuando el admin contesta a su admin_request (soporte o claim).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type SupportRepliedProps = {
  recipientName: string | null
  requestSubject: string
  adminMessagePreview: string
  requestId: string
}

export default function SupportRepliedEmail({
  recipientName, requestSubject, adminMessagePreview, requestId,
}: SupportRepliedProps) {
  const name = recipientName?.split(' ')[0] || null

  return (
    <EmailLayout preview={`El equipo ha respondido a tu solicitud: ${requestSubject}`}>
      <Eyebrow>Soporte respondió</Eyebrow>
      <H1>{name ? `${name}, ` : ''}el equipo te ha contestado.</H1>
      <P>
        Tu solicitud{' '}
        <strong style={{ color: COLORS.ink }}>"{requestSubject}"</strong> tiene una
        respuesta del equipo de Genealogic.
      </P>

      <div
        style={{
          backgroundColor: '#eff6ff',
          border: `1px solid #bfdbfe`,
          borderLeft: `3px solid #3b82f6`,
          borderRadius: '6px',
          padding: '14px 18px',
          fontFamily: FONT_STACK,
          fontSize: '14px',
          lineHeight: 1.6,
          color: COLORS.body,
          whiteSpace: 'pre-wrap',
          margin: '0 0 18px 0',
        }}
      >
        {adminMessagePreview.slice(0, 500)}
        {adminMessagePreview.length > 500 && '…'}
      </div>

      <Btn href={`${SITE_URL}/mis-solicitudes/${requestId}`}>Ver mi solicitud</Btn>

      <Divider />

      <Small>
        Puedes seguir la conversación directamente desde tu cuenta. Si respondes a este
        email, también nos llega y lo añadimos al hilo.
      </Small>
    </EmailLayout>
  )
}
