import { H2, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'togo-husky-siberiano-serum-run',
  title: 'Togo (1913): el husky que recorrió 423 km en la carrera del suero a Nome',
  excerpt:
    'En enero de 1925, una epidemia de difteria amenazaba con matar a la mayoría de niños de Nome (Alaska). El relevo de 20 trineos que llevó el suero pasa a la historia por Balto. Pero el verdadero héroe fue otro perro: Togo.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/togo.jpg',
  heroAlt: 'Togo, husky siberiano líder de la carrera del suero de Nome de 1925',
  readMinutes: 6,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Si te dicen «el husky de Nome», piensas en <Strong>Balto</Strong>. Hay estatua suya en
        Central Park. Hay película Disney. Pero la persona que estuvo en el relevo más largo y más
        peligroso de la carrera del suero de 1925 no fue Balto. Fue <Strong>Togo</Strong>, un
        siberian husky de 12 años que tiró del trineo de Leonhard Seppala durante{' '}
        <Strong>423 kilómetros</Strong> — el doble que ningún otro perro. Esta es su historia.
      </Lead>

      <H2>La epidemia que cambió todo</H2>
      <P>
        Nome (Alaska), enero de 1925. El médico local, Curtis Welch, diagnostica difteria en varios
        niños inuit. La población del pueblo es ~1.500 personas; sin antitoxina, podrían morir
        cientos. El único suero disponible está en Anchorage, a 1.500 km. El puerto está congelado
        (no llegan barcos hasta primavera) y el único avión utilizable tiene el motor congelado.
        Decisión: <Strong>llevar el suero en trineos tirados por perros</Strong>, en relevos.
      </P>
      <P>
        El recorrido por el sendero Iditarod: 1.085 km totales, temperaturas de –50 °C, vientos de
        70 km/h, hielo marino traicionero. 20 mushers se ofrecen voluntarios. Empieza la operación
        el 27 de enero.
      </P>

      <H2>Seppala y Togo: la decisión clave</H2>
      <P>
        Leonhard Seppala, noruego emigrado a Alaska, era el musher más respetado de la región.
        Llevaba años criando huskies de origen siberiano (la línea Anadyr) y tenía un líder de
        equipo excepcional: <Strong>Togo</Strong>, un macho gris-marrón nacido en 1913, hijo de
        Suggen y Dolly, perros de las líneas de Seppala. Pesaba apenas 21 kg — muy pequeño para
        liderar trineo — pero tenía un instinto sobrenatural para detectar hielo agrietado y
        elegir camino.
      </P>
      <P>
        La organización original planeaba que el equipo de Seppala recibiera el suero en la mitad
        del recorrido. Pero ante el agravamiento de la epidemia, lo enviaron al frente y le
        adjudicaron <Strong>el tramo más largo y más peligroso</Strong>: 280 km en el itinerario
        oficial, pero Seppala decidió tomar un atajo cruzando el hielo marino del Norton Sound,
        recortando a 134 km su tramo, pero añadiendo 91 km de hielo letal.
      </P>

      <H2>La travesía del Norton Sound</H2>
      <P>
        El 31 de enero, Seppala se interna en el hielo marino con Togo al frente del tiro. El
        viento sopla a 65 km/h en contra. La temperatura es de –54 °C. Los témpanos se mueven —
        un fragmento de hielo se separó del bloque continental y Seppala y los perros quedaron a la
        deriva varias horas hasta que el viento los empujó de vuelta. Togo guió todo el tramo sin
        flaquear.
      </P>
      <P>
        Total del relevo de Seppala-Togo: <Strong>423 km</Strong> (de los 1.085 totales del
        operativo). Ningún otro equipo cubrió más de 85 km. Togo era ya un perro mayor — 12 años,
        edad muy avanzada para un husky de tiro — y este sería su último gran trabajo.
      </P>

      <PedigreePreview
        dog={{ name: 'Togo', slug: 'togo-seppala', birthYear: 1913 }}
        father={{ name: 'Suggen', slug: 'suggen-padre-togo' }}
        mother={{ name: 'Dolly', slug: 'dolly-madre-togo' }}
      />

      <H2>El final feo: por qué Balto se llevó la gloria</H2>
      <P>
        Seppala y Togo entregaron el suero a Charlie Olson en la posta de Golovin. Olson lo pasó a{' '}
        <Strong>Gunnar Kaasen</Strong>, que llevaba como líder a un perro de la perrera de
        Seppala: <Strong>Balto</Strong>, considerado entonces un perro de segunda fila. Kaasen
        debía entregar el relevo a un equipo más, pero al llegar al punto de entrega encontró al
        siguiente musher dormido y decidió continuar él mismo. Hizo los últimos 85 km y entró en
        Nome a las 5:30 de la mañana del 2 de febrero.
      </P>
      <P>
        La prensa estadounidense, sin entender bien el operativo, contó la historia como{' '}
        <Strong>«Balto, el héroe que llevó el suero»</Strong>. En 9 meses tenía estatua en Central
        Park. Seppala, indignado, declaró públicamente que el verdadero héroe era Togo y que Balto
        era un perro «mediocre».
      </P>

      <H2>El legado genético</H2>
      <UL>
        <LI>
          Togo cubrió decenas de hembras tras la carrera. La <Strong>línea Seppala</Strong> de
          siberian husky de trabajo desciende íntegramente de él
        </LI>
        <LI>
          El husky de trineo moderno (línea de carrera Iditarod) tiene a Togo en la genealogía
          fundacional
        </LI>
        <LI>
          La línea «show» AKC del siberian husky de hoy es genéticamente más cercana a otros
          perros de la época, pero también incluye a Togo
        </LI>
      </UL>

      <H2>La rehabilitación tardía</H2>
      <P>
        Togo murió en 1929 en Maine, donde Seppala le había mandado a retiro de cría. Su cuerpo se
        montó por taxidermia y se conserva en el <Strong>Iditarod Trail Sled Dog Race
        Headquarters</Strong> de Wasilla, Alaska. En 2011, la revista <Em>Time</Em> nombró a Togo
        el «animal más heroico de la historia», por encima de Balto. En 2019, Disney+ estrenó la
        película <Em>Togo</Em>. La justicia, aunque tarde, llega.
      </P>
      <P>
        La estatua de Balto sigue en Central Park. La de Togo está en Seward Park, Nueva York,
        desde 2001. Mucho más pequeña.
      </P>
    </>
  )
}
