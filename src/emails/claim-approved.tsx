/**
 * Email al user cuando se aprueba su reclamación de perro o criadero.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, Divider, Small, SITE_URL, COLORS } from './_components'

export type ClaimApprovedProps = {
  recipientName: string | null
  targetType: 'dog' | 'kennel'
  targetName: string
  targetUrl: string
  resolutionNote?: string | null
}

export default function ClaimApprovedEmail({
  recipientName, targetType, targetName, targetUrl, resolutionNote,
}: ClaimApprovedProps) {
  const name = recipientName?.split(' ')[0] || null
  const kindLabel = targetType === 'dog' ? 'perro' : 'criadero'

  return (
    <EmailLayout preview={`Tu reclamación de ${targetName} ha sido aprobada`}>
      <Eyebrow color={COLORS.success}>✓ Aprobada</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {targetName} ya es tuyo.
      </H1>
      <P>
        Hemos verificado tu reclamación del {kindLabel}{' '}
        <strong style={{ color: COLORS.ink }}>{targetName}</strong> y la titularidad ya
        está a tu nombre.
      </P>

      <P>
        <Pill variant="success">Titularidad transferida</Pill>
      </P>

      {targetType === 'dog' && (
        <P>
          A partir de ahora puedes editar su ficha, subir fotos, gestionar sus
          papeles y registrar sus visitas al vet desde tu cuenta.
        </P>
      )}
      {targetType === 'kennel' && (
        <P>
          A partir de ahora puedes editar la información del criadero, publicar tu web,
          recibir reservas y gestionar tus camadas.
        </P>
      )}

      <Btn href={targetUrl}>Ver mi {kindLabel}</Btn>

      {resolutionNote && (
        <>
          <Divider />
          <P>
            <strong style={{ color: COLORS.ink }}>Nota del equipo:</strong>
          </P>
          <P>
            <em>"{resolutionNote}"</em>
          </P>
        </>
      )}

      <Divider />

      <Small>
        Si crees que hay algún error o necesitas ayuda con la transferencia, responde a
        este email o escribe a hola@genealogic.io.
      </Small>
    </EmailLayout>
  )
}
