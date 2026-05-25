import { H2, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'buccleuch-avon-fundador-labrador',
  title: 'Buccleuch Avon (1885): el labrador negro que fundó la raza',
  excerpt:
    'Antes de que el Labrador Retriever existiera como raza oficial, había un perro negro en la cacería del 5º Duque de Buccleuch que destacaba sobre el resto. Su nombre era Avon, y de él desciende casi todo el labrador moderno.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/buccleuch-avon.png',
  heroAlt: 'Buccleuch Avon, labrador negro fundador, fotografía histórica',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        El Labrador Retriever no nació en Labrador. Nació en Terranova, viajó a Inglaterra en los
        barcos pesqueros del XIX, y se consolidó como raza en las cacerías de dos familias
        aristocráticas escocesas: los Buccleuch y los Malmesbury. El perro que cierra ese ciclo y
        marca el origen del labrador moderno fue <Strong>Buccleuch Avon</Strong>, nacido en 1885.
      </Lead>

      <H2>El antepasado terranova</H2>
      <P>
        Los antepasados del labrador llegaban a los puertos de Poole (Dorset) en los barcos
        bacaladeros que regresaban de Terranova. Los marineros los llamaban <Em>St. John's Water
        Dog</Em> — perros medianos, de pelo corto, color negro, expertos en recuperar peces
        sueltos del agua helada. El 2º Conde de Malmesbury empezó a usarlos en los años 1830 para
        cobrar patos en sus marismas de Hampshire.
      </P>
      <P>
        El 3º Conde de Malmesbury (su hijo) consolidó la línea, vetó el cruce con otras razas, y
        en 1870 envió varios ejemplares a un primo lejano: el <Strong>5º Duque de Buccleuch</Strong>,
        otro aristócrata cazador con fincas en Escocia. Entre esos perros estaba <Em>Ned</Em>, padre
        de Avon.
      </P>

      <H2>El perro ideal del Duque</H2>
      <P>
        Avon nació en 1885 en las perreras de la finca Drumlanrig (Escocia). Era un macho negro,
        compacto, de tórax profundo, cola gruesa <Em>«como la de una nutria»</Em> y temperamento
        excepcional: rápido pero controlado, con boca blanda perfecta, infatigable en el agua
        helada y receptivo a la dirección a distancia.
      </P>
      <P>
        El 5º Duque lo usó como semental de referencia durante una década. Sus hijos se cedieron a
        otros cazadores aristócratas y a guardas reales. La camada que más marcó fue la que Avon
        engendró con <Strong>Buccleuch Nell</Strong> en 1892: de ahí salió{' '}
        <Strong>Buccleuch Ned (II)</Strong>, base de la línea que se inscribiría más tarde en el
        Kennel Club.
      </P>

      <PedigreePreview
        dog={{ name: 'Buccleuch Avon', slug: 'buccleuch-avon', birthYear: 1885 }}
      />

      <H2>La estandarización oficial</H2>
      <P>
        Cuando el <Strong>Kennel Club británico</Strong> reconoció oficialmente al Labrador
        Retriever como raza independiente en <Strong>1903</Strong>, los primeros ejemplares
        inscritos eran casi todos descendientes directos de Avon vía 2-3 generaciones. El estándar
        morfológico que se redactó entonces (y que sigue vigente con retoques menores) era
        literalmente la descripción de Avon.
      </P>
      <P>
        En 1916 se fundó <Strong>The Labrador Retriever Club</Strong>, que estableció las pruebas
        de campo (Field Trials) como criterio de calidad funcional. Hasta los años 1940 había una
        sola línea — luego empezaron a separarse las líneas <Em>show</Em> (más pesadas, cabeza más
        ancha) y <Em>working</Em> (más esbeltas, drive de cobro más alto). Avon habría sido tipo
        working.
      </P>

      <H2>El color amarillo y el chocolate</H2>
      <P>
        El labrador originalmente era <Strong>solo negro</Strong>. El gen del amarillo (e/e) ya
        estaba en la población pero los criadores victorianos sacrificaban los cachorros amarillos
        por considerarlos defectuosos. El primer amarillo reconocido fue <Em>Ben of Hyde</Em> en
        1899 — bisnieto de Avon por dos ramas. El chocolate apareció más tarde, en los años 1930.
      </P>
      <P>
        Hoy los tres colores están en igualdad de condiciones en el estándar FCI #122.
      </P>

      <H2>De cazador a raza más popular del planeta</H2>
      <UL>
        <LI>
          El labrador es la raza <Strong>nº 1 en registros del AKC</Strong> desde 1991
          (interrumpido solo por el French Bulldog desde 2022)
        </LI>
        <LI>
          En España se registran <Strong>unos 5.500 cachorros anuales</Strong>
        </LI>
        <LI>
          Es la raza más usada como <Strong>perro guía de invidentes</Strong> y como{' '}
          <Strong>detector aduanero</Strong>
        </LI>
      </UL>

      <P>
        Buccleuch Avon murió en 1899 a los 14 años. No tuvo lápida — los Duques no marcaban a sus
        perros de caza. Pero el archivo de cría de Drumlanrig conserva sus papeles, y cada
        labrador con pedigree del mundo puede trazar su línea hasta él.
      </P>
    </>
  )
}
