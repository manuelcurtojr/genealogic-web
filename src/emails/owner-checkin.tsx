/**
 * Email de check-in para propietarios ~2 días después de registrarse.
 *
 * Estilo "founder email": sobrio, personal, en primera persona de Manuel.
 * Sin botones grandes de marketing — el objetivo es que el owner RESPONDA
 * contando si tuvo problemas o qué necesita. El reply-to apunta a
 * manuel@genealogic.io para que las respuestas le lleguen directas.
 *
 * Se manda 1 sola vez por usuario (dedupe en el cron via email_log).
 */
import { EmailLayout, P, SITE_URL, COLORS } from './_components'

export type OwnerCheckinProps = {
  displayName: string | null
  /** true si el owner aún NO ha creado ningún perro — personaliza el copy */
  hasDog: boolean
}

export default function OwnerCheckinEmail({ displayName, hasDog }: OwnerCheckinProps) {
  const name = displayName?.split(' ')[0] || null

  return (
    <EmailLayout preview="Una pregunta rápida sobre tus primeros días en Genealogic">
      <P style={{ marginTop: 8 }}>Hola{name ? `, ${name}` : ''}:</P>

      <P>
        Soy Manuel, estoy detrás de Genealogic. Vi que te registraste hace
        unos días y quería preguntarte directamente qué tal te ha ido.
      </P>

      {hasDog ? (
        <P>
          ¿Pudiste crear la ficha de tu perro sin problemas? ¿Hubo algo que no
          funcionó como esperabas o que te resultó confuso?
        </P>
      ) : (
        <P>
          Vi que aún no has añadido a tu perro. ¿Te atascaste en algún punto, o
          hubo algo que no terminó de encajar? Si me cuentas qué pasó, te echo
          una mano para dejarlo listo en un momento.
        </P>
      )}

      <P>
        Sea lo que sea —un fallo, una duda, una idea, o simplemente contarme qué
        buscas hacer con Genealogic— <strong style={{ color: COLORS.ink }}>respóndeme
        a este correo</strong>. Lo leo yo personalmente y te contesto.
      </P>

      <P>
        Gracias por probarlo. Me ayuda mucho saber qué funciona y qué no.
      </P>

      <P style={{ margin: '20px 0 0 0' }}>
        Un saludo,<br />
        Manuel<br />
        <span style={{ color: COLORS.muted, fontSize: 13 }}>Genealogic · {SITE_URL.replace('https://', '')}</span>
      </P>
    </EmailLayout>
  )
}
