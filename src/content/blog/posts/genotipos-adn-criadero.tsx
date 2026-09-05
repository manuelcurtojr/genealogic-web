import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'genotipos-adn-criadero',
  title: 'La genética de tu criadero, ordenada: los genotipos de tus reproductores',
  excerpt:
    'El color y ciertos rasgos no son azar, son genes. Guardar el genotipo de cada reproductor te deja predecir camadas y evitar cruces de riesgo.',
  date: '2026-09-05',
  category: 'Genética',
  heroImage: '/blog/genotipos-adn-criadero.jpg',
  heroAlt: 'Ilustración de fichas de genotipo canino con hélices de ADN y loci de color',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        Los buenos criadores no dejan el color —ni la salud— al azar. Detrás de cada capa hay unos
        cuantos genes que siguen reglas conocidas. Tenerlos anotados por cada reproductor es criar
        con las cartas boca arriba.
      </Lead>

      <H2>Qué guardas</H2>
      <P>
        En Genealogic registras el <Strong>genotipo</Strong> de cada perro locus por locus —los genes
        que gobiernan el color de base, el patrón, la dilución, el merle, las manchas blancas…—. Lo
        puedes meter de dos formas:
      </P>
      <UL>
        <LI><Strong>Por ADN</Strong>: si tienes el test genético del perro, introduces sus resultados.</LI>
        <LI><Strong>Por color observado</Strong>: si no hay test, partes de la capa visible del animal.</LI>
      </UL>

      <H2>Para qué te sirve</H2>
      <UL>
        <LI>
          <Strong>Predecir camadas.</Strong> Con el genotipo de los padres, el simulador de cruces
          estima qué colores pueden salir y en qué proporción.
        </LI>
        <LI>
          <Strong>Evitar cruces de riesgo.</Strong> Ciertas combinaciones (el clásico merle × merle)
          traen problemas de salud. Tenerlo anotado te ayuda a no caer en ellas.
        </LI>
        <LI>
          <Strong>Vender con transparencia.</Strong> Enseñar que conoces —y documentas— la genética
          de tu línea es un argumento de peso frente al comprador serio.
        </LI>
      </UL>

      <Callout kind="tip" title="Se conecta con el simulador">
        Cuanto más completo tengas el genotipo de tus reproductores, más precisa es la predicción de
        color de las camadas en el simulador de cruces: pasa de «estimada» a «exacta».
      </Callout>

      <P>
        Los genotipos están incluidos en <Strong>Kennel Pro</Strong>. Es la base para llevar la
        genética de tu criadero como un profesional, no de memoria.
      </P>

      <PostCta variant="pro" />
    </>
  )
}
