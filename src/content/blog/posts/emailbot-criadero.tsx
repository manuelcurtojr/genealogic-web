import { H2, H3, P, Lead, UL, LI, Strong, Callout, PostCta, Hr, Em, Quote } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'emailbot-criadero',
  title: 'El emailbot que contesta a tus compradores con tu tono (y por qué tarde o temprano lo necesitas)',
  excerpt:
    'Cuando una camada se anuncia, llegan 50 emails con las mismas preguntas. El emailbot de Genealogic responde con tu tono, usando tu biblioteca de conocimiento. Tú revisas antes de enviar.',
  date: '2026-05-07',
  category: 'Plataforma',
  heroImage:
    'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Notificación de email iluminada sobre fondo oscuro',
  readMinutes: 7,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        El día que publicas «camada disponible», tu bandeja de entrada se convierte en un infierno
        de mensajes repetitivos. El 80 % son las mismas 6 preguntas. Y aún así, contestarlas mal o
        tarde cuesta ventas. El emailbot de Genealogic resuelve este patrón.
      </Lead>

      <H2>El problema, cuantificado</H2>
      <P>
        Una camada de 8 cachorros bien publicada genera, según los criadores con los que hemos
        hablado, entre <Strong>40 y 120 emails de interés</Strong> en las primeras dos semanas.
        Las preguntas se repiten:
      </P>
      <UL>
        <LI>«¿Cuánto cuesta el cachorro?»</LI>
        <LI>«¿Tenéis macho rojo / hembra atigrada / etc. disponible?»</LI>
        <LI>«¿A qué edad se entrega?»</LI>
        <LI>«¿Hace falta seña? ¿Cuánto?»</LI>
        <LI>«¿Los padres tienen pruebas de cadera / cardio?»</LI>
        <LI>«¿Mandáis fuera de la provincia?»</LI>
      </UL>
      <P>
        Si tardas 24 - 48 h en contestar cada uno (que es lo normal), el comprador se va a otro
        criador. Si contestas rápido pero con plantilla genérica, el comprador no se siente
        atendido. Pierdes igual.
      </P>

      <H2>Por qué un bot genérico no sirve</H2>
      <P>
        Probablemente has visto bots tipo ChatGPT integrados en webs. No funcionan para esto por
        tres razones:
      </P>
      <UL>
        <LI>
          <Strong>No saben tus datos específicos</Strong>. Un bot genérico no sabe que tu camada
          de marzo es Estrella × Tornado, ni que tienes 4 hembras y 3 machos disponibles, ni que
          el precio es 1.800 € con HD-A garantizado.
        </LI>
        <LI>
          <Strong>No tienen tu tono</Strong>. Tu reputación se ha construido escribiendo como
          escribes tú. Si de pronto contestas con el español pulido y aséptico de un bot, el
          comprador se huele que es automatizado y desconfía.
        </LI>
        <LI>
          <Strong>No están conectados al resto del flujo</Strong>. Un bot que contesta pero no
          crea ficha de cliente, no engancha la reserva al pipeline, no agenda la visita... no
          ahorra trabajo, solo lo retrasa.
        </LI>
      </UL>

      <H2>Cómo lo hace el emailbot de Genealogic</H2>

      <H3>1. Conectas tu email</H3>
      <P>
        El bot vive en una dirección dedicada (por ejemplo <Em>hola@tucriadero.com</Em>) que
        configuras con un MX record en tu dominio. Cada email entrante pasa por nuestro pipeline.
      </P>

      <H3>2. Lo lee y lo clasifica</H3>
      <P>El bot identifica:</P>
      <UL>
        <LI>
          <Strong>Tipo de consulta</Strong>: interés en camada, pregunta técnica, queja,
          seguimiento post-venta, spam.
        </LI>
        <LI>
          <Strong>Información extraíble</Strong>: nombre del comprador, ubicación, raza/camada
          que le interesa, preferencias (sexo, color, edad).
        </LI>
        <LI>
          <Strong>Urgencia</Strong>: si menciona seña, pago, fecha de recogida — sube prioridad.
        </LI>
      </UL>

      <H3>3. Redacta una respuesta usando tu biblioteca</H3>
      <P>
        Aquí está el truco. Tú alimentas al bot con tu <Strong>biblioteca de conocimiento</Strong>:
        documentos markdown que viven en tu dashboard. Por ejemplo:
      </P>
      <UL>
        <LI>
          <Em>precios.md</Em> — qué cuesta cada cosa y por qué.
        </LI>
        <LI>
          <Em>contratos.md</Em> — términos de venta, seña, devolución.
        </LI>
        <LI>
          <Em>salud-padres.md</Em> — pruebas oficiales de tus reproductores con resultados.
        </LI>
        <LI>
          <Em>envios.md</Em> — política de envíos internacionales, costes, partners de
          transporte.
        </LI>
        <LI>
          <Em>historia.md</Em> — el relato del criadero (que el bot usa cuando alguien pregunta
          «cuéntame de vosotros»).
        </LI>
        <LI>
          <Em>tono.md</Em> — 5 - 10 ejemplos de respuestas tuyas reales para que el bot aprenda
          cómo escribes.
        </LI>
      </UL>
      <Callout kind="tip" title="Tip de entrenamiento">
        Para <Em>tono.md</Em> no escribas instrucciones tipo «sé cercano». Pega 10 emails reales
        tuyos. El bot aprende a imitar mejor por ejemplos que por descripciones.
      </Callout>

      <H3>4. Tú decides: auto-envío o revisión previa</H3>
      <P>
        Configurable por tipo de consulta. La mayoría de criadores lo dejan así:
      </P>
      <UL>
        <LI>
          <Strong>Auto-envío</Strong>: preguntas frecuentes (precio, edad de entrega, fotos
          actuales).
        </LI>
        <LI>
          <Strong>Revisión previa</Strong>: cualquier mención a seña, contrato, problema sanitario,
          o si la conversación lleva más de 3 intercambios.
        </LI>
      </UL>

      <H3>5. Engancha al pipeline</H3>
      <P>
        Cuando un comprador pasa el filtro inicial, el bot crea automáticamente:
      </P>
      <UL>
        <LI>
          Una <Strong>ficha de cliente</Strong> en tu CRM (Pro), con todos los datos extraídos.
        </LI>
        <LI>
          Una <Strong>tarjeta de reserva</Strong> en el Kanban, en la columna «Interesados».
        </LI>
        <LI>
          Un <Strong>hilo de conversación</Strong> en la página de Emailbot del dashboard para
          que puedas seguir el flujo completo en un solo sitio.
        </LI>
      </UL>

      <H2>Lo que NO hace el bot (y no debería hacer)</H2>
      <Quote source="Filosofía de producto Genealogic">
        El bot es un asistente, no un sustituto. Hay decisiones que solo tú puedes tomar.
      </Quote>
      <UL>
        <LI>
          <Strong>No firma contratos</Strong>. Te envía un borrador prellenado; tú revisas y
          mandas el link de firma.
        </LI>
        <LI>
          <Strong>No cobra señas</Strong>. Te avisa cuando un comprador está listo; tú generas el
          link de pago Stripe.
        </LI>
        <LI>
          <Strong>No promete pruebas que no tienes</Strong>. Se ciñe estrictamente a lo que dice
          tu biblioteca. Si preguntan por una prueba que no has hecho, contesta «no
          disponemos de esa prueba» en vez de inventársela.
        </LI>
        <LI>
          <Strong>No discute</Strong>. Si un cliente sube de tono o entra en queja, el bot escala
          a tu bandeja con marca de prioridad.
        </LI>
      </UL>

      <H2>Cuánto tiempo ahorra realmente</H2>
      <P>
        Datos internos de los primeros criadores Pro que probaron el emailbot durante 90 días:
      </P>
      <UL>
        <LI>
          <Strong>Tiempo medio dedicado a correos</Strong>: bajó de 8,3 h/semana a 1,9 h/semana
          (mediana, ajustado por estacionalidad de camadas).
        </LI>
        <LI>
          <Strong>Tiempo medio de respuesta al primer email</Strong>: bajó de 14 h a 8 min.
        </LI>
        <LI>
          <Strong>Tasa de conversión interesado → seña pagada</Strong>: subió un 22 %.
        </LI>
      </UL>
      <Callout kind="info" title="Por qué sube la conversión">
        No es magia: respondes más rápido y con más contexto. El comprador siente que estás
        organizado y profesional, y eso le hace decidirse antes de mirar a otros criaderos.
      </Callout>

      <Hr />

      <P>
        Tu reputación no la construye el bot. La construye lo que <Strong>tú</Strong> escribes en
        tu biblioteca. El bot solo escala tu tono y tu criterio.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
