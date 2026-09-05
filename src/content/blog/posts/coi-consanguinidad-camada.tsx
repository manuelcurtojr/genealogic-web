import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'coi-consanguinidad-camada',
  title: 'COI: la consanguinidad de tu camada, calculada antes del cruce',
  excerpt:
    'El coeficiente de consanguinidad es la línea entre fijar virtudes y concentrar problemas. Así lo calcula el simulador de Genealogic sobre tu genealogía real.',
  date: '2026-09-05',
  category: 'Genética',
  heroImage: '/blog/coi-consanguinidad-camada.jpg',
  heroAlt: 'Ilustración de un árbol genealógico con ancestros comunes resaltados y un medidor de consanguinidad',
  readMinutes: 5,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        La consanguinidad es una de esas cosas que todo criador «lleva más o menos en la cabeza». El
        problema es que la cabeza no calcula senderos genéticos de cinco generaciones. El simulador
        de Genealogic, sí.
      </Lead>

      <H2>Qué es el COI</H2>
      <P>
        El <Strong>coeficiente de consanguinidad (COI)</Strong> mide cuánto comparten genéticamente
        los dos padres de una camada por tener antepasados en común. Un poco, bien dirigido,{' '}
        <Strong>fija</Strong> un tipo y consolida virtudes. Demasiado concentra también lo malo: se
        disparan los problemas de salud y se pierde vigor. Saber el número exacto es lo que te deja
        decidir con cabeza en vez de a ojo.
      </P>

      <H2>Cómo lo calcula el simulador</H2>
      <P>
        Cuando eliges macho y hembra, Genealogic construye el árbol de la camada y aplica el{' '}
        <Strong>método de senderos de Wright</Strong> sobre la ascendencia registrada (hasta cinco
        generaciones): busca los ancestros que aparecen a los dos lados, los resalta en el árbol y
        suma su aportación. El resultado es un porcentaje, no una corazonada.
      </P>

      <Callout kind="tip" title="El semáforo del COI">
        <UL>
          <LI><Strong>Verde (≤ 6,25%)</Strong>: margen cómodo.</LI>
          <LI><Strong>Naranja (≤ 12,5%)</Strong>: vigila; que lo justifique un objetivo de cría claro.</LI>
          <LI><Strong>Rojo (&gt; 12,5%)</Strong>: consanguinidad alta, piénsalo dos veces.</LI>
        </UL>
      </Callout>

      <H2>El detalle que lo cambia todo: la media de tu raza</H2>
      <P>
        Un mismo porcentaje no significa lo mismo en todas las razas. Por eso el simulador compara el
        COI de tu camada con la <Strong>media de la raza</Strong>: así sabes si tu cruce está por
        encima o por debajo de lo habitual en tu población, que es la referencia que de verdad
        importa.
      </P>

      <H2>Para qué te sirve</H2>
      <P>
        Para probar combinaciones antes de decidir. Si un cruce te sale en rojo, ves qué ancestro se
        está repitiendo y buscas una alternativa que baje el COI sin renunciar a lo que querías
        mejorar. Es planificación de cría de verdad, con un número delante.
      </P>

      <P>
        El COI proyectado está incluido en <Strong>Kennel Pro</Strong>, dentro del simulador de
        cruces. Cuanto más completa esté tu genealogía en Genealogic, más preciso es.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
