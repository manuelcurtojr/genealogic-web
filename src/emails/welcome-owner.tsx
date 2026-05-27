/**
 * Welcome email para propietarios recién registrados.
 * Se envía justo tras signup cuando intent='owner'.
 */
import { EmailLayout, H1, P, Btn, Eyebrow, Divider, Small, SITE_URL } from './_components'

export type WelcomeOwnerProps = {
  displayName: string | null
}

export default function WelcomeOwnerEmail({ displayName }: WelcomeOwnerProps) {
  const name = displayName?.split(' ')[0] || null
  return (
    <EmailLayout preview="Bienvenido a Genealogic. La ficha digital de tu perro empieza aquí.">
      <Eyebrow>Bienvenido</Eyebrow>
      <H1>Hola{name ? `, ${name}` : ''}. La ficha de tu perro empieza aquí.</H1>
      <P>
        Genealogic es gratis para propietarios. Tu cuenta ya está activa y puedes
        empezar a documentar a tu perro: genealogía, papeles, vacunas y galería en un solo
        sitio.
      </P>

      <P>Qué puedes hacer ahora:</P>

      <ol style={{ paddingLeft: '20px', margin: '0 0 18px 0' }}>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>Añade tu primer perro</strong> con foto, raza
          y fecha de nacimiento.
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>Sube los papeles</strong> (cartilla, genealogía,
          contrato). Todo escaneado y a mano cuando los necesites.
        </li>
        <li style={{ marginBottom: '8px', color: '#374151', fontSize: '15px', lineHeight: 1.6 }}>
          <strong style={{ color: '#111111' }}>Activa los recordatorios vet</strong>: te
          avisamos antes de cada vacuna.
        </li>
      </ol>

      <Btn href={`${SITE_URL}/dogs`}>Añadir mi primer perro</Btn>

      <Divider />

      <P>
        ¿Tu perro ya está en Genealogic? Es posible — tenemos miles de perros importados
        de clubes de raza. Búscalo en{' '}
        <a href={`${SITE_URL}/search`} style={{ color: '#111111' }}>/search</a> y reclámalo
        si lo encuentras.
      </P>

      <Small>
        Sin tarjeta, sin trials, sin anuncios. La plataforma se sostiene con los criadores
        que pagan — tú nunca.
      </Small>
    </EmailLayout>
  )
}
