/**
 * Recordatorio veterinario. Se manda 7d, 1d antes y el día D según
 * la lógica del cron job (/api/cron/vet-reminders).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'

export type VetReminderProps = {
  recipientName: string | null
  dogName: string
  dogId: string
  reminderTitle: string       // "Vacuna polivalente", "Desparasitación"
  reminderType: 'vaccine' | 'deworming' | 'checkup' | 'custom'
  dueDate: string             // ISO yyyy-mm-dd
  /** 'today' | 'tomorrow' | 'in_7_days' */
  bucket: 'today' | 'tomorrow' | 'in_7_days'
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  } catch { return iso }
}

const TYPE_LABEL: Record<string, string> = {
  vaccine: 'Vacuna',
  deworming: 'Desparasitación',
  checkup: 'Revisión',
  custom: 'Cita vet',
}

export default function VetReminderEmail({
  recipientName, dogName, dogId, reminderTitle, reminderType, dueDate, bucket,
}: VetReminderProps) {
  const name = recipientName?.split(' ')[0] || null
  const typeLabel = TYPE_LABEL[reminderType] || 'Cita vet'

  const headline =
    bucket === 'today' ? `Hoy toca ${typeLabel.toLowerCase()} de ${dogName}` :
    bucket === 'tomorrow' ? `Mañana toca ${typeLabel.toLowerCase()} de ${dogName}` :
    `${typeLabel} de ${dogName} en 7 días`

  const pillVariant = bucket === 'today' ? 'danger' : bucket === 'tomorrow' ? 'amber' : 'muted'
  const pillText = bucket === 'today' ? 'HOY' : bucket === 'tomorrow' ? 'MAÑANA' : '7 DÍAS'

  return (
    <EmailLayout preview={`${typeLabel}: ${reminderTitle} para ${dogName} — ${fmtDate(dueDate)}`}>
      <Eyebrow color={COLORS.accent}>Recordatorio vet</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {headline}.
      </H1>
      <P>
        <Pill variant={pillVariant}>{pillText}</Pill>
      </P>
      <P>
        Toca <strong style={{ color: COLORS.ink }}>{reminderTitle}</strong> para {dogName}.
        Si ya lo has hecho, márcalo como completado para que no te volvamos a avisar.
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '110px' }}>Perro</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>{dogName}</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Tipo</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{typeLabel}</td>
          </tr>
          <tr>
            <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>Fecha</td>
            <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body, textTransform: 'capitalize' }}>{fmtDate(dueDate)}</td>
          </tr>
        </table>
      </InfoCard>

      <Btn href={`${SITE_URL}/dogs/${dogId}`}>Ver ficha del perro</Btn>

      <Divider />

      <Small>
        Recibes este aviso porque tienes recordatorios vet activos. Puedes
        desactivarlos por tipo en{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.ink }}>tus preferencias</a>.
      </Small>
    </EmailLayout>
  )
}
