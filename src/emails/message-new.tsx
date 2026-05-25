/**
 * Email cuando llega un mensaje nuevo en un thread de reserva.
 * Funciona en ambos sentidos:
 *   - cliente escribe → llega al criador
 *   - criador escribe → llega al cliente
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type MessageNewProps = {
  recipientName: string | null
  senderName: string
  preview: string
  reservationId: string
  /** Si el recipient es el cliente, link va a /mis-reservas, si es el criador a /reservas */
  recipientIsBreeder: boolean
}

export default function MessageNewEmail({
  recipientName, senderName, preview, reservationId, recipientIsBreeder,
}: MessageNewProps) {
  const name = recipientName?.split(' ')[0] || null
  const link = recipientIsBreeder
    ? `${SITE_URL}/reservas/${reservationId}`
    : `${SITE_URL}/mis-reservas/${reservationId}`

  return (
    <EmailLayout preview={`${senderName}: ${preview.slice(0, 80)}`}>
      <Eyebrow>Mensaje nuevo</Eyebrow>
      <H1>{name ? `${name}, tienes un mensaje.` : 'Tienes un mensaje nuevo.'}</H1>
      <P>
        <strong style={{ color: COLORS.ink }}>{senderName}</strong> te ha escrito.
      </P>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${COLORS.hairline}`,
          borderLeft: `3px solid ${COLORS.accent}`,
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
        {preview.slice(0, 400)}
        {preview.length > 400 && '…'}
      </div>

      <Btn href={link}>Responder en Genealogic</Btn>

      <Divider />

      <Small>
        Respondes desde la app para que la conversación quede registrada y ambos
        veáis el historial completo.
      </Small>
    </EmailLayout>
  )
}
