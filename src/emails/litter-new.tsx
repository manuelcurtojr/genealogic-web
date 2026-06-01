/**
 * Email a la lista de espera del criadero cuando hay una nueva camada.
 * Solo a quienes están como 'interested' en `puppy_reservations` del mismo
 * criadero y (si aplica) compatible con la raza de la camada.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, InfoCard, Divider, Small, SITE_URL, COLORS, FONT_STACK } from './_components'
import { getTranslator } from '@/lib/i18n'

export type LitterNewProps = {
  recipientName: string | null
  kennelName: string
  litterId: string
  breedName: string | null
  expectedDate: string | null    // ISO, fecha estimada de nacimiento (planned/mated)
  birthDate: string | null       // ISO, real (born)
  puppyCount: number | null
  status: 'planned' | 'mated' | 'born' | 'delivered'
  fatherName: string | null
  motherName: string | null
  locale?: string
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return iso }
}

export default function LitterNewEmail({
  recipientName, kennelName, litterId, breedName,
  expectedDate, birthDate, puppyCount, status, fatherName, motherName, locale,
}: LitterNewProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  const dateLabel = status === 'born' || status === 'delivered'
    ? `${t('Nacida el')} ${fmtDate(birthDate) || '—'}`
    : status === 'mated'
    ? `${t('Nacimiento estimado:')} ${fmtDate(expectedDate) || t('próximas semanas')}`
    : `${t('Planificada para')} ${fmtDate(expectedDate) || t('próximas semanas')}`

  const headline =
    status === 'born' || status === 'delivered'
      ? `${t('Han nacido los cachorros')}${breedName ? ` (${breedName})` : ''}`
      : `${t('Nueva camada')}${breedName ? ` (${breedName})` : ''} ${t('en camino')}`

  return (
    <EmailLayout preview={`${kennelName}: ${headline.toLowerCase()}`} locale={locale}>
      <Eyebrow>{t('Camada nueva')}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {headline}.
      </H1>
      <P>
        {t('El criadero')} <strong style={{ color: COLORS.ink }}>{kennelName}</strong> {t('tiene una camada nueva. Como tienes una reserva o estás interesado, te avisamos para que puedas elegir cachorro pronto.')}
      </P>

      <InfoCard>
        <table cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted, width: '110px' }}>{t('Criadero')}</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>{kennelName}</td>
          </tr>
          {breedName && (
            <tr>
              <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Raza')}</td>
              <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{breedName}</td>
            </tr>
          )}
          {fatherName && motherName && (
            <tr>
              <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Padres')}</td>
              <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{fatherName} × {motherName}</td>
            </tr>
          )}
          <tr>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Fecha')}</td>
            <td style={{ paddingBottom: '6px', fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{dateLabel}</td>
          </tr>
          {puppyCount != null && puppyCount > 0 && (
            <tr>
              <td style={{ fontFamily: FONT_STACK, fontSize: '12px', color: COLORS.muted }}>{t('Cachorros')}</td>
              <td style={{ fontFamily: FONT_STACK, fontSize: '14px', color: COLORS.body }}>{puppyCount}</td>
            </tr>
          )}
        </table>
      </InfoCard>

      <Btn href={`${SITE_URL}/litters/${litterId}`}>{t('Ver la camada')}</Btn>

      <Divider />

      <Small>
        {t('Si ya no estás interesado, escribe al criador desde tu reserva o pídele que te quite de la lista. Recibes este aviso porque')} {kennelName} {t('te tiene como contacto interesado.')}
      </Small>
    </EmailLayout>
  )
}
