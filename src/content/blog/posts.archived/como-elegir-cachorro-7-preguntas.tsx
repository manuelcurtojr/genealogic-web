import { H2, H3, P, Lead, UL, LI, Strong, Callout, PostCta, Hr, Em } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'como-elegir-cachorro-7-preguntas',
  title: 'Cómo elegir un cachorro: 7 preguntas que separan a un criador serio de un revendedor',
  excerpt:
    'Vas a invertir 10 - 15 años con este perro. Estas son las siete preguntas que un criador honesto contesta sin titubear — y que a un revendedor le incomodan.',
  date: '2026-04-25',
  category: 'Para compradores',
  heroImage:
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Cachorro de pelaje claro mirando directamente a cámara con expresión curiosa',
  readMinutes: 7,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Comprar un cachorro no es como comprar un mueble. Te llevas un compromiso de 10 - 15 años,
        decenas de miles de euros en gastos a lo largo de su vida, y un vínculo emocional con tu
        familia. Saber distinguir a un criador serio de un revendedor te puede ahorrar problemas
        graves. Aquí están las siete preguntas a hacer.
      </Lead>

      <H2>1. «¿Puedo ver las instalaciones donde viven los padres y los cachorros?»</H2>
      <P>
        <Strong>Respuesta correcta</Strong>: «Sí, cuando quieras, ven con cita previa».
      </P>
      <P>
        <Strong>Señal de alarma</Strong>: «No, los enviamos a domicilio», «Estamos en una nave a
        las afueras», «Solo entregas en el aparcamiento del centro comercial».
      </P>
      <P>
        Un criador serio quiere que veas dónde nacen sus cachorros. Es su mejor argumento de
        venta. Los revendedores y las fábricas de cachorros (puppy mills) evitan que pongas un
        pie en sus instalaciones porque las condiciones son las que son.
      </P>

      <H2>2. «¿Puedo conocer a los dos padres?»</H2>
      <P>
        <Strong>Respuesta correcta</Strong>: «A la madre seguro, está con los cachorros. Al padre
        depende — si es nuestro, sí; si vino de fuera, te paso vídeo y datos del propietario para
        que lo verifiques».
      </P>
      <P>
        <Strong>Señal de alarma</Strong>: «La madre está descansando en otra zona», «El padre
        está en otra finca», ningún ofrecimiento de fotos o vídeo, evasión.
      </P>
      <P>
        La madre debe estar con los cachorros hasta las 8 - 10 semanas. Si te dicen que «no la
        tienen aquí», probablemente los cachorros vienen de otro sitio (un criadero industrial
        que vende a un intermediario). Ese intermediario es el que tienes delante.
      </P>

      <H2>3. «¿Qué pruebas sanitarias oficiales tienen los padres?»</H2>
      <P>
        <Strong>Respuesta correcta</Strong>: una lista concreta con resultados y fechas. Por
        ejemplo: «HD-A oficial RSCE 2024, ED-0 oficial, ecocardio limpio del año pasado, panel
        genético Embark con 11 mutaciones de raza negativas».
      </P>
      <P>
        <Strong>Señal de alarma</Strong>: «Están sanos, los vio el veterinario». «Mi línea no
        tiene problemas». «Mis padres llevan 30 años criando, no hace falta».
      </P>
      <P>
        Un criador serio te enseña los certificados oficiales escaneados. Esto incluye el sello
        del veterinario certificador (no del de cabecera) y la fecha. Pídelos por escrito antes
        de pagar nada. Más detalle en{' '}
        <Strong>nuestra guía de pruebas sanitarias por raza</Strong>.
      </P>

      <H2>4. «¿Me enseñas el pedigree de los padres y, si lo tienes, el árbol de 5 generaciones?»</H2>
      <P>
        <Strong>Respuesta correcta</Strong>: enseña el papel original con sello de RSCE/FCI o
        equivalente, o un link a la plataforma donde está registrado, sin problema.
      </P>
      <P>
        <Strong>Señal de alarma</Strong>: «El papel lo tramita el club después», «Es papel
        sin pedigree pero raza pura», o intentar venderte un «pedigree» de una asociación
        desconocida que nadie reconoce.
      </P>
      <Callout kind="warning" title="Importante">
        En España solo son válidos los pedigrees emitidos por la RSCE (filial FCI) y, para
        algunas razas específicas, los emitidos por clubes raciales con convenio FCI. Si te
        ofrecen un «pedigree» de una asociación con nombre raro, busca en Google si esa
        asociación pertenece a la FCI. Si no aparece, no es pedigree oficial.
      </Callout>

      <H2>5. «¿A qué edad entregáis los cachorros y con qué documentación?»</H2>
      <P>
        <Strong>Respuesta correcta</Strong>: «A las 8 - 10 semanas. Te llevas: cartilla
        sanitaria con vacunas y desparasitación al día, certificado de microchip con cambio de
        titularidad ya iniciado, contrato de compraventa, factura, pedigree o resguardo de
        tramitación, y una pauta de alimentación y socialización para las primeras semanas».
      </P>
      <P>
        <Strong>Señal de alarma</Strong>: «Lo entregamos a las 6 semanas», «El microchip te lo
        pones tú», «No hace falta contrato entre confianza», «El pedigree te llega en unos
        meses sin más».
      </P>
      <P>
        Entregar antes de las 8 semanas es ilegal en España y un signo claro de
        irresponsabilidad — el cachorro no ha completado la fase de socialización con la madre y
        los hermanos, y tendrá problemas de conducta de por vida.
      </P>

      <H2>6. «¿Qué garantías ofrecéis si aparece una enfermedad congénita?»</H2>
      <P>
        <Strong>Respuesta correcta</Strong>: una política clara por escrito. Lo normal es: si
        en los primeros 12 - 24 meses aparece una enfermedad congénita grave (displasia severa
        diagnosticada oficialmente, problema cardíaco, ataxia), el criador o devuelve parte del
        importe, o sustituye el cachorro por otro de una camada posterior, o cubre parte del
        tratamiento. Hay variantes, pero hay <Em>política</Em>.
      </P>
      <P>
        <Strong>Señal de alarma</Strong>: «Mis cachorros nunca han tenido problemas»,
        ambigüedad, negativa a poner nada por escrito.
      </P>
      <P>
        Cualquier criador honesto sabe que la genética tiene componente aleatorio: incluso con
        los mejores padres testados, una mutación espontánea puede aparecer. Si te dicen que
        nunca pasa, mienten o no llevan suficiente tiempo criando.
      </P>

      <H2>7. «Si en el futuro no puedo quedarme con el perro, ¿qué hago?»</H2>
      <P>
        <Strong>Respuesta correcta</Strong>: «Me lo devuelves a mí, sin coste. No quiero que
        ningún perro mío acabe en una protectora».
      </P>
      <P>
        <Strong>Señal de alarma</Strong>: «Eso es problema tuyo», «Lo puedes vender»,
        desinterés.
      </P>
      <P>
        Esta es probablemente la pregunta que más rápido distingue al criador del revendedor. Un
        criador serio considera a sus cachorros parte de su trabajo de toda la vida y se siente
        responsable de ellos. Un revendedor los considera mercancía: una vez vendidos, no son su
        problema.
      </P>

      <Hr />

      <H2>Bonus: las preguntas que el criador serio te hace a ti</H2>
      <P>
        Si vas a ver un criadero y el criador acepta tu seña sin preguntarte nada, tampoco es
        buena señal. Un criador serio te entrevista a ti antes de venderte un cachorro:
      </P>
      <UL>
        <LI>¿Has tenido perros antes? ¿De qué raza?</LI>
        <LI>¿Cómo es tu casa? ¿Tienes patio? ¿Vives en piso?</LI>
        <LI>¿Cuántas horas al día estará solo el perro?</LI>
        <LI>¿Quién lo va a cuidar cuando estés de viaje?</LI>
        <LI>¿Te has informado sobre las necesidades específicas de esta raza?</LI>
        <LI>¿Has visto el carácter de los padres antes de decidir?</LI>
      </UL>
      <P>
        Si te entrevista, es porque le importa adónde va su cachorro. Esa es la persona a la que
        le quieres comprar.
      </P>

      <H2>Cómo verificar antes de la visita</H2>
      <P>
        Antes incluso de pedir cita, busca al criadero en{' '}
        <Strong>Genealogic</Strong>. Si tiene perfil:
      </P>
      <UL>
        <LI>Verás todos los perros registrados bajo su afijo.</LI>
        <LI>Verás las camadas anteriores con los compradores que las recibieron (si han hecho público).</LI>
        <LI>Verás las pruebas sanitarias de los reproductores actuales.</LI>
        <LI>Verás los árboles genealógicos de los cachorros disponibles.</LI>
        <LI>Verás la antigüedad del criadero (cuándo se registró el afijo).</LI>
      </UL>
      <P>
        Si no tiene perfil, no es descalificatorio (hay criaderos viejos que aún no se
        digitalizaron). Pero abre la conversación con: «¿no estáis en Genealogic? ¿Os interesa
        registraros?». Su respuesta te dirá mucho.
      </P>

      <PostCta variant="register" />
    </>
  )
}
