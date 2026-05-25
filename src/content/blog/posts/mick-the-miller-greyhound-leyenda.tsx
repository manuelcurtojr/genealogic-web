import { H2, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'mick-the-miller-greyhound-leyenda',
  title: 'Mick the Miller (1926): el greyhound más famoso de la historia del galgódromo',
  excerpt:
    'Nació en Irlanda en una camada vulgar y casi muere de moquillo. Sobrevivió, llegó a Londres y ganó 51 de 81 carreras profesionales. Sigue siendo el greyhound de carreras más documentado y citado de todos los tiempos.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/mick-the-miller-statue.jpg',
  heroAlt: 'Mick the Miller, greyhound de carreras leyenda del galgódromo',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        29 de junio de 1926. En la vicaría rural de Killeigh (Condado de Offaly, Irlanda) nace una
        camada de greyhounds. El padre, Glorious Event. La madre, Na Boc Lei. Uno de los
        cachorros, atigrado y de tamaño medio, se cría con el padre Martin Brophy. Lo llaman{' '}
        <Strong>Mick the Miller</Strong>. Tres años después es la sensación deportiva del Reino
        Unido.
      </Lead>

      <H2>El cachorro que casi no llega</H2>
      <P>
        Con 4 meses, Mick contrajo moquillo. El padre Brophy lo cuidó día y noche durante semanas;
        sobrevivió, pero quedó algo más pequeño que sus hermanos. Esa supervivencia infantil le
        marcaría: nunca tuvo el frame imponente de un campeón estándar, pero desarrolló una{' '}
        <Strong>resistencia psicológica</Strong> y una capacidad de anticipación que sus rivales
        no tenían.
      </P>
      <P>
        Sus primeras carreras en Shelbourne Park (Dublín) en 1928 fueron prometedoras pero no
        excepcionales. Lo decisivo vino cuando el padre Brophy decidió en 1929 venderlo a un
        propietario inglés y enviarlo a competir al recién inaugurado{' '}
        <Strong>White City Stadium</Strong> de Londres.
      </P>

      <H2>El imperio del galgódromo</H2>
      <P>
        Las carreras de greyhound — con liebre mecánica y pista oval — eran un fenómeno de masas
        en el Reino Unido de los años 20. White City llenaba 50.000 espectadores cada noche. El
        Greyhound Derby (el más prestigioso del mundo) repartía premios mayores que muchas
        carreras de caballos. Mick desembarcó en mitad de ese boom.
      </P>
      <P>
        En su <Strong>primer Greyhound Derby (1929)</Strong> ganó la final en un tiempo récord
        mundial: <Strong>29.96 segundos para 525 yardas</Strong> (480 m). El record bajó del
        umbral psicológico de los 30 segundos por primera vez en la historia. Mick repitió victoria
        al año siguiente (1930) — <Strong>único greyhound en ganar dos Derbies consecutivos</Strong>{' '}
        en formato oficial.
      </P>

      <H2>El palmarés</H2>
      <UL>
        <LI>
          <Strong>51 victorias en 81 carreras profesionales</Strong> (63% de win rate, sin contar
          puestos)
        </LI>
        <LI>
          Ganador del <Strong>Greyhound Derby</Strong> en 1929 y 1930
        </LI>
        <LI>
          Ganador del <Strong>Cesarewitch</Strong> (1930)
        </LI>
        <LI>
          Ganador del <Strong>Welsh Derby</Strong> (1930)
        </LI>
        <LI>
          Estableció <Strong>19 récords del mundo</Strong> distintos en su carrera
        </LI>
        <LI>
          Premio total en ganancias: ~£10.000 (equivalente a £800.000 de hoy)
        </LI>
      </UL>

      <PedigreePreview
        dog={{ name: 'Mick the Miller', slug: 'mick-the-miller', birthYear: 1926 }}
      />

      <H2>El retiro y el cine</H2>
      <P>
        Se retiró en 1931 a los 5 años, una edad relativamente temprana para los cánones de hoy
        pero prudente para mantener la salud articular del galgo. Su valor como semental superaba
        ya con creces sus posibles ganancias en pista.
      </P>
      <P>
        En 1934 protagonizó la película <Em>«Wild Boy»</Em>, una de las primeras producciones
        británicas con un perro como personaje principal. La cinta se exhibió en todo el Imperio.
      </P>

      <H2>El legado genético</H2>
      <P>
        Como semental, Mick fue una decepción. Cubrió decenas de hembras tras su retiro, pero
        ninguno de sus hijos alcanzó su nivel competitivo. Esto es un patrón conocido en el
        greyhound: las cualidades de pista (impulso, anticipación, resistencia psicológica) no se
        heredan de forma directa, dependen de combinaciones poligénicas complejas.
      </P>
      <P>
        Aun así, su sangre está presente en la mayoría de líneas de carreras irlandesas modernas
        vía descendientes lejanos cruzados estratégicamente.
      </P>

      <H2>La taxidermia y la posteridad</H2>
      <P>
        Mick murió el <Strong>5 de mayo de 1939</Strong> a los casi 13 años. Su cuerpo se montó por
        taxidermia y se exhibe hoy en el <Strong>Natural History Museum at Tring</Strong>
        (Hertfordshire), donde sigue siendo una de las piezas más visitadas.
      </P>
      <P>
        Hay estatua suya en el Greyhound Stadium de Killeigh, su pueblo natal. Y todos los años en
        White City — hoy demolido pero con placa conmemorativa donde estuvo — se celebra una
        ceremonia el día del Derby.
      </P>

      <H2>El final del galgódromo</H2>
      <P>
        Las carreras de greyhound han ido desapareciendo gradualmente: White City cerró en 1984.
        Wimbledon en 2017. En España nunca arraigaron a esa escala. La industria queda activa solo
        en Irlanda, Reino Unido (residual) y Australia. La preocupación por el bienestar animal y
        los escándalos de dopaje han hecho mella en la afición.
      </P>
      <P>
        Mick the Miller pertenece a una era irrepetible. Pero su nombre sigue siendo, casi un
        siglo después, el referente de todo greyhound que pisa una pista.
      </P>
    </>
  )
}
