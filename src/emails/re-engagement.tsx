/**
 * Email de re-engagement para users que llevan 14 días sin entrar.
 * Si tras 30 días sigue sin volver, se manda una versión "última
 * llamada" con copy distinto (mismo template, prop `variant`).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS } from './_components'

export type ReEngagementProps = {
  recipientName: string | null
  daysAway: number  // 14 o 30 típicamente
  intent: 'breeder' | 'owner'
}

export default function ReEngagementEmail({
  recipientName, daysAway, intent,
}: ReEngagementProps) {
  const name = recipientName?.split(' ')[0] || null
  const isFinal = daysAway >= 30

  const headline = isFinal
    ? `${name ? name + ', ' : ''}¿seguimos contando contigo?`
    : `${name ? name + ', ' : ''}te echamos de menos en Genealogic.`

  return (
    <EmailLayout preview={`Hace ${daysAway} días que no pasas por Genealogic`}>
      <Eyebrow color={COLORS.muted}>Te echamos de menos</Eyebrow>
      <H1>{headline}</H1>

      <P>
        Llevas <strong style={{ color: COLORS.ink }}>{daysAway} días</strong> sin
        entrar en Genealogic. Si lo dejaste por algo concreto que falló, nos
        encantaría saberlo — responde a este email con dos líneas y leemos todas.
      </P>

      {intent === 'breeder' ? (
        <>
          <P style={{ fontWeight: 600, color: COLORS.ink, marginTop: 18 }}>
            Mientras tanto, mira lo que te has perdido:
          </P>
          <ul style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              Pipeline de reservas con kanban visual
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              Emailbot que responde a leads 24/7
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              Importer IA: tu genealogía en 12 segundos
            </li>
          </ul>
        </>
      ) : (
        <>
          <P style={{ fontWeight: 600, color: COLORS.ink, marginTop: 18 }}>
            Tu perro tiene su ficha esperándote:
          </P>
          <ul style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              Genealogía completa con árbol genealógico
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              Recordatorios automáticos de vacunas
            </li>
            <li style={{ marginBottom: '6px', color: COLORS.body, fontSize: '14.5px', lineHeight: 1.6 }}>
              Papeles digitalizados siempre a mano
            </li>
          </ul>
        </>
      )}

      <Btn href={`${SITE_URL}/dashboard`}>
        {isFinal ? 'Volver a Genealogic' : 'Entrar a Genealogic'}
      </Btn>

      {isFinal && (
        <P style={{ color: COLORS.muted, fontSize: 13, marginTop: 16 }}>
          Si decides que Genealogic no es para ti, puedes borrar tu cuenta
          cuando quieras desde tu panel. Sin trámites raros.
        </P>
      )}

      <Divider />

      <Small>
        Para dejar de recibir este tipo de avisos, desactiva los emails de
        marketing en{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.muted, textDecoration: 'underline' }}>
          tus preferencias
        </a>.
      </Small>
    </EmailLayout>
  )
}
