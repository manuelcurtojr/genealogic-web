import { H2, P, Lead, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'planificar-camada-consanguinidad-morfologia',
  title: 'Cómo planificar una camada: consanguinidad, morfología y genética, explicadas',
  excerpt:
    'Un buen cruce no sale por suerte, se planifica. Consanguinidad, complementariedad morfológica y genética: lo que hay que mirar antes de juntar a dos ejemplares.',
  date: '2026-09-05',
  category: 'Genética',
  heroImage:
    '/blog/planificar-camada-consanguinidad-morfologia.jpg',
  heroAlt: 'Genealogías de dos ejemplares enfrentadas para planificar un cruce',
  readMinutes: 5,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Hay dos formas de hacer una camada. Una: tengo una hembra, busco un macho que me pilla cerca
        y a ver qué sale. Otra: sé qué quiero mejorar, elijo el cruce que me lleva hacia ahí y
        reduzco los riesgos.
      </Lead>
      <P>
        La primera llena el mundo de perros del montón. La segunda es criar de verdad. Y planificar
        un cruce no es adivinar: son tres cosas que puedes mirar antes de decidir.
      </P>

      <H2>1. Consanguinidad: hasta dónde y con cabeza</H2>
      <P>
        Cruzar pariente con pariente <Strong>fija</Strong> un tipo, pero también concentra lo malo:
        se disparan los problemas de salud y se pierde vigor. Un poco de consanguinidad bien dirigida
        consolida virtudes; demasiada, te mete en un lío.
      </P>
      <P>
        La herramienta objetiva es el <Strong>coeficiente de consanguinidad (COI)</Strong>: cuánto
        comparten genéticamente los dos padres según su ascendencia. Antes de un cruce, revisa las
        genealogías de ambos y mira qué antepasados se repiten. Si aparece el mismo perro por todos
        lados, cuidado.
      </P>

      <H2>2. Complementariedad morfológica: que uno corrija al otro</H2>
      <P>
        El error clásico es cruzar dos ejemplares que fallan en lo mismo, esperando un milagro. No
        funciona. La idea es <Strong>complementar</Strong>: si tu hembra flojea de grupa, busca un
        macho fuerte justo ahí. No se trata de juntar dos «buenos», sino dos que <Strong>encajen</Strong>.
      </P>
      <P>
        Para eso ayuda tener los datos objetivos —medidas, morfología— y no solo el ojo. El ojo
        engaña; los números, menos.
      </P>

      <H2>3. Genética: color, salud y lo que se hereda</H2>
      <P>
        Color, tipo de pelo, ciertas patologías… muchas cosas siguen reglas de herencia conocidas.
        Saber qué llevan los padres te evita sorpresas (una camada entera de un color que no querías)
        y, más importante, te ayuda a no perpetuar problemas de salud.
      </P>

      <Callout kind="tip" title="La cuenta que siempre sale">
        Planificar un cruce en la pantalla cuesta cinco minutos. Rectificar una camada mal pensada
        cuesta dos años.
      </Callout>

      <H2>Primero en la pantalla, luego en el terreno</H2>
      <P>
        Todo esto se puede hacer a mano si dominas las genealogías de memoria. Pero es justo donde la
        tecnología te ahorra errores caros. En Genealogic tienes un{' '}
        <Strong>simulador de cruces</Strong>: eliges macho y hembra y te calcula la consanguinidad
        prevista, cruza la morfología de ambos y te ayuda a anticipar cómo puede salir la camada
        <Strong> antes</Strong> de montarla.
      </P>

      <PostCta variant="register" />
    </>
  )
}
