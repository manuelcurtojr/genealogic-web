/**
 * Recordatorio veterinario. Se manda 7d, 1d antes y el día D según
 * la lógica del cron job (/api/cron/vet-reminders).
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Pill, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'
import { getTranslator } from '@/lib/i18n'

export type VetReminderProps = {
  recipientName: string | null
  dogName: string
  dogId: string
  reminderTitle: string       // "Vacuna polivalente", "Desparasitación"
  reminderType: 'vaccine' | 'deworming' | 'checkup' | 'custom'
  dueDate: string             // ISO yyyy-mm-dd
  /** 'today' | 'tomorrow' | 'in_7_days' */
  bucket: 'today' | 'tomorrow' | 'in_7_days'
  locale?: string
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
  recipientName, dogName, dogId, reminderTitle, reminderType, dueDate, bucket, locale,
}: VetReminderProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  const typeLabel = t(TYPE_LABEL[reminderType] || 'Cita vet')

  const headline =
    bucket === 'today' ? `${t('Hoy toca')} ${typeLabel.toLowerCase()} ${t('para')} ${dogName}` :
    bucket === 'tomorrow' ? `${t('Mañana toca')} ${typeLabel.toLowerCase()} ${t('para')} ${dogName}` :
    `${typeLabel} ${t('para')} ${dogName} ${t('en 7 días')}`

  const pillVariant = bucket === 'today' ? 'danger' : bucket === 'tomorrow' ? 'amber' : 'muted'
  const pillText = bucket === 'today' ? t('HOY') : bucket === 'tomorrow' ? t('MAÑANA') : t('7 DÍAS')

  return (
    <EmailLayout preview={`${typeLabel}: ${reminderTitle} ${t('para')} ${dogName} — ${fmtDate(dueDate)}`} locale={locale}>
      <Eyebrow color={COLORS.accent}>{t('Recordatorio vet')}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {headline}.
      </H1>
      <P>
        <Pill variant={pillVariant}>{pillText}</Pill>
      </P>
      <P>
        {t('Toca')} <strong style={{ color: COLORS.ink }}>{reminderTitle}</strong> {t('para')} {dogName}.
        {' '}{t('Si ya lo has hecho, márcalo como completado para que no te volvamos a avisar.')}
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '110px' }}>{t('Perro')}</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>{dogName}</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Tipo')}</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{typeLabel}</td>
          </tr>
          <tr>
            <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Fecha')}</td>
            <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body, textTransform: 'capitalize' }}>{fmtDate(dueDate)}</td>
          </tr>
        </table>
      </InfoCard>

      <Btn href={`${SITE_URL}/dogs/${dogId}`}>{t('Ver ficha del perro')}</Btn>

      <Divider />

      <Small>
        {t('Recibes este aviso porque tienes recordatorios vet activos. Puedes desactivarlos por tipo en')}{' '}
        <a href={`${SITE_URL}/settings`} style={{ color: COLORS.ink }}>{t('tus preferencias')}</a>.
      </Small>
    </EmailLayout>
  )
}
