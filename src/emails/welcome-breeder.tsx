/**
 * Welcome email para criadores recién registrados.
 * Se envía justo tras signup cuando intent='breeder'.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL } from './_components'

export type WelcomeBreederProps = {
  displayName: string | null
}

export default function WelcomeBreederEmail({ displayName }: WelcomeBreederProps) {
  const name = displayName?.split(' ')[0] || null
  return (
    <EmailLayout preview="Bienvenido a Genealogic. Vamos a poner tu criadero en marcha.">
      <Eyebrow>Bienvenido</Eyebrow>
      <H1>Hola{name ? `, ${name}` : ''}. Vamos a poner tu criadero en marcha.</H1>
      <P>
        Acabas de crear tu cuenta en Genealogic. En 10 minutos puedes tener tu afijo
        publicado, tu web pública activa y tu pipeline de reservas funcionando.
      </P>
      <P>Aquí tienes los 3 primeros pasos:</P>

      <ol style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>Crea tu criadero</strong> (logo, descripción,
          país). Es tu marca dentro de Genealogic.
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>Añade tus reproductores</strong> con foto y
          genealogía. Cuanto más completo, más confianza generas.
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>Publica tu web</strong> con el builder o
          conecta tu dominio.
        </li>
      </ol>

      <Btn href={`${SITE_URL}/dashboard`}>Ir a mi panel</Btn>

      <Divider />

      <P>
        ¿Dudas? Escríbenos a <a href="mailto:hola@genealogic.io" style={{ color: '#111111' }}>hola@genealogic.io</a>{' '}
        o pregunta a Genos (el chat de la esquina). Te respondemos en menos de 24h.
      </P>

      <Small>
        Pro-tip: el emailbot puede responder a leads cuando estés desconectado. Lo configuras
        desde /emailbot cuando tengas tu criadero listo.
      </Small>
    </EmailLayout>
  )
}
