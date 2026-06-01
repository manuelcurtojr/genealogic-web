import { EmailLayout, H1, P, Btn, Eyebrow, Small, SITE_URL } from './_components'
import { getTranslator } from '@/lib/i18n'

export interface ReproBirthSoonProps {
  recipientName?: string | null
  dogName: string
  /** Fecha estimada de parto, formateada (es-ES). */
  expectedBirth: string
  /** Días que faltan (0 = sale de cuentas hoy). */
  daysUntil: number
  locale?: string
}

export default function ReproBirthSoonEmail({ recipientName, dogName, expectedBirth, daysUntil, locale }: ReproBirthSoonProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  const isToday = daysUntil <= 0
  return (
    <EmailLayout preview={isToday ? `${dogName} ${t('sale de cuentas hoy')}` : `${dogName} ${t('sale de cuentas en')} ${daysUntil} ${t('días')}`} locale={locale}>
      <Eyebrow color="#e84393">{t('Parto previsto')}</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {isToday ? `${dogName} ${t('sale de cuentas hoy')}` : `${t('el parto de')} ${dogName} ${t('se acerca')}`}
      </H1>
      <P>
        {isToday ? (
          <>{t('Hoy es la')} <strong>{t('fecha estimada de parto')}</strong> {t('para')} {dogName}. {t('Ten todo preparado para la camada.')}</>
        ) : (
          <>{t('El parto previsto de')} <strong>{dogName}</strong> {t('es el')} <strong>{expectedBirth}</strong> ({t('dentro de')} {daysUntil} {t('días')}). {t('Prepara el paritorio y avisa a tu veterinario.')}</>
        )}
      </P>
      <Btn href={`${SITE_URL}/reproduccion`}>{t('Ver calendario reproductivo')}</Btn>
      <Small>{t('Estimación a 63 días desde la monta. Cuando nazcan, registra la camada para llevar el control de los cachorros.')}</Small>
    </EmailLayout>
  )
}
