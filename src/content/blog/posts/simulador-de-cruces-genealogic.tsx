import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'simulador-de-cruces-genealogic',
  title: 'El simulador de cruces de Genealogic: mira la camada antes de montarla',
  excerpt:
    'Eliges macho y hembra de tus perros y ves qué esperar del cruce: árbol combinado, consanguinidad proyectada y genética del color. Planificar en cinco minutos.',
  date: '2026-09-05',
  category: 'Plataforma',
  heroImage: '/blog/simulador-de-cruces-genealogic.jpg',
  heroAlt: 'Ilustración del simulador de cruces mostrando dos perros y el árbol de la camada prevista',
  readMinutes: 5,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Criar bien empieza mucho antes de la monta. El simulador de cruces de Genealogic te deja
        «ver» la camada sobre el papel —antes de comprometer dos años de tu criadero en ella.
      </Lead>
      <P>
        La idea es simple: eliges <Strong>un macho y una hembra de tus perros</Strong> y la
        herramienta cruza sus datos para decirte qué puedes esperar de esa unión. En lugar de fiarlo
        al ojo y a la intuición, decides con información delante.
      </P>

      <H2>Qué te muestra</H2>
      <P>El planificador está organizado en pestañas. Estas dos están disponibles en Kennel Pro:</P>
      <UL>
        <LI>
          <Strong>Genealogía.</Strong> Monta el <Strong>árbol combinado de la camada prevista</Strong>:
          la ascendencia de ambos lados junto a un nodo de «camada hipotética». De un vistazo ves de
          dónde vendrían los cachorros y qué ancestros se repiten a un lado y al otro.
        </LI>
        <LI>
          <Strong>Genética.</Strong> Estima el <Strong>color y los rasgos</Strong> que pueden salir en
          la camada —con sus porcentajes— y te avisa de combinaciones de riesgo. Lo vemos en detalle
          en otro artículo.
        </LI>
      </UL>

      <H2>Consanguinidad, con semáforo</H2>
      <P>
        Dentro de la pestaña de genealogía, el simulador calcula el <Strong>COI (coeficiente de
        consanguinidad)</Strong> de la camada y lo pinta con un semáforo —verde, naranja o rojo— con
        su interpretación. Y no en el vacío: lo compara con la <Strong>media de la raza</Strong>,
        porque no significa lo mismo un 5% en una raza que en otra. Es la diferencia entre «me suena
        que están emparentados» y saber exactamente cuánto.
      </P>

      <Callout kind="tip" title="Se calcula sobre tu genealogía real">
        El COI sale de la ascendencia registrada (hasta cinco generaciones), no de una estimación
        genérica. Cuanto más completa tengas tu genealogía en Genealogic, más fino es el cálculo.
      </Callout>

      <H2>Para qué sirve en la práctica</H2>
      <P>
        Para dejar de cruzar «a ver qué sale». Antes de decidir una monta puedes probar varias
        combinaciones, descartar las que disparan la consanguinidad y elegir la que te lleva hacia lo
        que buscas. Cinco minutos en la pantalla te ahorran errores que se pagan durante años.
      </P>

      <Callout kind="info" title="En camino">
        Estamos afinando dos funciones más dentro del simulador: la <Strong>proyección de
        morfología</Strong> de la camada a partir de las medidas de los padres, y una{' '}
        <Strong>evaluación con IA del cruce frente al estándar de la raza</Strong>. Ahora mismo están
        en pruebas con criaderos reales; llegarán al resto en cuanto estén listas.
      </Callout>

      <P>
        El simulador de cruces está incluido en <Strong>Kennel Pro</Strong>. Si ya tienes tus perros
        y sus genealogías en Genealogic, lo tienes a un par de clics.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
