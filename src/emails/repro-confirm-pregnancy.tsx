import { EmailLayout, H1, P, Btn, Eyebrow, Small, SITE_URL } from './_components'

export interface ReproConfirmPregnancyProps {
  recipientName?: string | null
  dogName: string
  /** Fecha de la monta, formateada (es-ES). */
  matingDate: string
  /** Fecha estimada de parto si quedó preñada, formateada (es-ES). */
  expectedBirth: string
}

export default function ReproConfirmPregnancyEmail({
  recipientName, dogName, matingDate, expectedBirth,
}: ReproConfirmPregnancyProps) {
  const name = recipientName?.split(' ')[0] || null
  return (
    <EmailLayout preview={`¿${dogName} está preñada? Toca confirmarlo`}>
      <Eyebrow color="#f59e0b">Confirmar preñez</Eyebrow>
      <H1>{name ? `${name}, ` : ''}¿{dogName} está preñada?</H1>
      <P>
        Han pasado ~28 días desde la monta de <strong>{dogName}</strong> ({matingDate}) — el momento típico
        para confirmar la preñez por ecografía o palpación.
      </P>
      <P>
        Entra en su ficha y confírmalo: si quedó preñada, marcaremos el parto previsto para el{' '}
        <strong>{expectedBirth}</strong> y te avisaremos cuando se acerque. Si no, vuelve a reposo.
      </P>
      <Btn href={`${SITE_URL}/reproduccion`}>Confirmar el estado de {dogName}</Btn>
      <Small>Lo gestionas desde el calendario reproductivo o desde la pestaña Reproducción de su ficha.</Small>
    </EmailLayout>
  )
}
