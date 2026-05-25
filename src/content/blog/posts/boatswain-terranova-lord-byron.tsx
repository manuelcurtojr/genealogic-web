import { H2, P, Lead, Strong, Em, UL, LI } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'boatswain-terranova-lord-byron',
  title: 'Boatswain (1803): el terranova de Lord Byron y el epitafio más famoso de la literatura canina',
  excerpt:
    'Murió de rabia a los 5 años en 1808. Lord Byron, que lo había cuidado personalmente sin temor al contagio, le dedicó un epitafio que cambió para siempre cómo Occidente piensa sobre los perros.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/boatswain.jpg',
  heroAlt: 'Boatswain, terranova de Lord Byron, retrato histórico',
  readMinutes: 4,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Hay perros famosos por lo que hicieron. Boatswain es famoso por lo que su dueño dijo sobre
        él cuando murió. Y lo que dijo, en mayo de 1808, fue un texto que dos siglos después sigue
        siendo el epitafio canino más citado del mundo occidental.
      </Lead>

      <H2>El perro favorito del poeta</H2>
      <P>
        <Strong>George Gordon Byron</Strong>, sexto barón Byron, no era una persona fácil. Mujeriego,
        bisexual declarado en una época que no perdonaba, alcohólico, pendenciero, exiliado de
        Inglaterra por escándalos sexuales. Pero a los perros los entendía. Y a uno en concreto lo
        adoraba.
      </P>
      <P>
        <Strong>Boatswain</Strong> era un terranova negro y blanco (de «manto Landseer», el tipo
        clásico bicolor) nacido en mayo de 1803, posiblemente en Liverpool. Byron lo tuvo desde
        cachorro y lo llevó con él a Newstead Abbey, la finca familiar que había heredado. Vivían
        juntos casi sin separación: Boatswain dormía en su dormitorio, le acompañaba en sus paseos
        nocturnos, y se sentaba con él durante las largas sesiones de escritura.
      </P>

      <H2>La rabia</H2>
      <P>
        En el otoño de 1808, Boatswain fue mordido por un perro vagabundo infectado de{' '}
        <Strong>rabia</Strong>. Empezó a presentar síntomas: parálisis facial, hidrofobia,
        agresividad intermitente. Sin vacuna (Pasteur la desarrollaría 80 años después), el
        desenlace era seguro y mortal.
      </P>
      <P>
        Byron, sin protección alguna, le cuidó personalmente durante toda la enfermedad.{' '}
        <Strong>Le limpiaba la baba con sus propias manos</Strong>, le ayudaba a beber, dormía a
        su lado. Sus amigos le suplicaron que se alejara, recordándole que la rabia era
        prácticamente 100% letal en humanos. Byron contestó:{' '}
        <Em>«Si lo amé en vida, le serviré ahora»</Em>.
      </P>
      <P>
        Por algún milagro estadístico, Byron no se contagió. Boatswain murió el{' '}
        <Strong>18 de noviembre de 1808</Strong>.
      </P>

      <H2>La tumba y el epitafio</H2>
      <P>
        Byron mandó construir para Boatswain una tumba monumental en los jardines de Newstead
        Abbey — más grande, irónicamente, que la que más tarde tendría él mismo. La inscripción
        que redactó (atribuida también a su amigo John Cam Hobhouse, pero firmada por Byron) es
        una de las páginas más famosas de la literatura sobre el vínculo humano-canino:
      </P>
      <blockquote className="my-6 border-l-2 border-hairline pl-6 italic text-body">
        <P>
          <Em>
            «Cerca de este lugar yacen los restos de un ser que poseyó belleza sin vanidad, fuerza
            sin insolencia, coraje sin ferocidad, y todas las virtudes del hombre sin sus vicios.
            Este elogio, que sería una vana adulación si se inscribiera sobre cenizas humanas, es
            solo justo tributo a la memoria de Boatswain, un perro»
          </Em>.
        </P>
      </blockquote>
      <P>
        El texto continúa en verso durante 26 líneas — el famoso <Em>«Epitaph to a Dog»</Em> — y
        ataca con violencia la arrogancia humana frente a la lealtad canina. Hoy se cita en
        funerales, libros, exposiciones y películas en todo el mundo.
      </P>

      <PedigreePreview
        dog={{ name: 'Boatswain', slug: 'boatswain-byron', birthYear: 1803 }}
      />

      <H2>El terranova en la Inglaterra georgiana</H2>
      <P>
        En la época de Byron, el <Strong>Terranova</Strong> era un perro relativamente raro pero
        muy apreciado entre la aristocracia. Los marineros lo traían en los barcos bacaladeros que
        regresaban del Atlántico Norte (el mismo flujo que originaría también el labrador). Su
        capacidad para nadar largas distancias, rescatar náufragos y arrastrar pesos en agua los
        hacía únicos.
      </P>
      <P>
        Boatswain no era un perro de programa de cría organizado — el Kennel Club no existiría
        hasta 1873 — pero era genéticamente un terranova tipo Landseer. Su existencia
        documentada es uno de los primeros registros conservados de la raza en suelo inglés.
      </P>

      <H2>La paradoja del epitafio</H2>
      <UL>
        <LI>
          Byron mandó esculpir su propia tumba <Strong>más modesta</Strong> que la de Boatswain
        </LI>
        <LI>
          En su testamento ordenó ser enterrado <Strong>junto a Boatswain</Strong> en Newstead.
          La familia se opuso y fue enterrado en la cripta familiar de la iglesia de Hucknall,
          violando su voluntad
        </LI>
        <LI>
          El epitafio fue grabado en piedra y aún se puede visitar en Newstead Abbey, hoy gestionado
          por el Nottingham City Council
        </LI>
      </UL>

      <P>
        Boatswain probablemente fue solo un buen perro. Pero la combinación de su muerte, el genio
        de su dueño y las circunstancias dramáticas de su enfermedad lo convirtieron en algo más:
        <Strong> el momento en que la literatura culta admitió, por primera vez sin disfraz, que un
        perro podía valer más que un ser humano</Strong>.
      </P>
    </>
  )
}
