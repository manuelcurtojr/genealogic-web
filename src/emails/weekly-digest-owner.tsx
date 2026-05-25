/**
 * Resumen semanal para propietarios. Solo si tienen al menos 1 perro
 * registrado y hay algo que avisar (vacuna próxima, recordatorio,
 * mensaje pendiente con criador, etc).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type WeeklyDigestOwnerProps = {
  recipientName: string | null
  weekLabel: string
  dogsCount: number
  /** Recordatorios vet en próximos 14 días */
  upcomingVet: Array<{ dogName: string; title: string; dueDate: string; dogId: string }>
  /** Mensajes pendientes en reservas */
  pendingMessages: number
}

function fmtShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short',
    })
  } catch { return iso }
}

export default function WeeklyDigestOwnerEmail({
  recipientName, weekLabel, dogsCount, upcomingVet, pendingMessages,
}: WeeklyDigestOwnerProps) {
  const name = recipientName?.split(' ')[0] || null

  return (
    <EmailLayout preview={`Tu resumen: ${upcomingVet.length} recordatorios vet, ${pendingMessages} mensajes`}>
      <Eyebrow>Resumen semanal</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        esto te interesa esta semana.
      </H1>
      <P style={{ color: COLORS.muted, fontSize: 13 }}>{weekLabel}</P>

      <P>
        Tienes <strong style={{ color: COLORS.ink }}>{dogsCount}</strong> perro{dogsCount === 1 ? '' : 's'} en
        Genealogic. Aquí va lo que toca:
      </P>

      {upcomingVet.length > 0 && (
        <>
          <P style={{ fontWeight: 600, color: COLORS.ink, fontSize: 14, marginTop: '20px', marginBottom: '8px' }}>
            Próximos avisos veterinarios:
          </P>
          {upcomingVet.slice(0, 5).map((v, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${COLORS.hairline}`,
                borderLeft: `3px solid ${COLORS.accent}`,
                borderRadius: '6px',
                padding: '10px 14px',
                fontFamily: FONT_STACK,
                fontSize: '13px',
                color: COLORS.body,
                marginBottom: '8px',
              }}
            >
              <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tr>
                  <td>
                    <p style={{ margin: 0, fontWeight: 600, color: COLORS.ink, fontSize: 13 }}>{v.title}</p>
                    <p style={{ margin: '2px 0 0 0', color: COLORS.muted, fontSize: 12 }}>{v.dogName}</p>
                  </td>
                  <td style={{ textAlign: 'right' as const, whiteSpace: 'nowrap' as const }}>
                    <span style={{
                      fontFamily: FONT_STACK,
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.accent,
                    }}>{fmtShortDate(v.dueDate)}</span>
                  </td>
                </tr>
              </table>
            </div>
          ))}
        </>
      )}

      {pendingMessages > 0 && (
        <P style={{ marginTop: 18 }}>
          Tienes <strong style={{ color: COLORS.ink }}>{pendingMessages}</strong> mensaje{pendingMessages === 1 ? '' : 's'} sin
          contestar de tu{pendingMessages === 1 ? '' : 's'} criador{pendingMessages === 1 ? '' : 'es'}.
        </P>
      )}

      <Btn href={`${SITE_URL}/dashboard`}>Ir a mi panel</Btn>

      {upcomingVet.length === 0 && pendingMessages === 0 && (
        <P style={{ color: COLORS.muted, fontSize: 13, marginTop: '12px' }}>
          Semana tranquila — todo al día. Aprovecha para subir alguna foto nueva o
          completar los papeles de tu perro.
        </P>
      )}

      <Divider />

      <Small>
        Recibes este resumen cada lunes. Si prefieres no recibirlo, desactívalo
        desde{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.ink }}>tus preferencias</a>.
      </Small>
    </EmailLayout>
  )
}
