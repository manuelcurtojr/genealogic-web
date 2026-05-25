/**
 * Email al user cuando se rechaza su reclamación.
 * Tono respetuoso, explica la razón y ofrece recurso.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, Divider, SITE_URL, COLORS } from './_components'

export type ClaimRejectedProps = {
  recipientName: string | null
  targetType: 'dog' | 'kennel'
  targetName: string
  resolutionNote: string
  requestId: string
}

export default function ClaimRejectedEmail({
  recipientName, targetType, targetName, resolutionNote, requestId,
}: ClaimRejectedProps) {
  const name = recipientName?.split(' ')[0] || null
  const kindLabel = targetType === 'dog' ? 'perro' : 'criadero'

  return (
    <EmailLayout preview={`Tu reclamación de ${targetName} no ha podido aprobarse`}>
      <Eyebrow color={COLORS.danger}>Rechazada</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        no hemos podido aprobar tu reclamación.
      </H1>
      <P>
        Hemos revisado tu reclamación del {kindLabel}{' '}
        <strong style={{ color: COLORS.ink }}>{targetName}</strong> y por ahora
        no podemos transferir la titularidad.
      </P>

      <P>
        <Pill variant="danger">No aprobada</Pill>
      </P>

      <P>
        <strong style={{ color: COLORS.ink }}>Motivo:</strong>
      </P>
      <div
        style={{
          backgroundColor: '#fef2f2',
          border: `1px solid #fecaca`,
          borderLeft: `3px solid ${COLORS.danger}`,
          borderRadius: '6px',
          padding: '12px 16px',
          color: COLORS.body,
          fontSize: '14px',
          lineHeight: 1.6,
          fontFamily: 'inherit',
          whiteSpace: 'pre-wrap',
          margin: '0 0 18px 0',
        }}
      >
        {resolutionNote}
      </div>

      <P>
        Si tienes documentación adicional o crees que es un error, puedes responder a
        este email o desde la página de tu solicitud.
      </P>

      <Btn href={`${SITE_URL}/mis-solicitudes/${requestId}`}>Ver mi solicitud</Btn>

      <Divider />

      <P>
        ¿Necesitas ayuda? Escríbenos a{' '}
        <a href="mailto:hola@genealogic.io" style={{ color: COLORS.ink }}>hola@genealogic.io</a>.
      </P>
    </EmailLayout>
  )
}
