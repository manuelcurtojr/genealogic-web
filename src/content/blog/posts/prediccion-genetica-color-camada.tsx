import { H2, P, Lead, UL, LI, Strong, Callout, PostCta } from '@/components/blog/prose'
import type { BlogPostMeta } from '../index'

export const metadata: BlogPostMeta = {
  slug: 'prediccion-genetica-color-camada',
  title: 'Qué color (y qué riesgos) saldrán en la camada: la predicción genética',
  excerpt:
    'El simulador de Genealogic cruza la genética de los padres y estima color y rasgos de la camada con porcentajes, y te avisa de combinaciones de riesgo.',
  date: '2026-09-05',
  category: 'Genética',
  heroImage: '/blog/prediccion-genetica-color-camada.jpg',
  heroAlt: 'Ilustración de cachorros de distintos colores con un pequeño diagrama de cruce genético',
  readMinutes: 4,
  author: { name: 'Manuel Curtó', role: 'Criador y fundador de Genealogic' },
}

export default function Post() {
  return (
    <>
      <Lead>
        «¿Saldrán atigrados? ¿Habrá algún negro? ¿Corro algún riesgo de salud con este cruce?» Son
        preguntas que antes se respondían con «ya veremos». El simulador de Genealogic las estima
        antes de la monta.
      </Lead>

      <H2>Cómo funciona</H2>
      <P>
        En la pestaña de <Strong>Genética</Strong>, el simulador toma la información de color de cada
        progenitor y hace un <Strong>cruce de Punnett locus por locus</Strong>: para cada gen que
        influye en la capa (color de base, patrón, dilución, manchas blancas, tipo de pelo…) calcula
        las <Strong>probabilidades</Strong> de cada resultado en la camada. No te dice «saldrán
        marrones»: te dice cuánto de probable es cada cosa.
      </P>

      <H2>Exacto o estimado, y por qué importa</H2>
      <P>
        La predicción es tan buena como los datos. El simulador te lo dice con un sello de confianza:
      </P>
      <UL>
        <LI>
          <Strong>Exacto</Strong>: cuando ambos padres tienen resultados de <Strong>ADN</Strong> de
          los genes implicados. Aquí las probabilidades son de manual.
        </LI>
        <LI>
          <Strong>Estimado</Strong>: cuando falta el ADN y el simulador <Strong>infiere</Strong> el
          genotipo a partir del color visible del perro. Orientativo, pero muy útil.
        </LI>
      </UL>

      <Callout kind="warning" title="Te avisa de los cruces de riesgo">
        No todo es estético. Algunas combinaciones genéticas conllevan problemas de salud —el caso
        clásico es <Strong>merle × merle</Strong>, con un 25% de «doble merle» y riesgo de sordera y
        ceguera. El simulador marca estos cruces para que no los hagas sin saberlo.
      </Callout>

      <H2>Para qué te sirve</H2>
      <P>
        Para no llevarte sorpresas —ni de color ni, sobre todo, de salud—. Puedes anticipar qué capa
        predominará en la camada, ajustar el cruce si buscas un resultado concreto y, lo más
        importante, evitar combinaciones que ponen en riesgo a los cachorros.
      </P>

      <P>
        La predicción genética está incluida en <Strong>Kennel Pro</Strong>, dentro del simulador de
        cruces. Si registras los resultados de ADN de tus reproductores en Genealogic, las
        estimaciones pasan de «estimado» a «exacto».
      </P>

      <PostCta variant="pro" />
    </>
  )
}
