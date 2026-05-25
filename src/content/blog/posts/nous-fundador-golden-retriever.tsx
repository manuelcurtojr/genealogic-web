import { H2, P, Lead, UL, LI, Strong, Em } from '@/components/blog/prose'
import { PedigreePreview } from '@/components/blog/pedigree-preview'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'nous-fundador-golden-retriever',
  title: 'Nous (1864): el cachorro amarillo que se convirtió en Golden Retriever',
  excerpt:
    'En 1864, un cazador escocés compró un cachorro amarillo a un zapatero de Brighton. Esa transacción anecdótica fue el origen documentado de la raza Golden Retriever. Esta es la historia de Nous.',
  date: '2026-05-26',
  category: 'Para criadores',
  heroImage:
    'https://elhwppumacnyhovkapeb.supabase.co/storage/v1/object/public/dog-photos/historic/nous.jpg',
  heroAlt: 'Nous, cachorro fundador del Golden Retriever, retrato histórico',
  readMinutes: 5,
  author: { name: 'Equipo Genealogic', role: 'Editorial' },
}

export default function Post() {
  return (
    <>
      <Lead>
        En 1864, el primer Lord Tweedmouth — <Strong>Dudley Marjoribanks</Strong>, un aristócrata
        escocés con afición a la caza y a la cría rigurosa — paseaba por Brighton cuando vio en el
        escaparate de un zapatero un cachorro amarillo de Wavy-Coated Retriever. Lo compró por unos
        cuantos chelines y lo llamó <Strong>Nous</Strong>. Ese cachorro acabaría siendo el padre
        genético de la raza más popular del mundo en el segmento familiar.
      </Lead>

      <H2>El laboratorio de Guisachan</H2>
      <P>
        Lord Tweedmouth se llevó a Nous a Guisachan, su finca de cacería en las Highlands
        escocesas. Durante los siguientes 20 años llevó un{' '}
        <Strong>libro de cría meticuloso</Strong> — algo extremadamente raro en la época — donde
        anotó cada cubrición, cada camada y cada cachorro de su programa. Ese libro se conserva
        hoy en la <Em>Kennel Club Library</Em> de Londres y es el documento fundacional de la
        raza.
      </P>
      <P>
        Cruzó a Nous con <Strong>Belle</Strong>, una Tweed Water Spaniel (una raza hoy
        extinta, parecida a un retriever pequeño y rizado). De esa primera camada de 1868 nacieron
        cuatro hembras: Cowslip, Primrose, Crocus y Ada. Esas cuatro perras son los segundos
        eslabones del Golden moderno.
      </P>

      <H2>El cruce añadido</H2>
      <P>
        En las décadas siguientes Tweedmouth introdujo más sangre con criterio:
      </P>
      <UL>
        <LI>
          <Strong>Otro Tweed Water Spaniel</Strong> (Tweed) — refuerzo de la línea materna
        </LI>
        <LI>
          <Strong>Un Setter Irlandés rojo</Strong> — para añadir nariz y tipo
        </LI>
        <LI>
          <Strong>Un Bloodhound</Strong> — color y olfato
        </LI>
        <LI>
          <Strong>Otro Wavy-Coated Retriever negro</Strong> — para consolidar estructura
        </LI>
      </UL>
      <P>
        El objetivo: un perro de cobro de aves acuáticas que combinara{' '}
        <Strong>resistencia al frío</Strong> (las aguas heladas de las Highlands en otoño),{' '}
        <Strong>boca blanda</Strong> (no marcar las aves) y <Strong>temperamento equilibrado</Strong>{' '}
        (cazar en grupo con varios perros, sin pelearse). Lo consiguió.
      </P>

      <PedigreePreview
        dog={{ name: 'Nous', slug: 'nous-golden-founder', birthYear: 1864 }}
      />

      <H2>La separación oficial</H2>
      <P>
        Hasta principios del siglo XX, los descendientes de Nous se inscribían como{' '}
        <Em>Flat-Coated Retrievers (Golden)</Em> — solo un subtipo. El Kennel Club británico los
        reconoció oficialmente como raza independiente <Strong>en 1913</Strong>, bajo el nombre{' '}
        <Em>Yellow or Golden Retriever</Em>. La FCI haría lo propio en 1925.
      </P>
      <P>
        El cambio de denominación a <Strong>Golden Retriever</Strong> sin más, vino en 1920, cuando
        el club acordó que «yellow» sonaba demasiado vago.
      </P>

      <H2>La paradoja del éxito</H2>
      <P>
        Hoy el Golden es la <Strong>3ª raza más popular del mundo</Strong>. En España se inscriben
        unos 3.000 cachorros al año en la RSCE. En Estados Unidos, 60.000. Esa popularidad masiva
        ha traído los problemas habituales: cría sin filtro, displasia generalizada (~25% de la
        población según OFA), cáncer hemangiosarcoma a edades cada vez más tempranas...
      </P>
      <P>
        Los criadores serios de Golden modernos hacen radiografía de cadera + codos, ecocardio,
        prueba genética de PRA-prcd y miopatía centronuclear, y vigilan el coeficiente de
        consanguinidad. Es lo mínimo. Sin esas pruebas, comprar un Golden es una lotería
        sanitaria.
      </P>

      <H2>Guisachan hoy</H2>
      <P>
        La finca original donde se crió Nous está en ruinas — Lord Tweedmouth murió sin
        descendencia varón y la propiedad pasó por varias manos. Pero cada cinco años se celebra
        allí un <Strong>encuentro internacional de Golden Retrievers</Strong> donde se reúnen
        criadores de todo el mundo con sus perros, en la finca exacta donde su raza fue
        construida. La última gran reunión, en 2022, juntó 360 Goldens al lado de las ruinas.
      </P>
      <P>
        Todos descendientes, en mayor o menor proporción, de aquel cachorro amarillo que un
        zapatero de Brighton vendió por unos chelines en 1864.
      </P>
    </>
  )
}
