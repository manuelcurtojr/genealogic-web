import { H2, H3, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'old-hemp-border-collie-fundador',
  title: 'Old Hemp (1893): el border collie que fundó la raza',
  excerpt:
    'Nació en Northumberland en septiembre de 1893 y cambió para siempre el manejo de ovejas. Cada border collie con genealogía del mundo desciende de él. Esta es su historia y su árbol genealógico.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/old-hemp.jpg',
  heroAlt: 'Old Hemp, border collie fundador de la raza, fotografía histórica',
  readMinutes: 6,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        En septiembre de 1893, en una pequeña granja de Northumberland (Inglaterra), nació un
        cachorro tricolor que iba a redefinir el oficio de pastorear. Se llamaba <Strong>Hemp</Strong>,
        y con el tiempo se le conocería como <Em>Old Hemp</Em>. Hoy, cualquier border collie con
        genealogía del planeta tiene su sangre.
      </Lead>

      <H2>Adam Telfer y el cachorro tranquilo</H2>
      <P>
        Adam Telfer era un pastor experimentado de West Woodburn que llevaba años trabajando con
        perros de pastoreo locales: <Em>working sheepdogs</Em> sin estándar definido, mezcla de
        Collies, Bearded y otros tipos rústicos del norte. Telfer cruzó a <Strong>Roy</Strong>, un
        macho tricolor de andares fuertes y voz fuerte, con <Strong>Meg</Strong>, una hembra negra
        muy concentrada en la oveja y de temperamento templado. De aquella camada nació Hemp.
      </P>
      <P>
        Lo que distinguía a Hemp no era la velocidad ni la potencia física — era el{' '}
        <Strong>«eye»</Strong>: esa mirada fija, intensa, que paralizaba a las ovejas sin necesidad
        de ladrar ni morder. Telfer lo dijo así: <Em>«No las hacía obedecer. Las hacía
        cambiar de idea»</Em>.
      </P>

      <H2>El método que cambió todo</H2>
      <P>
        Antes de Hemp, el pastoreo se basaba en perros que ladraban, mordisqueaban y obligaban al
        rebaño a moverse a base de presión física. Era ruidoso, agotador y estresaba a la oveja
        (lo que perjudicaba el peso y la lana). Hemp introdujo el manejo <Strong>silencioso, de
        postura baja, basado en presión psicológica</Strong>: el perro se aproxima en círculos
        amplios, fija la mirada, y la oveja se mueve sin sufrir.
      </P>
      <P>
        Telfer empezó a competir con Hemp en las pruebas de pastoreo (<Em>sheepdog trials</Em>) que
        habían comenzado en Bala (Gales) en 1873. Hemp <Strong>ganó casi todo lo que disputó</Strong>.
        Y los demás pastores empezaron a pedirle cubriciones.
      </P>

      <H2>El fundador genético</H2>
      <P>
        Hemp tuvo más de <Strong>200 hijos documentados</Strong> en su vida productiva — una
        cantidad enorme para la época. Los criadores del norte de Inglaterra, Escocia y el sur de
        Gales se llevaron sus cachorros y los cruzaron entre sí. En tres generaciones, el tipo
        Hemp había desplazado al resto: misma estructura, mismo «eye», mismo método.
      </P>
      <P>
        Cuando el <Strong>International Sheep Dog Society</Strong> abrió su libro de orígenes en
        1906, registró a Old Hemp con el ISDS #9 — y a partir de ahí, el border collie como raza
        empezó a existir de forma oficial. Pero todo el material genético ya venía del mismo perro.
      </P>

      <PedigreePreview
        dog={{ name: 'Old Hemp', slug: 'old-hemp', birthYear: 1893 }}
        father={{ name: 'Roy', slug: 'roy-padre-hemp' }}
        mother={{ name: 'Meg', slug: 'meg-madre-hemp' }}
      />

      <H2>Por qué importa hoy</H2>
      <P>
        Si tienes un border collie y revisas su genealogía con paciencia hasta la décima o duodécima
        generación, encontrarás a Old Hemp. Repetido por múltiples ramas, además — la base
        genética de la raza es tan estrecha que algunos estudios calculan que más del 95% de la
        diversidad actual viene de menos de 50 perros del entorno de Hemp.
      </P>
      <P>
        Esa es la grandeza y el riesgo: el border collie es lo que es por Hemp, pero también acarrea
        la <Strong>consanguinidad acumulada</Strong> de cien años cruzando dentro de ese fondo. Los
        criadores modernos serios trabajan precisamente sobre ese tema: introducir líneas
        infrarrepresentadas, vigilar el coeficiente, no atajar.
      </P>

      <H2>El legado en cifras</H2>
      <UL>
        <LI>
          <Strong>200+ descendientes directos</Strong> en 11 años productivos
        </LI>
        <LI>
          ISDS #9 — uno de los primeros perros inscritos en el libro de orígenes oficial
        </LI>
        <LI>
          Ganador del <Strong>International Sheepdog Trial</Strong> en múltiples ocasiones
        </LI>
        <LI>
          Tipo morfológico y temperamental aún vigente — el border collie de exposición de hoy
          mantiene la misma silueta y el mismo «eye» que documentaron en 1900
        </LI>
      </UL>

      <P>
        Murió en mayo de 1901 a los 7 años, agotado tras una vida de trabajo y cubriciones
        constantes. Está enterrado cerca de la granja de West Woodburn. Su lápida lleva la
        inscripción que mejor le define:
      </P>
      <P>
        <Em>«Old Hemp — Stockmaster of the breed»</Em>.
      </P>
    </>
  )
}
