import { EmailLayout, H1, P, Btn, Eyebrow, Small, SITE_URL } from './_components'

export interface ReproNextHeatProps {
  recipientName?: string | null
  dogName: string
  /** Fecha estimada del celo, ya formateada (es-ES). */
  heatDate: string
  daysUntil: number
}

export default function ReproNextHeatEmail({ recipientName, dogName, heatDate, daysUntil }: ReproNextHeatProps) {
  const name = recipientName?.split(' ')[0] || null
  return (
    <EmailLayout preview={`El próximo celo de ${dogName} se acerca (${heatDate})`}>
      <Eyebrow color="#3b82f6">Reproducción</Eyebrow>
      <H1>{name ? `${name}, ` : ''}el próximo celo de {dogName} se acerca</H1>
      <P>
        Según el historial de <strong>{dogName}</strong>, su próximo celo se estima alrededor del{' '}
        <strong>{heatDate}</strong> (en unos {daysUntil} días). Buen momento para planificar el cruce si toca.
      </P>
      <Btn href={`${SITE_URL}/reproduccion`}>Ver calendario reproductivo</Btn>
      <Small>Estimación basada en el intervalo medio entre los celos anteriores de {dogName}. Puede variar.</Small>
    </EmailLayout>
  )
}
