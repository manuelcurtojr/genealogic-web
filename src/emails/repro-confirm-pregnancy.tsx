import { EmailLayout, H1, P, Btn, Eyebrow, Small, SITE_URL } from './_components'
import { getTranslator } from '@/lib/i18n'

export interface ReproConfirmPregnancyProps {
  recipientName?: string | null
  dogName: string
  /** Fecha de la monta, formateada (es-ES). */
  matingDate: string
  /** Fecha estimada de parto si quedó preñada, formateada (es-ES). */
  expectedBirth: string
  locale?: string
}

export default function ReproConfirmPregnancyEmail({
  recipientName, dogName, matingDate, expectedBirth, locale,
}: ReproConfirmPregnancyProps) {
  const t = getTranslator(locale || 'es')
  const name = recipientName?.split(' ')[0] || null
  return (
    <EmailLayout preview={`¿${dogName} ${t('está preñada? Toca confirmarlo')}`} locale={locale}>
      <Eyebrow color="#f59e0b">{t('Confirmar preñez')}</Eyebrow>
      <H1>{name ? `${name}, ` : ''}¿{dogName} {t('está preñada?')}</H1>
      <P>
        {t('Han pasado ~28 días desde la monta de')} <strong>{dogName}</strong> ({matingDate}) {t('— el momento típico para confirmar la preñez por ecografía o palpación.')}
      </P>
      <P>
        {t('Entra en su ficha y confírmalo: si quedó preñada, marcaremos el parto previsto para el')}{' '}
        <strong>{expectedBirth}</strong> {t('y te avisaremos cuando se acerque. Si no, vuelve a reposo.')}
      </P>
      <Btn href={`${SITE_URL}/reproduccion`}>{t('Confirmar el estado de')} {dogName}</Btn>
      <Small>{t('Lo gestionas desde el calendario reproductivo o desde la pestaña Reproducción de su ficha.')}</Small>
    </EmailLayout>
  )
}
