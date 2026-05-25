import { H2, H3, P, Lead, UL, LI, Strong, Callout, PostCta, Hr, Em } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: '5-errores-arruinan-camada',
  title: '5 errores que arruinan una camada (y cómo evitarlos)',
  excerpt:
    'No es la genética lo que suele cargarse una camada. Son cinco fallos de gestión que se repiten en criaderos amateur y que, una vez vistos, son obvios.',
  date: '2026-05-15',
  category: 'Para criadores',
  heroImage:
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1600&q=80&auto=format&fit=crop',
  heroAlt: 'Camada de cachorros amontonados sobre una manta clara',
  readMinutes: 7,
  author: { name: 'Equipo Genealogic', role: 'Plataforma de cría canina' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Llevamos años hablando con criadores y revisando casos de camadas que han salido mal. Los
        problemas casi nunca son genéticos. Son organizativos. Y los cinco que vienen a
        continuación se repiten una y otra vez.
      </Lead>

      <H2>1. No chequear la salud de los progenitores</H2>
      <P>
        Es el más obvio y el más ignorado. Un criador con prisa por sacar camada antes del verano
        salta el test de cadera, el test cardíaco, el panel genético específico de raza. Si los
        cachorros nacen con displasia, dilatación cardíaca o ataxia, ya es tarde.
      </P>
      <P>
        <Strong>Mínimo razonable por raza</Strong>:
      </P>
      <UL>
        <LI>
          Razas grandes y gigantes (Pastor Alemán, Cane Corso, Mastín): HD (cadera) + ED (codo) +
          panel cardíaco antes de los 24 meses.
        </LI>
        <LI>
          Braquicéfalos (Bulldog, Carlino, Boxer): test BOAS (síndrome respiratorio) + radiografía
          de columna.
        </LI>
        <LI>
          Razas con problemas oculares (Collie, Pastor Australiano): MDR1 + CEA + ECVO ocular.
        </LI>
        <LI>
          Cardíacas conocidas (Cavalier, Dóberman, Boxer): ecocardiograma anual del semental y la
          hembra.
        </LI>
      </UL>
      <Callout kind="warning" title="Regla de oro">
        Si una raza tiene un problema sanitario conocido y tú no haces el test, eres parte del
        problema, no de la solución. No importa cuántos años lleves criando.
      </Callout>

      <H2>2. Llevar las reservas en una libreta o un Excel</H2>
      <P>
        Esto suena trivial hasta que te toca gestionar una camada de 8 cachorros con 15
        interesados, 4 que pagaron seña, 2 que se echaron atrás, 1 que paga en plazos y 3 que
        siguen preguntando «¿pero cuándo nace?».
      </P>
      <P>
        Sin un sistema con estados claros (interesado → seña pagada → contrato firmado → asignado
        → entregado), <Strong>te van a llamar dos veces para reservar el mismo cachorro</Strong>.
        Y cuando pase, vas a quedar mal con uno de los dos compradores.
      </P>
      <P>
        Genealogic Pro tiene un pipeline tipo Kanban exactamente para esto: arrastras la tarjeta
        entre columnas, ves la seña pagada, el contrato firmado y la fecha de entrega de cada
        cliente. <Em>No se te escapa una reserva.</Em>
      </P>

      <H2>3. Vender sin contrato</H2>
      <P>
        El «trato verbal» entre criadores y compradores funciona hasta que no funciona. Y cuando
        no funciona, suele acabar con uno de los dos perjudicado: el comprador devolviendo un
        cachorro que ya tiene 4 meses y no quiere, o el criador exigiendo un pago que el
        comprador asegura no haber acordado.
      </P>
      <P>Un contrato básico cubre:</P>
      <UL>
        <LI>
          <Strong>Datos del cachorro</Strong> (microchip, fecha nacimiento, padres, raza).
        </LI>
        <LI>
          <Strong>Precio total</Strong> y plazos de pago si hay seña.
        </LI>
        <LI>
          <Strong>Compromisos sanitarios del criador</Strong>: desparasitación, vacunación
          inicial, primera revisión veterinaria.
        </LI>
        <LI>
          <Strong>Garantías</Strong>: qué pasa si el cachorro presenta una enfermedad congénita
          dentro de los primeros 12 meses.
        </LI>
        <LI>
          <Strong>Condiciones de reproducción</Strong>: si el cachorro va con o sin papeles para
          cría, si el criador conserva derechos de monta.
        </LI>
        <LI>
          <Strong>Política de devolución</Strong>: el criador acepta volver a tomar el cachorro si
          el comprador no puede atenderlo.
        </LI>
      </UL>

      <H2>4. No fotografiar la evolución de los cachorros</H2>
      <P>
        Este es el más subestimado. Los compradores quieren ver fotos cada semana. Es lo que crea
        el vínculo emocional antes de la entrega. Y es lo que te diferencia de un revendedor.
      </P>
      <P>
        Un criador que manda foto semanal de la camada con peso, observación del temperamento y
        evolución física es alguien que <Strong>se preocupa</Strong>. Y un comprador que ve esa
        secuencia llega a buscar a su cachorro con una expectativa clara, no con incertidumbre.
      </P>
      <P>
        Bonus: esas fotos te sirven después para la web del criadero. Cada camada con su galería
        cronológica es <Em>contenido</Em> que atrae al siguiente comprador.
      </P>

      <H2>5. No mantener relación post-venta</H2>
      <P>
        El criador profesional sigue siendo el referente del propietario los primeros 12 meses. Y
        muchas veces toda la vida del perro. Esto significa:
      </P>
      <UL>
        <LI>
          Resolver dudas sobre alimentación, vacunación, socialización en los primeros 3 meses.
        </LI>
        <LI>
          Pedir actualizaciones cada 3 - 6 meses durante el primer año para detectar problemas
          temprano.
        </LI>
        <LI>
          Estar disponible si el propietario tiene que devolver el perro por cambio de
          circunstancias (mudanza, enfermedad, etc.) — siempre antes de que acabe en una protectora.
        </LI>
      </UL>
      <Callout kind="tip" title="Truco práctico">
        En el CRM de clientes de Genealogic puedes guardar la última fecha de contacto con cada
        comprador. Filtras por «hace más de 6 meses» y haces un envío de seguimiento. Construyes
        lealtad y, de paso, te enteras de qué tal van tus líneas.
      </Callout>

      <Hr />

      <H2>El patrón común</H2>
      <P>
        Los cinco errores tienen algo en común: son fallos de <Strong>sistema</Strong>, no de
        genética ni de cariño. Un criador puede tener los mejores ejemplares del país y aún así
        cargarse una camada por no tener un proceso. Y al revés: un criador con ejemplares
        decentes y un sistema sólido construye reputación durante 20 años.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
