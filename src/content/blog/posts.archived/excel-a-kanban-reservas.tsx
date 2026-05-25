import { H2, H3, P, Lead, UL, LI, Strong, Callout, PostCta, Hr, Em, Quote } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'excel-a-kanban-reservas',
  title: 'De Excel a Kanban: por qué ya no llevo las reservas en una hoja de cálculo',
  excerpt:
    'Storytelling en primera persona de la transición. Qué pasaba antes, qué pasa ahora, y el momento exacto en el que dije «no vuelvo atrás».',
  date: '2026-05-04',
  category: 'Para criadores',
  heroImage:
    'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Tablero Kanban con notas adhesivas amarillas y rosas pegadas a una pared',
  readMinutes: 6,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Durante 11 años llevé las reservas de mis camadas en un Excel. Funcionaba. Mal, pero
        funcionaba. Hasta que un día doble-reservé un cachorro y casi pierdo a un cliente que
        venía de Bélgica. Aquí cuento cómo cambié al pipeline de Genealogic y por qué no vuelvo
        atrás.
      </Lead>

      <H2>Cómo era mi Excel</H2>
      <P>
        Una pestaña por camada. Columnas: nombre del interesado, email, teléfono, fecha de
        contacto, sexo del cachorro pedido, color, observaciones, seña pagada (sí/no), contrato
        firmado (sí/no), fecha de entrega prevista.
      </P>
      <P>
        Funcionaba mientras tuviera <Strong>una camada al año</Strong> y máximo 12 - 15
        interesados. Cuando empecé a manejar 3 camadas al año con dos razas distintas, el sistema
        empezó a fallar:
      </P>
      <UL>
        <LI>
          No sabía a primera vista cuántos cachorros tenía comprometidos vs. disponibles.
        </LI>
        <LI>
          Reservas viejas se mezclaban con reservas activas. ¿Esto era de marzo o de octubre?
        </LI>
        <LI>
          Si actualizaba el Excel desde el móvil mientras conducía (sí, mal hecho), perdía la
          edición.
        </LI>
        <LI>
          Si un cliente pagaba seña por Bizum y olvidaba apuntarlo el mismo día, lo perdía.
        </LI>
      </UL>

      <H2>El incidente</H2>
      <P>
        Camada de noviembre. Quedaban 2 hembras. Tenía marcado en el Excel a Pilar (Cádiz) con
        seña pagada para la hembra más grande. Un mes después, sin actualizar bien la columna,
        confirmé esa misma hembra por WhatsApp a un cliente belga que llevaba meses esperando.
      </P>
      <P>
        Cuando me di cuenta, ya había dos personas con la expectativa firme del mismo cachorro.
        Acabé desviando al cliente belga a otra camada en otra de mis líneas, ofreciendo
        descuento, y enviando una foto extra cada semana hasta la entrega para compensar. Me
        salió cara la disculpa, pero salvé la relación. Lo que me jodió no fue el dinero. Fue
        sentir que mi sistema había fallado y que el cliente lo había notado.
      </P>

      <H2>Por qué Kanban</H2>
      <P>
        Un Kanban es un tablero con columnas. Cada tarjeta es un cliente. Las columnas son los
        estados por los que pasa una venta. Lo importante: <Strong>una tarjeta solo puede estar
        en una columna a la vez</Strong>. Es imposible que un mismo cliente esté como «seña
        pagada» y como «contrato firmado» simultáneamente sin que tú lo veas.
      </P>
      <P>Las columnas que uso ahora (preconfiguradas en Genealogic Pro):</P>
      <UL>
        <LI>
          <Strong>Interesados</Strong>: ha escrito pero no ha confirmado nada.
        </LI>
        <LI>
          <Strong>Lista de espera</Strong>: confirma que quiere cachorro de la siguiente camada
          (a 6 - 18 meses vista).
        </LI>
        <LI>
          <Strong>Visita programada</Strong>: tiene cita para ver las instalaciones.
        </LI>
        <LI>
          <Strong>Seña pagada</Strong>: tarjeta tiene importe y fecha. Bloquea cachorro.
        </LI>
        <LI>
          <Strong>Contrato firmado</Strong>: PDF firmado adjunto a la tarjeta.
        </LI>
        <LI>
          <Strong>Asignado</Strong>: cachorro concreto asociado a la tarjeta.
        </LI>
        <LI>
          <Strong>Pago completo</Strong>: liquidado, esperando entrega.
        </LI>
        <LI>
          <Strong>Entregado</Strong>: cachorro recogido. Tarjeta sigue activa para seguimiento
          post-venta.
        </LI>
      </UL>
      <Callout kind="info" title="Por qué bloquea cachorros">
        En cuanto arrastras una tarjeta a «Seña pagada», la plataforma marca el cachorro
        asignado como reservado en el catálogo público. Si otro cliente entra a la web del
        criadero, ya no lo ve disponible. <Em>Imposible doble-reservar.</Em>
      </Callout>

      <H2>Lo que cambia en la práctica</H2>

      <H3>Visualización del estado de la camada</H3>
      <P>
        Antes abría el Excel y contaba con el dedo. Ahora miro el tablero y veo:
      </P>
      <UL>
        <LI>3 cachorros con seña pagada (verdes).</LI>
        <LI>2 cachorros con contrato firmado (azules).</LI>
        <LI>1 cachorro asignado pendiente de seña (naranja, urgente).</LI>
        <LI>2 cachorros disponibles aún (sin tarjeta).</LI>
      </UL>
      <P>De un vistazo. 5 segundos.</P>

      <H3>Cliente con historial</H3>
      <P>
        Cada tarjeta es también la ficha del cliente. Veo todos los emails que cruzamos, las
        notas que apunté en la visita, los pagos que ha hecho, los contratos firmados, el
        cachorro asignado y, después de la entrega, las actualizaciones que me manda con fotos
        del perro adulto.
      </P>
      <P>
        Eso construye <Strong>memoria institucional</Strong>. Si un cliente vuelve a por
        segundo cachorro 4 años después, abro su ficha y sé qué perro le entregué, qué línea era,
        cómo le fue. Mi conversación arranca con contexto, no con «¿cómo dijo que se llamaba?».
      </P>

      <H3>Drag-and-drop entre columnas</H3>
      <P>
        Mover una tarjeta de «Interesados» a «Visita programada» es arrastrar. La plataforma
        registra el cambio de estado con timestamp. Si quiero ver cuánto tarda mi pipeline en
        cada fase, hay un reporte automático.
      </P>

      <H3>Notificaciones cuando algo se queda</H3>
      <P>
        Si una tarjeta lleva más de 14 días en «Visita programada» sin avanzar, Genealogic me
        manda recordatorio. Si llega una seña por Stripe, el pipeline avanza solo. Si pasa el
        plazo de pago final con menos del 50 % cobrado, alerta.
      </P>

      <H2>Lo que sigo haciendo igual</H2>
      <P>El sistema cambia la mecánica, no el criterio:</P>
      <UL>
        <LI>
          Sigo entrevistando a cada comprador antes de aceptar la seña.
        </LI>
        <LI>
          Sigo rechazando reservas que no me cuadran (cría irresponsable, condiciones
          de vida malas, expectativas raras).
        </LI>
        <LI>
          Sigo manteniendo contacto post-venta durante el primer año.
        </LI>
      </UL>
      <P>
        Lo que la herramienta hace es eliminar el «se me pasó», el «creía que era para
        después», el «no me apunté el ingreso». Mi criterio sigue siendo mío.
      </P>

      <Quote source="Manuel, criador Cane Corso, Galicia">
        Lo que más me sorprendió no fue lo que ahorra de tiempo, fue lo profesional que me hace
        parecer al cliente. Le envío un link, ve su reserva, ve el cachorro asignado, ve el
        contrato. Antes les pedía que confiaran en mi Excel. Ahora les enseño el sistema.
      </Quote>

      <Hr />

      <P>
        No vuelvo a Excel. Y dudo que vuelvas tú una vez pruebes.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
