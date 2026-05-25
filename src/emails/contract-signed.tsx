/**
 * Email a ambas partes cuando se firma electrónicamente un contrato de
 * reserva. Se manda 2 veces (uno al criador, otro al cliente) con role
 * distinto para personalizar el copy.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, Divider, Small, SITE_URL, COLORS } from './_components'

export type ContractSignedProps = {
  recipientName: string | null
  recipientRole: 'breeder' | 'client'
  otherPartyName: string
  kennelName: string
  reservationId: string
  contractPdfUrl: string | null
}

export default function ContractSignedEmail({
  recipientName, recipientRole, otherPartyName, kennelName, reservationId, contractPdfUrl,
}: ContractSignedProps) {
  const name = recipientName?.split(' ')[0] || null

  const headline = recipientRole === 'breeder'
    ? `${otherPartyName} ha firmado el contrato`
    : `Contrato firmado con ${kennelName}`

  const body = recipientRole === 'breeder'
    ? `${otherPartyName} acaba de firmar electrónicamente el contrato de reserva. Tienes el PDF firmado disponible en tu panel.`
    : `Acabas de firmar el contrato de reserva con ${kennelName}. Te dejamos el PDF firmado para que lo guardes.`

  const link = recipientRole === 'breeder'
    ? `${SITE_URL}/reservas/${reservationId}`
    : `${SITE_URL}/mis-reservas/${reservationId}`

  return (
    <EmailLayout preview={`Contrato firmado ${recipientRole === 'breeder' ? 'por el cliente' : `con ${kennelName}`}`}>
      <Eyebrow color={COLORS.success}>✓ Contrato firmado</Eyebrow>
      <H1>{name ? `${name}, ` : ''}{headline}.</H1>
      <P>
        <Pill variant="success">Firmado electrónicamente</Pill>
      </P>
      <P>{body}</P>

      {contractPdfUrl && (
        <Btn href={contractPdfUrl}>Descargar contrato firmado (PDF)</Btn>
      )}

      <P>
        También puedes acceder a la reserva completa, mensajes y pagos desde tu panel:
      </P>

      <Btn href={link} variant="secondary">Abrir la reserva</Btn>

      <Divider />

      <Small>
        Guarda este email — el PDF adjunto es la copia oficial firmada con validez
        legal. Si necesitas la versión notarial o tienes dudas, escríbenos a
        hola@genealogic.io.
      </Small>
    </EmailLayout>
  )
}
