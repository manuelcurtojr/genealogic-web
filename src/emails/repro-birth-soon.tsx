import { EmailLayout, H1, P, Btn, Eyebrow, Small, SITE_URL } from './_components'

export interface ReproBirthSoonProps {
  recipientName?: string | null
  dogName: string
  /** Fecha estimada de parto, formateada (es-ES). */
  expectedBirth: string
  /** Días que faltan (0 = sale de cuentas hoy). */
  daysUntil: number
}

export default function ReproBirthSoonEmail({ recipientName, dogName, expectedBirth, daysUntil }: ReproBirthSoonProps) {
  const name = recipientName?.split(' ')[0] || null
  const isToday = daysUntil <= 0
  return (
    <EmailLayout preview={isToday ? `${dogName} sale de cuentas hoy` : `${dogName} sale de cuentas en ${daysUntil} días`}>
      <Eyebrow color="#e84393">Parto previsto</Eyebrow>
      <H1>
        {name ? `${name}, ` : ''}
        {isToday ? `${dogName} sale de cuentas hoy` : `el parto de ${dogName} se acerca`}
      </H1>
      <P>
        {isToday ? (
          <>Hoy es la <strong>fecha estimada de parto</strong> de {dogName}. Ten todo preparado para la camada.</>
        ) : (
          <>El parto previsto de <strong>{dogName}</strong> es el <strong>{expectedBirth}</strong> (en {daysUntil} días). Prepara el paritorio y avisa a tu veterinario.</>
        )}
      </P>
      <Btn href={`${SITE_URL}/reproduccion`}>Ver calendario reproductivo</Btn>
      <Small>Estimación a 63 días desde la monta. Cuando nazcan, registra la camada para llevar el control de los cachorros.</Small>
    </EmailLayout>
  )
}
