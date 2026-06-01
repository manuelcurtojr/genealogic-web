import { EmailLayout, H1, P, Btn, Eyebrow, Small, SITE_URL } from './_components'
import { getTranslator } from '@/lib/i18n'

export interface ReproNextHeatProps {
  recipientName?: string | null
  dogName: string
  /** Fecha estimada del celo, ya formateada (es-ES). */
  heatDate: string
  daysUntil: number
  locale?: string
}

export default function ReproNextHeatEmail({ recipientName, dogName, heatDate, daysUntil, locale }: ReproNextHeatProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  return (
    <EmailLayout preview={`${t('El próximo celo de')} ${dogName} ${t('se acerca')} (${heatDate})`} locale={locale}>
      <Eyebrow color="#3b82f6">{t('Reproducción')}</Eyebrow>
      <H1>{name ? `${name}, ` : ''}{t('el próximo celo de')} {dogName} {t('se acerca')}</H1>
      <P>
        {t('Según el historial de')} <strong>{dogName}</strong>, {t('su próximo celo se estima alrededor del')}{' '}
        <strong>{heatDate}</strong> ({t('en unos')} {daysUntil} {t('días')}). {t('Buen momento para planificar el cruce si toca.')}
      </P>
      <Btn href={`${SITE_URL}/reproduccion`}>{t('Ver calendario reproductivo')}</Btn>
      <Small>{t('Estimación basada en el intervalo medio entre los celos anteriores de')} {dogName}. {t('Puede variar.')}</Small>
    </EmailLayout>
  )
}
