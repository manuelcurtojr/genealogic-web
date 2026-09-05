import { H2, P, Lead, OL, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'gestionar-reservas-camada',
  title: 'Gestionar las reservas de una camada sin volverte loco (adiós Excel y WhatsApp)',
  excerpt:
    'Ocho cachorros, veinte interesados y las señales apuntadas en WhatsApp. Así se gestiona la lista de reservas de una camada con orden, sin promesas cruzadas.',
  date: '2026-09-05',
  category: 'Para criadores',
  heroImage:
    '/blog/gestionar-reservas-camada.jpg',
  heroAlt: 'Tablero con las reservas de una camada organizadas por etapas',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Nace la camada, publicas una foto y en dos días tienes veinte personas interesadas por ocho
        cachorros. Y empieza el baile.
      </Lead>
      <P>
        Uno dio señal, otro «casi seguro», otro quería el macho que ya está pillado, y todo apuntado
        entre conversaciones de WhatsApp y un papel encima de la mesa. Al final acabas prometiendo el
        mismo cachorro a dos personas y quedando mal con alguien. Nos ha pasado a todos. El problema
        no eres tú: es no tener un sistema. Y montar uno es más fácil de lo que parece.
      </P>

      <H2>Piensa en etapas, no en una lista suelta</H2>
      <P>
        Una reserva no es un sí o un no; pasa por fases. Si las separas, dejas de perderte:
      </P>
      <OL>
        <LI>
          <Strong>Interesado</Strong> — ha preguntado, aún no hay nada firme.
        </LI>
        <LI>
          <Strong>Con señal</Strong> — ha pagado la reserva. Este va por delante.
        </LI>
        <LI>
          <Strong>Asignado</Strong> — tiene un cachorro concreto reservado.
        </LI>
        <LI>
          <Strong>Contrato firmado</Strong> — condiciones cerradas por escrito.
        </LI>
        <LI>
          <Strong>Entregado</Strong> — cerrado.
        </LI>
      </OL>
      <P>
        Cada persona está en una etapa, con su fecha y su cachorro. De un vistazo sabes a quién le
        toca, a quién falta cobrar y qué cachorros quedan libres.
      </P>

      <H2>Reglas que evitan el 90% de los líos</H2>
      <UL>
        <LI>
          <Strong>La señal marca el orden.</Strong> Interesados hay muchos; el que paga, reserva. Sé
          claro con esto desde el principio y se acaban las promesas cruzadas.
        </LI>
        <LI>
          <Strong>Un cachorro, un dueño.</Strong> No «apalabres» el mismo animal dos veces. Si aún
          no hay señal, es lista de espera, no reserva.
        </LI>
        <LI>
          <Strong>Comunica el estado.</Strong> Un mensaje corto («estás el tercero en la lista para
          hembra») vale más que diez cachorros prometidos a medias.
        </LI>
        <LI>
          <Strong>Apunta los cobros.</Strong> Quién dio señal, cuánto falta, cuándo. El dinero es lo
          primero que se olvida y lo que más incomoda reclamar.
        </LI>
      </UL>

      <H2>Deja de llevarlo en la cabeza</H2>
      <P>
        Todo esto se puede hacer con un Excel… hasta que tienes tres camadas a la vez y el Excel se
        convierte en otro caos. En Genealogic tienes un <Strong>embudo de reservas</Strong> pensado
        justo para esto: cada interesado en su etapa, la lista de espera ordenada, los pagos
        controlados y los contratos enganchados a cada reserva. Arrastras a la persona de una etapa a
        otra y ya está.
      </P>
      <Callout kind="info" title="El detalle que lo cambia todo">
        En cuanto marcas una reserva con señal, el cachorro asignado queda bloqueado. Nadie más lo
        ve disponible. Doble-reservar deja de ser posible.
      </Callout>
      <P>
        Lo que antes te robaba la cabeza durante semanas pasa a ser una pantalla que miras un minuto
        al día. Y ningún comprador se queda colgado.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
